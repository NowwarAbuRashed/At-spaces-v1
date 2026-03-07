import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApprovalRequestType,
  ApprovalStatus,
  BookingStatus,
  BranchStatus,
  PaymentStatus,
  Prisma,
  SecurityEventOutcome,
  SecurityEventType,
  UserStatus,
} from '@prisma/client';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createHmac, randomUUID, timingSafeEqual } from 'crypto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ApiPriceUnit, isApiPriceUnit } from '../../common/utils/api-price-unit.util';
import { SecurityEventsService } from '../auth/security-events.service';
import { AdminAnalyticsQueryDto } from './dto/admin-analytics-query.dto';
import { ApprovalRequestsQueryDto } from './dto/approval-requests-query.dto';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';
import { ReportExportRequestDto, ReportFormat } from './dto/report-export-request.dto';
import { RejectApprovalRequestDto } from './dto/reject-approval-request.dto';
import { UpdateBranchStatusDto } from './dto/update-branch-status.dto';
import { UpdateVendorStatusDto } from './dto/update-vendor-status.dto';
import { AdminBranchesQueryDto } from './dto/admin-branches-query.dto';
import { AdminVendorsQueryDto } from './dto/admin-vendors-query.dto';

interface RequestMeta {
  ipAddress: string;
  userAgent: string;
}

const CAPACITY_MIN = 1;
const CAPACITY_MAX = 10000;
const TOP_CITY_LIMIT = 5;
const MAX_PRESIGNED_SECONDS = 300;

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly securityEventsService: SecurityEventsService,
  ) {}

  async listApprovalRequests(query: ApprovalRequestsQueryDto) {
    const skip = (query.page - 1) * query.limit;
    const where: Prisma.ApprovalRequestWhereInput = {
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.approvalRequest.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          type: true,
          status: true,
          branchId: true,
          vendorServiceId: true,
          requestedById: true,
          reviewedById: true,
          reviewedAt: true,
          createdAt: true,
        },
      }),
      this.prisma.approvalRequest.count({ where }),
    ]);

    return {
      items,
      page: query.page,
      limit: query.limit,
      total,
      hasNext: skip + items.length < total,
    };
  }

  async getApprovalRequestDetails(id: number) {
    const request = await this.prisma.approvalRequest.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        type: true,
        status: true,
        branchId: true,
        vendorServiceId: true,
        requestedById: true,
        reviewedById: true,
        payload: true,
        payloadHmac: true,
        reason: true,
        reviewedAt: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    });

    if (!request || request.deletedAt) {
      throw new NotFoundException('Approval request not found');
    }

    const payload = request.payload as Record<string, unknown> | null;
    const recomputedPayloadHmac = payload ? this.signApprovalPayload(payload) : null;
    const payloadIntact =
      !request.payloadHmac || !recomputedPayloadHmac
        ? false
        : request.payloadHmac === recomputedPayloadHmac;

    return {
      id: request.id,
      type: request.type,
      status: request.status,
      branchId: request.branchId,
      vendorServiceId: request.vendorServiceId,
      requestedById: request.requestedById,
      reviewedById: request.reviewedById,
      payload,
      payloadHmac: request.payloadHmac,
      recomputedPayloadHmac,
      payloadIntact,
      reason: request.reason,
      reviewedAt: request.reviewedAt,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
    };
  }

  async approveRequest(adminId: number, requestId: number, requestMeta: RequestMeta) {
    const result = await this.prisma.$transaction(async (tx) => {
      const approvalRequest = await tx.approvalRequest.findUnique({
        where: {
          id: requestId,
        },
      });

      if (!approvalRequest || approvalRequest.deletedAt) {
        throw new NotFoundException('Approval request not found');
      }

      if (approvalRequest.status !== ApprovalStatus.pending) {
        throw new ConflictException('Approval request already reviewed');
      }
      this.assertApprovalPayloadIntegrity(approvalRequest);

      const changeSummary = await this.applyApprovalEffect(tx, approvalRequest);

      const reviewedAt = new Date();
      const updatedApproval = await tx.approvalRequest.update({
        where: {
          id: approvalRequest.id,
        },
        data: {
          status: ApprovalStatus.approved,
          reviewedById: adminId,
          reviewedAt,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: adminId,
          actorRole: 'admin',
          action: 'approval_request_approved',
          targetType: 'approval_request',
          targetId: approvalRequest.id,
          oldValue: {
            status: approvalRequest.status,
          } as Prisma.InputJsonValue,
          newValue: {
            status: updatedApproval.status,
            reviewedById: updatedApproval.reviewedById,
            reviewedAt: updatedApproval.reviewedAt?.toISOString(),
            changeSummary,
          } as Prisma.InputJsonValue,
          ipAddress: requestMeta.ipAddress,
          userAgent: requestMeta.userAgent,
        },
      });

      return updatedApproval;
    });

    await this.securityEventsService.log({
      eventType: SecurityEventType.approval_reviewed,
      outcome: SecurityEventOutcome.success,
      userId: adminId,
      requestMeta,
      metadata: {
        requestId: result.id,
        decision: 'approved',
      },
    });

    return {
      message: 'Approved',
    };
  }

  async rejectRequest(
    adminId: number,
    requestId: number,
    dto: RejectApprovalRequestDto,
    requestMeta: RequestMeta,
  ) {
    const reason = dto.reason.trim();
    if (reason.length < 10) {
      throw new BadRequestException('reason must be at least 10 characters long');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const approvalRequest = await tx.approvalRequest.findUnique({
        where: {
          id: requestId,
        },
      });

      if (!approvalRequest || approvalRequest.deletedAt) {
        throw new NotFoundException('Approval request not found');
      }

      if (approvalRequest.status !== ApprovalStatus.pending) {
        throw new ConflictException('Approval request already reviewed');
      }
      this.assertApprovalPayloadIntegrity(approvalRequest);

      const reviewedAt = new Date();
      const rejected = await tx.approvalRequest.update({
        where: {
          id: approvalRequest.id,
        },
        data: {
          status: ApprovalStatus.rejected,
          reason,
          reviewedById: adminId,
          reviewedAt,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: adminId,
          actorRole: 'admin',
          action: 'approval_request_rejected',
          targetType: 'approval_request',
          targetId: approvalRequest.id,
          oldValue: {
            status: approvalRequest.status,
          } as Prisma.InputJsonValue,
          newValue: {
            status: rejected.status,
            reason: rejected.reason,
            reviewedById: rejected.reviewedById,
            reviewedAt: rejected.reviewedAt?.toISOString(),
          } as Prisma.InputJsonValue,
          ipAddress: requestMeta.ipAddress,
          userAgent: requestMeta.userAgent,
        },
      });

      return rejected;
    });

    await this.securityEventsService.log({
      eventType: SecurityEventType.approval_reviewed,
      outcome: SecurityEventOutcome.success,
      userId: adminId,
      requestMeta,
      metadata: {
        requestId: updated.id,
        decision: 'rejected',
      },
    });

    return {
      message: 'Rejected',
    };
  }

  async listBranches(query: AdminBranchesQueryDto) {
    const skip = (query.page - 1) * query.limit;
    const where: Prisma.BranchWhereInput = {
      deletedAt: null,
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.branch.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: {
          id: 'asc',
        },
        select: {
          id: true,
          name: true,
          city: true,
          address: true,
          status: true,
          ownerId: true,
        },
      }),
      this.prisma.branch.count({ where }),
    ]);

    return {
      items,
      page: query.page,
      limit: query.limit,
      total,
      hasNext: skip + items.length < total,
    };
  }

  async updateBranchStatus(
    adminId: number,
    branchId: number,
    dto: UpdateBranchStatusDto,
    requestMeta: RequestMeta,
  ) {
    const branch = await this.prisma.branch.findUnique({
      where: {
        id: branchId,
      },
      select: {
        id: true,
        status: true,
        deletedAt: true,
      },
    });

    if (!branch || branch.deletedAt) {
      throw new NotFoundException('Branch not found');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const next = await tx.branch.update({
        where: {
          id: branch.id,
        },
        data: {
          status: dto.status as BranchStatus,
        },
        select: {
          id: true,
          status: true,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: adminId,
          actorRole: 'admin',
          action: 'branch_status_updated',
          targetType: 'branch',
          targetId: branch.id,
          oldValue: {
            status: branch.status,
          } as Prisma.InputJsonValue,
          newValue: {
            status: next.status,
          } as Prisma.InputJsonValue,
          ipAddress: requestMeta.ipAddress,
          userAgent: requestMeta.userAgent,
        },
      });

      return next;
    });

    await this.securityEventsService.log({
      eventType: SecurityEventType.branch_status_changed,
      outcome: SecurityEventOutcome.success,
      userId: adminId,
      requestMeta,
      metadata: {
        branchId,
        oldStatus: branch.status,
        newStatus: dto.status,
      },
    });

    return updated;
  }

  async listVendors(query: AdminVendorsQueryDto) {
    const skip = (query.page - 1) * query.limit;
    const where: Prisma.UserWhereInput = {
      role: 'vendor',
      deletedAt: null,
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: {
          id: 'asc',
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          status: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items,
      page: query.page,
      limit: query.limit,
      total,
      hasNext: skip + items.length < total,
    };
  }

  async updateVendorStatus(
    adminId: number,
    vendorId: number,
    dto: UpdateVendorStatusDto,
    requestMeta: RequestMeta,
  ) {
    const vendor = await this.prisma.user.findUnique({
      where: {
        id: vendorId,
      },
      select: {
        id: true,
        role: true,
        status: true,
        deletedAt: true,
      },
    });

    if (!vendor || vendor.deletedAt || vendor.role !== 'vendor') {
      throw new NotFoundException('Vendor not found');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const next = await tx.user.update({
        where: {
          id: vendor.id,
        },
        data: {
          status: dto.status as UserStatus,
        },
        select: {
          id: true,
          status: true,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: adminId,
          actorRole: 'admin',
          action: 'vendor_status_updated',
          targetType: 'vendor',
          targetId: vendor.id,
          oldValue: {
            status: vendor.status,
          } as Prisma.InputJsonValue,
          newValue: {
            status: next.status,
          } as Prisma.InputJsonValue,
          ipAddress: requestMeta.ipAddress,
          userAgent: requestMeta.userAgent,
        },
      });

      return next;
    });

    await this.securityEventsService.log({
      eventType: SecurityEventType.vendor_status_changed,
      outcome: SecurityEventOutcome.success,
      userId: adminId,
      requestMeta,
      metadata: {
        vendorId,
        oldStatus: vendor.status,
        newStatus: dto.status,
      },
    });

    return updated;
  }

  async getAnalytics(query: AdminAnalyticsQueryDto) {
    const { fromDate, toDate } = this.parseDateRange(query.from, query.to);
    const bookingWhere: Prisma.BookingWhereInput = {
      deletedAt: null,
      createdAt: {
        gte: fromDate,
        lt: toDate,
      },
    };

    const [totalBookings, quantityAggregate, revenueAggregate, cityRows, capacityAggregate] =
      await this.prisma.$transaction([
        this.prisma.booking.count({
          where: bookingWhere,
        }),
        this.prisma.booking.aggregate({
          where: bookingWhere,
          _sum: {
            quantity: true,
          },
        }),
        this.prisma.booking.aggregate({
          where: {
            ...bookingWhere,
            paymentStatus: PaymentStatus.paid,
            status: {
              not: BookingStatus.cancelled,
            },
          },
          _sum: {
            totalPrice: true,
          },
        }),
        this.prisma.booking.findMany({
          where: bookingWhere,
          select: {
            branch: {
              select: {
                city: true,
              },
            },
          },
        }),
        this.prisma.vendorService.aggregate({
          where: {
            deletedAt: null,
          },
          _sum: {
            maxCapacity: true,
          },
        }),
      ]);

    const bookedQuantity = quantityAggregate._sum.quantity ?? 0;
    const totalCapacity = capacityAggregate._sum.maxCapacity ?? 0;
    const occupancyRate =
      totalCapacity <= 0
        ? 0
        : Number(Math.min((bookedQuantity / totalCapacity) * 100, 100).toFixed(2));

    const revenue = Number((revenueAggregate._sum.totalPrice ?? 0).toFixed(2));
    const cityCounts = new Map<string, number>();

    for (const row of cityRows) {
      const city = row.branch.city;
      cityCounts.set(city, (cityCounts.get(city) ?? 0) + 1);
    }

    const topCities = [...cityCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, TOP_CITY_LIMIT)
      .map(([city, bookings]) => ({ city, bookings }));

    return {
      totalBookings,
      occupancyRate,
      revenue,
      topCities,
    };
  }

  async exportReport(
    adminId: number,
    dto: ReportExportRequestDto,
    requestMeta: RequestMeta,
  ) {
    const reportPayload = await this.buildReportPayload(dto);
    const key = this.buildReportStorageKey(dto.reportType, dto.format);
    const expiresIn = this.resolvePresignedExpirySeconds();
    const url = await this.storeAndSignReport(key, dto.format, reportPayload, expiresIn);

    await this.prisma.auditLog.create({
      data: {
        actorId: adminId,
        actorRole: 'admin',
        action: 'report_exported',
        targetType: 'report',
        oldValue: Prisma.JsonNull,
        newValue: {
          reportType: dto.reportType,
          format: dto.format,
          filters: dto.filters,
          storageKey: key,
          expiresIn,
        } as Prisma.InputJsonValue,
        ipAddress: requestMeta.ipAddress,
        userAgent: requestMeta.userAgent,
      },
    });

    await this.securityEventsService.log({
      eventType: SecurityEventType.report_exported,
      outcome: SecurityEventOutcome.success,
      userId: adminId,
      requestMeta,
      metadata: {
        reportType: dto.reportType,
        format: dto.format,
        storageKey: key,
      },
    });

    return {
      url,
      expiresIn,
    };
  }

  async listAuditLogs(query: AuditLogQueryDto) {
    const skip = (query.page - 1) * query.limit;
    const where: Prisma.AuditLogWhereInput = {};

    if (query.from || query.to) {
      const fromDate = query.from
        ? new Date(`${query.from}T00:00:00.000Z`)
        : new Date('1970-01-01T00:00:00.000Z');
      const toDate = query.to
        ? new Date(`${query.to}T00:00:00.000Z`)
        : new Date('9999-12-31T00:00:00.000Z');

      where.createdAt = {
        gte: fromDate,
        lt: new Date(toDate.getTime() + 24 * 60 * 60 * 1000),
      };
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          actorId: true,
          actorRole: true,
          action: true,
          targetType: true,
          targetId: true,
          oldValue: true,
          newValue: true,
          ipAddress: true,
          userAgent: true,
          createdAt: true,
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items: items.map((item) => ({
        id: item.id,
        actorId: item.actorId,
        action: item.action,
        entity: item.targetType,
        entityId: item.targetId,
        timestamp: item.createdAt,
        metadata: {
          actorRole: item.actorRole,
          oldValue: item.oldValue,
          newValue: item.newValue,
          ipAddress: item.ipAddress,
          userAgent: item.userAgent,
        },
      })),
      page: query.page,
      limit: query.limit,
      total,
      hasNext: skip + items.length < total,
    };
  }

  private async applyApprovalEffect(
    tx: Prisma.TransactionClient,
    approvalRequest: {
      id: number;
      type: ApprovalRequestType;
      branchId: number | null;
      vendorServiceId: number | null;
      requestedById: number | null;
      payload: Prisma.JsonValue | null;
    },
  ): Promise<Record<string, unknown>> {
    const payload = (approvalRequest.payload ?? {}) as Record<string, unknown>;

    switch (approvalRequest.type) {
      case ApprovalRequestType.vendor_registration:
        await this.applyVendorRegistrationApproval(tx, approvalRequest);
        return {
          approvedEntity: 'vendor_registration',
          vendorId: approvalRequest.requestedById,
          branchId: approvalRequest.branchId,
        };
      case ApprovalRequestType.capacity_request:
        return this.applyCapacityApproval(tx, approvalRequest, payload);
      case ApprovalRequestType.branch_update:
        return this.applyBranchUpdateApproval(tx, approvalRequest, payload);
      case ApprovalRequestType.vendor_service_update:
        return this.applyVendorServiceUpdateApproval(tx, approvalRequest, payload);
      default:
        throw new UnprocessableEntityException('Unsupported approval request type');
    }
  }

  private async applyVendorRegistrationApproval(
    tx: Prisma.TransactionClient,
    approvalRequest: {
      requestedById: number | null;
      branchId: number | null;
    },
  ): Promise<void> {
    if (approvalRequest.requestedById) {
      await tx.user.update({
        where: {
          id: approvalRequest.requestedById,
        },
        data: {
          status: UserStatus.active,
        },
      });
    }

    if (approvalRequest.branchId) {
      await tx.branch.update({
        where: {
          id: approvalRequest.branchId,
        },
        data: {
          status: BranchStatus.active,
        },
      });
    }
  }

  private async applyCapacityApproval(
    tx: Prisma.TransactionClient,
    approvalRequest: {
      vendorServiceId: number | null;
    },
    payload: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const targetVendorServiceId =
      approvalRequest.vendorServiceId ?? this.parseNumber(payload.vendorServiceId, 'vendorServiceId');
    const newCapacity = this.parseNumber(payload.newCapacity, 'newCapacity');

    if (newCapacity < CAPACITY_MIN || newCapacity > CAPACITY_MAX) {
      throw new UnprocessableEntityException(
        `newCapacity must be between ${CAPACITY_MIN} and ${CAPACITY_MAX}`,
      );
    }

    const vendorService = await tx.vendorService.findUnique({
      where: {
        id: targetVendorServiceId,
      },
      select: {
        id: true,
        maxCapacity: true,
        deletedAt: true,
      },
    });

    if (!vendorService || vendorService.deletedAt) {
      throw new NotFoundException('Vendor service not found');
    }

    await tx.vendorService.update({
      where: {
        id: vendorService.id,
      },
      data: {
        maxCapacity: newCapacity,
      },
    });

    return {
      approvedEntity: 'vendor_service_capacity',
      vendorServiceId: vendorService.id,
      oldCapacity: vendorService.maxCapacity,
      newCapacity,
    };
  }

  private async applyBranchUpdateApproval(
    tx: Prisma.TransactionClient,
    approvalRequest: {
      branchId: number | null;
    },
    payload: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const branchId = approvalRequest.branchId ?? this.parseNumber(payload.branchId, 'branchId');
    const branch = await tx.branch.findUnique({
      where: {
        id: branchId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        city: true,
        address: true,
        latitude: true,
        longitude: true,
        deletedAt: true,
      },
    });

    if (!branch || branch.deletedAt) {
      throw new NotFoundException('Branch not found');
    }

    const data: Prisma.BranchUpdateInput = {
      ...(typeof payload.name === 'string' ? { name: payload.name.trim() } : {}),
      ...(typeof payload.description === 'string'
        ? { description: payload.description.trim() }
        : {}),
      ...(typeof payload.city === 'string' ? { city: payload.city.trim() } : {}),
      ...(typeof payload.address === 'string' ? { address: payload.address.trim() } : {}),
      ...(typeof payload.latitude === 'number' ? { latitude: payload.latitude } : {}),
      ...(typeof payload.longitude === 'number' ? { longitude: payload.longitude } : {}),
    };

    await tx.branch.update({
      where: {
        id: branch.id,
      },
      data,
    });

    return {
      approvedEntity: 'branch',
      branchId: branch.id,
    };
  }

  private async applyVendorServiceUpdateApproval(
    tx: Prisma.TransactionClient,
    approvalRequest: {
      vendorServiceId: number | null;
    },
    payload: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const vendorServiceId =
      approvalRequest.vendorServiceId ??
      this.parseNumber(payload.vendorServiceId, 'vendorServiceId');
    const vendorService = await tx.vendorService.findUnique({
      where: {
        id: vendorServiceId,
      },
      select: {
        id: true,
        pricePerUnit: true,
        priceUnit: true,
        maxCapacity: true,
        deletedAt: true,
      },
    });

    if (!vendorService || vendorService.deletedAt) {
      throw new NotFoundException('Vendor service not found');
    }

    const data: Prisma.VendorServiceUpdateInput = {
      ...(typeof payload.pricePerUnit === 'number'
        ? { pricePerUnit: payload.pricePerUnit }
        : {}),
      ...(typeof payload.priceUnit === 'string' && this.isPriceUnit(payload.priceUnit)
        ? { priceUnit: payload.priceUnit }
        : {}),
      ...(typeof payload.maxCapacity === 'number'
        ? { maxCapacity: payload.maxCapacity }
        : {}),
    };

    if (Object.keys(data).length > 0) {
      await tx.vendorService.update({
        where: {
          id: vendorService.id,
        },
        data,
      });
    }

    return {
      approvedEntity: 'vendor_service',
      vendorServiceId: vendorService.id,
    };
  }

  private parseNumber(value: unknown, fieldName: string): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new UnprocessableEntityException(`${fieldName} must be a number`);
    }

    return value;
  }

  private isPriceUnit(value: string): value is ApiPriceUnit {
    return isApiPriceUnit(value);
  }

  private parseDateRange(from: string, to: string): { fromDate: Date; toDate: Date } {
    const fromDate = new Date(`${from}T00:00:00.000Z`);
    const toDateInclusive = new Date(`${to}T00:00:00.000Z`);
    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDateInclusive.getTime())) {
      throw new BadRequestException('Invalid date range');
    }

    if (fromDate.getTime() > toDateInclusive.getTime()) {
      throw new BadRequestException('from must be before or equal to to');
    }

    return {
      fromDate,
      toDate: new Date(toDateInclusive.getTime() + 24 * 60 * 60 * 1000),
    };
  }

  private signApprovalPayload(payload: Record<string, unknown>): string {
    const key = this.getRequiredConfig('HMAC_APPROVAL_REQUESTS_KEY');

    const canonicalPayload = this.toCanonicalJson(payload);
    return createHmac('sha256', key).update(canonicalPayload).digest('hex');
  }

  private assertApprovalPayloadIntegrity(approvalRequest: {
    type: ApprovalRequestType;
    payload: Prisma.JsonValue | null;
    payloadHmac: string | null;
  }): void {
    const payload = approvalRequest.payload as Record<string, unknown> | null;
    const payloadHmac = approvalRequest.payloadHmac;

    const requiresIntegrityCheck =
      approvalRequest.type === ApprovalRequestType.capacity_request ||
      approvalRequest.type === ApprovalRequestType.vendor_registration ||
      approvalRequest.type === ApprovalRequestType.branch_update ||
      approvalRequest.type === ApprovalRequestType.vendor_service_update;

    if (!requiresIntegrityCheck && !payload && !payloadHmac) {
      return;
    }

    if (!payload || !payloadHmac) {
      throw new UnprocessableEntityException('Approval payload integrity check failed');
    }

    const recomputed = this.signApprovalPayload(payload);
    const providedBuffer = this.hexToBuffer(payloadHmac);
    const recomputedBuffer = this.hexToBuffer(recomputed);

    if (!providedBuffer || !recomputedBuffer) {
      throw new UnprocessableEntityException('Approval payload integrity check failed');
    }

    if (
      providedBuffer.length !== recomputedBuffer.length ||
      !timingSafeEqual(providedBuffer, recomputedBuffer)
    ) {
      throw new UnprocessableEntityException('Approval payload integrity check failed');
    }
  }

  private hexToBuffer(value: string): Buffer | null {
    if (!/^[0-9a-f]+$/i.test(value) || value.length % 2 !== 0) {
      return null;
    }

    return Buffer.from(value, 'hex');
  }

  private toCanonicalJson(value: unknown): string {
    return JSON.stringify(this.sortValue(value));
  }

  private sortValue(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => this.sortValue(item));
    }

    if (value && typeof value === 'object') {
      const record = value as Record<string, unknown>;
      const sortedRecord: Record<string, unknown> = {};

      for (const key of Object.keys(record).sort()) {
        sortedRecord[key] = this.sortValue(record[key]);
      }

      return sortedRecord;
    }

    return value;
  }

  private buildReportStorageKey(reportType: string, format: ReportFormat): string {
    const normalizedType = reportType.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    return `reports/${normalizedType}/${Date.now()}-${randomUUID()}.${format}`;
  }

  private resolvePresignedExpirySeconds(): number {
    const raw =
      this.configService.get<string>('S3_PRESIGN_EXP_SECONDS') ??
      this.configService.get<string>('AWS_S3_PRESIGN_EXP_SECONDS') ??
      '300';
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return MAX_PRESIGNED_SECONDS;
    }

    return Math.min(Math.floor(parsed), MAX_PRESIGNED_SECONDS);
  }

  private async buildReportPayload(dto: ReportExportRequestDto): Promise<string> {
    const filters = dto.filters ?? {};
    const from = typeof filters.from === 'string' ? filters.from : null;
    const to = typeof filters.to === 'string' ? filters.to : null;

    const analytics =
      from && to
        ? await this.getAnalytics({
            from,
            to,
          })
        : null;

    if (dto.format === ReportFormat.csv) {
      const rows = [
        ['reportType', dto.reportType],
        ['generatedAt', new Date().toISOString()],
        ['filters', JSON.stringify(filters)],
      ];

      if (analytics) {
        rows.push(['totalBookings', analytics.totalBookings.toString()]);
        rows.push(['occupancyRate', analytics.occupancyRate.toString()]);
        rows.push(['revenue', analytics.revenue.toString()]);
        rows.push(['topCities', JSON.stringify(analytics.topCities)]);
      }

      return rows.map((row) => row.join(',')).join('\n');
    }

    return JSON.stringify(
      {
        reportType: dto.reportType,
        generatedAt: new Date().toISOString(),
        filters,
        analytics,
      },
      null,
      2,
    );
  }

  private async storeAndSignReport(
    key: string,
    format: ReportFormat,
    payload: string,
    expiresIn: number,
  ): Promise<string> {
    const mockMode =
      this.configService.get<string>('REPORT_EXPORT_MOCK') === 'true' ||
      this.configService.get<string>('NODE_ENV') === 'test';

    if (mockMode) {
      return `https://mock-s3.local/${encodeURIComponent(key)}?expiresIn=${expiresIn}`;
    }

    const bucket =
      this.configService.get<string>('S3_BUCKET_PRIVATE_REPORTS') ??
      this.configService.get<string>('AWS_S3_BUCKET_PRIVATE_REPORTS');
    const region = this.configService.get<string>('AWS_REGION');
    if (!bucket || !region) {
      throw new ServiceUnavailableException('Report export storage is not configured');
    }

    const s3 = new S3Client({ region });
    const sseMode =
      this.configService.get<string>('S3_SSE_MODE') ??
      this.configService.get<string>('AWS_S3_SSE_MODE') ??
      'SSE-S3';
    const kmsKeyId =
      this.configService.get<string>('S3_KMS_KEY_ID') ??
      this.configService.get<string>('AWS_S3_KMS_KEY_ID');

    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: payload,
        ContentType: this.resolveContentType(format),
        ...(sseMode === 'SSE-KMS'
          ? {
              ServerSideEncryption: 'aws:kms',
              ...(kmsKeyId ? { SSEKMSKeyId: kmsKeyId } : {}),
            }
          : { ServerSideEncryption: 'AES256' }),
      }),
    );

    const signedUrl = await getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
      { expiresIn },
    );

    return signedUrl;
  }

  private resolveContentType(format: ReportFormat): string {
    switch (format) {
      case ReportFormat.csv:
        return 'text/csv';
      case ReportFormat.pdf:
        return 'application/pdf';
      case ReportFormat.xlsx:
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      default:
        return 'application/octet-stream';
    }
  }

  private getRequiredConfig(key: string): string {
    const value = process.env[key] ?? this.configService.get<string>(key);
    if (!value || value.trim().length === 0) {
      throw new InternalServerErrorException(`Missing required config: ${key}`);
    }

    return value;
  }
}
