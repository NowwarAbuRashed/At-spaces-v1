import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApprovalRequestType,
  ApprovalStatus,
  BookingStatus,
  PriceUnit,
  Prisma,
} from '@prisma/client';
import { createHmac } from 'crypto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { toApiPriceUnit } from '../../common/utils/api-price-unit.util';
import { CreateCapacityRequestDto } from './dto/create-capacity-request.dto';
import { UpdateVendorBookingStatusDto } from './dto/update-vendor-booking-status.dto';
import { UpdateVendorBranchDto } from './dto/update-vendor-branch.dto';
import { UpdateVendorServicePriceDto } from './dto/update-vendor-service-price.dto';
import {
  AvailabilitySlotDto,
  UpsertVendorAvailabilityDto,
} from './dto/upsert-vendor-availability.dto';
import { VendorBookingsQueryDto } from './dto/vendor-bookings-query.dto';
import { VendorBranchStatus } from './dto/vendor-dashboard-response.dto';
import { VendorServiceListQueryDto } from './dto/vendor-service-list-query.dto';
import { VendorServiceResponseDto } from './dto/vendor-service-response.dto';

const DASHBOARD_TODAY_BOOKING_STATUSES: BookingStatus[] = [
  BookingStatus.pending,
  BookingStatus.confirmed,
  BookingStatus.completed,
  BookingStatus.no_show,
];

const DASHBOARD_UPCOMING_BOOKING_STATUSES: BookingStatus[] = [
  BookingStatus.pending,
  BookingStatus.confirmed,
];

const CAPACITY_MIN = 1;
const CAPACITY_MAX = 10000;
const CAPACITY_REQUEST_PENDING_LIMIT = 3;
const CAPACITY_RATE_WINDOW_SECONDS = 600;
const CAPACITY_RATE_VENDOR_MAX = 10;
const CAPACITY_RATE_IP_MAX = 20;

interface VendorServiceOwnershipRecord {
  id: number;
  vendorId: number;
  branchId: number;
  serviceId: number;
  name: string | null;
  pricePerUnit: Prisma.Decimal;
  priceUnit: PriceUnit;
  maxCapacity: number;
  isAvailable: boolean;
  deletedAt: Date | null;
  service: {
    name: string;
  };
  branch: {
    id: number;
    ownerId: number | null;
    deletedAt: Date | null;
  };
}

@Injectable()
export class VendorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  async getDashboard(vendorId: number) {
    const now = new Date();
    const startOfToday = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        0,
        0,
        0,
        0,
      ),
    );
    const endOfToday = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1,
        0,
        0,
        0,
        0,
      ),
    );

    const vendorServices = await this.prisma.vendorService.findMany({
      where: {
        vendorId,
        deletedAt: null,
        branch: {
          ownerId: vendorId,
          deletedAt: null,
        },
      },
      select: {
        id: true,
        maxCapacity: true,
      },
    });

    if (vendorServices.length === 0) {
      return {
        todayOccupancy: 0,
        upcomingBookings: 0,
        branchStatus: VendorBranchStatus.calm,
      };
    }

    const vendorServiceIds = vendorServices.map((service) => service.id);
    const totalCapacity = vendorServices.reduce(
      (sum, service) => sum + service.maxCapacity,
      0,
    );

    const [todayBookings, upcomingBookings] = await this.prisma.$transaction([
      this.prisma.booking.aggregate({
        where: {
          vendorServiceId: {
            in: vendorServiceIds,
          },
          deletedAt: null,
          status: {
            in: DASHBOARD_TODAY_BOOKING_STATUSES,
          },
          startTime: {
            lt: endOfToday,
          },
          endTime: {
            gt: startOfToday,
          },
        },
        _sum: {
          quantity: true,
        },
      }),
      this.prisma.booking.count({
        where: {
          vendorServiceId: {
            in: vendorServiceIds,
          },
          deletedAt: null,
          status: {
            in: DASHBOARD_UPCOMING_BOOKING_STATUSES,
          },
          startTime: {
            gte: now,
          },
        },
      }),
    ]);

    const occupiedQuantity = todayBookings._sum.quantity ?? 0;
    const todayOccupancy =
      totalCapacity === 0
        ? 0
        : Math.round(Math.min((occupiedQuantity / totalCapacity) * 100, 100));

    return {
      todayOccupancy,
      upcomingBookings,
      branchStatus: this.resolveBranchStatus(todayOccupancy),
    };
  }

  async listMyBranches(vendorId: number) {
    return this.prisma.branch.findMany({
      where: {
        ownerId: vendorId,
        deletedAt: null,
      },
      orderBy: {
        id: 'asc',
      },
      select: {
        id: true,
        name: true,
        city: true,
        address: true,
      },
    });
  }

  async updateBranch(vendorId: number, branchId: number, dto: UpdateVendorBranchDto) {
    await this.assertVendorOwnsBranch(vendorId, branchId);

    const data: Prisma.BranchUpdateInput = {
      name: dto.name.trim(),
      city: dto.city.trim(),
      address: dto.address.trim(),
    };

    if (dto.description !== undefined) {
      data.description = dto.description?.trim() ?? null;
    }

    if (dto.latitude !== undefined) {
      data.latitude = dto.latitude;
    }

    if (dto.longitude !== undefined) {
      data.longitude = dto.longitude;
    }

    await this.prisma.branch.update({
      where: {
        id: branchId,
      },
      data,
    });

    return this.getVendorBranchDetails(vendorId, branchId);
  }

  async listVendorServices(vendorId: number, query: VendorServiceListQueryDto) {
    if (query.branchId) {
      await this.assertVendorOwnsBranch(vendorId, query.branchId);
    }

    const where: Prisma.VendorServiceWhereInput = {
      vendorId,
      deletedAt: null,
      branch: {
        ownerId: vendorId,
        deletedAt: null,
      },
      ...(query.branchId ? { branchId: query.branchId } : {}),
    };

    const skip = (query.page - 1) * query.limit;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.vendorService.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: {
          id: 'asc',
        },
        select: {
          id: true,
          serviceId: true,
          name: true,
          pricePerUnit: true,
          priceUnit: true,
          maxCapacity: true,
          isAvailable: true,
          service: {
            select: {
              name: true,
            },
          },
        },
      }),
      this.prisma.vendorService.count({ where }),
    ]);

    return {
      items: items.map((item) => this.toVendorServiceResponse(item)),
      page: query.page,
      limit: query.limit,
      total,
      hasNext: skip + items.length < total,
    };
  }

  async getVendorService(vendorId: number, vendorServiceId: number) {
    const vendorService = await this.getOwnedVendorService(vendorId, vendorServiceId);
    return this.toVendorServiceResponse(vendorService);
  }

  async updateVendorServicePrice(
    vendorId: number,
    vendorServiceId: number,
    dto: UpdateVendorServicePriceDto,
  ) {
    await this.getOwnedVendorService(vendorId, vendorServiceId);

    const updated = await this.prisma.vendorService.update({
      where: {
        id: vendorServiceId,
      },
      data: {
        pricePerUnit: dto.pricePerUnit,
        priceUnit: dto.priceUnit,
      },
      select: {
        id: true,
        serviceId: true,
        name: true,
        pricePerUnit: true,
        priceUnit: true,
        maxCapacity: true,
        isAvailable: true,
        service: {
          select: {
            name: true,
          },
        },
      },
    });

    return this.toVendorServiceResponse(updated);
  }

  async createCapacityRequest(
    vendorId: number,
    vendorServiceId: number,
    dto: CreateCapacityRequestDto,
    requestIp: string,
  ) {
    this.validateCapacityBounds(dto.newCapacity);
    const vendorService = await this.getOwnedVendorService(vendorId, vendorServiceId);
    await this.enforceCapacityRateLimit(vendorId, requestIp);
    await this.enforcePendingCapacityLimit(vendorId);
    const reason = dto.reason.trim();
    const payload = {
      branchId: vendorService.branchId,
      currentCapacity: vendorService.maxCapacity,
      newCapacity: dto.newCapacity,
      reason,
      requestedAt: new Date().toISOString(),
      vendorId,
      vendorServiceId: vendorService.id,
    };

    const payloadHmac = this.signApprovalPayload(payload);
    const request = await this.prisma.approvalRequest.create({
      data: {
        type: ApprovalRequestType.capacity_request,
        status: ApprovalStatus.pending,
        branchId: vendorService.branchId,
        vendorServiceId: vendorService.id,
        requestedById: vendorId,
        payload: payload as Prisma.InputJsonValue,
        payloadHmac,
        reason,
      },
      select: {
        id: true,
        status: true,
      },
    });

    return {
      requestId: request.id,
      status: request.status,
    };
  }

  async upsertAvailability(vendorId: number, dto: UpsertVendorAvailabilityDto) {
    const vendorService = await this.getOwnedVendorService(vendorId, dto.vendorServiceId);
    const { dayStart, dayEnd } = this.parseDateBounds(dto.date);
    const slots = this.normalizeAvailabilitySlots(
      dayStart,
      dto.slots,
      vendorService.maxCapacity,
    );

    await this.prisma.$transaction(async (tx) => {
      const touchedIds: number[] = [];

      for (const slot of slots) {
        const row = await tx.availability.upsert({
          where: {
            vendorServiceId_slotStart_slotEnd: {
              vendorServiceId: vendorService.id,
              slotStart: slot.slotStart,
              slotEnd: slot.slotEnd,
            },
          },
          update: {
            availableUnits: slot.availableUnits,
            isBlocked: false,
            deletedAt: null,
          },
          create: {
            vendorServiceId: vendorService.id,
            slotStart: slot.slotStart,
            slotEnd: slot.slotEnd,
            availableUnits: slot.availableUnits,
            isBlocked: false,
          },
          select: {
            id: true,
          },
        });

        touchedIds.push(row.id);
      }

      await tx.availability.updateMany({
        where: {
          vendorServiceId: vendorService.id,
          deletedAt: null,
          slotStart: {
            gte: dayStart,
            lt: dayEnd,
          },
          ...(touchedIds.length > 0 ? { id: { notIn: touchedIds } } : {}),
        },
        data: {
          deletedAt: new Date(),
        },
      });
    });

    return {
      message: 'Availability updated',
    };
  }

  async listVendorBookings(vendorId: number, query: VendorBookingsQueryDto) {
    const vendorServices = await this.prisma.vendorService.findMany({
      where: {
        vendorId,
        deletedAt: null,
        branch: {
          ownerId: vendorId,
          deletedAt: null,
        },
      },
      select: {
        id: true,
      },
    });

    if (vendorServices.length === 0) {
      return {
        items: [],
        page: query.page,
        limit: query.limit,
        total: 0,
        hasNext: false,
      };
    }

    const where: Prisma.BookingWhereInput = {
      deletedAt: null,
      vendorServiceId: {
        in: vendorServices.map((item) => item.id),
      },
    };

    if (query.date) {
      const { dayStart, dayEnd } = this.parseDateBounds(query.date);
      where.startTime = {
        gte: dayStart,
        lt: dayEnd,
      };
    }

    const skip = (query.page - 1) * query.limit;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.booking.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: {
          startTime: 'desc',
        },
        select: {
          id: true,
          bookingNumber: true,
          vendorServiceId: true,
          branchId: true,
          startTime: true,
          endTime: true,
          quantity: true,
          status: true,
          branch: {
            select: {
              name: true,
            },
          },
        },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return {
      items: items.map((item) => ({
        id: item.id,
        bookingNumber: item.bookingNumber,
        vendorServiceId: item.vendorServiceId,
        branchId: item.branchId,
        branchName: item.branch.name,
        startTime: item.startTime,
        endTime: item.endTime,
        quantity: item.quantity,
        status: item.status,
      })),
      page: query.page,
      limit: query.limit,
      total,
      hasNext: skip + items.length < total,
    };
  }

  async updateVendorBookingStatus(
    vendorId: number,
    bookingId: number,
    dto: UpdateVendorBookingStatusDto,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: {
        id: bookingId,
      },
      select: {
        id: true,
        status: true,
        deletedAt: true,
        vendorService: {
          select: {
            vendorId: true,
            branch: {
              select: {
                ownerId: true,
                deletedAt: true,
              },
            },
          },
        },
      },
    });

    if (!booking || booking.deletedAt) {
      throw new NotFoundException('Booking not found');
    }

    if (
      booking.vendorService.vendorId !== vendorId ||
      booking.vendorService.branch.ownerId !== vendorId ||
      booking.vendorService.branch.deletedAt
    ) {
      throw new ForbiddenException('You do not have access to this booking');
    }

    if (
      booking.status === BookingStatus.cancelled ||
      booking.status === BookingStatus.completed ||
      booking.status === BookingStatus.no_show
    ) {
      throw new ConflictException('Booking status cannot be updated');
    }

    const updated = await this.prisma.booking.update({
      where: {
        id: booking.id,
      },
      data: {
        status: dto.status as BookingStatus,
      },
      select: {
        id: true,
        status: true,
      },
    });

    return updated;
  }

  private async getVendorBranchDetails(vendorId: number, branchId: number) {
    const branch = await this.prisma.branch.findFirst({
      where: {
        id: branchId,
        ownerId: vendorId,
        deletedAt: null,
      },
      include: {
        branchFacilities: {
          include: {
            facility: true,
          },
          orderBy: {
            facilityId: 'asc',
          },
        },
        vendorServices: {
          where: {
            vendorId,
            deletedAt: null,
          },
          include: {
            service: true,
          },
          orderBy: {
            id: 'asc',
          },
        },
      },
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    return {
      id: branch.id,
      name: branch.name,
      description: branch.description,
      city: branch.city,
      address: branch.address,
      latitude: branch.latitude ? Number(branch.latitude) : null,
      longitude: branch.longitude ? Number(branch.longitude) : null,
      facilities: branch.branchFacilities
        .filter((branchFacility) => branchFacility.facility.isActive)
        .map((branchFacility) => ({
          id: branchFacility.facility.id,
          name: branchFacility.facility.name,
          icon: branchFacility.facility.icon,
          isAvailable: branchFacility.isAvailable,
          description: branchFacility.facility.description,
        })),
      services: branch.vendorServices
        .filter((vendorService) => vendorService.service.isActive)
        .map((vendorService) => ({
          vendorServiceId: vendorService.id,
          serviceId: vendorService.serviceId,
          name: vendorService.name ?? vendorService.service.name,
          pricePerUnit: Number(vendorService.pricePerUnit),
          priceUnit: toApiPriceUnit(vendorService.priceUnit),
          maxCapacity: vendorService.maxCapacity,
          isAvailable: vendorService.isAvailable,
        })),
    };
  }

  private async assertVendorOwnsBranch(vendorId: number, branchId: number): Promise<void> {
    const branch = await this.prisma.branch.findUnique({
      where: {
        id: branchId,
      },
      select: {
        ownerId: true,
        deletedAt: true,
      },
    });

    if (!branch || branch.deletedAt) {
      throw new NotFoundException('Branch not found');
    }

    if (branch.ownerId !== vendorId) {
      throw new ForbiddenException('You do not have access to this branch');
    }
  }

  private async getOwnedVendorService(
    vendorId: number,
    vendorServiceId: number,
  ): Promise<VendorServiceOwnershipRecord> {
    const vendorService = await this.prisma.vendorService.findUnique({
      where: {
        id: vendorServiceId,
      },
      include: {
        service: {
          select: {
            name: true,
          },
        },
        branch: {
          select: {
            id: true,
            ownerId: true,
            deletedAt: true,
          },
        },
      },
    });

    if (!vendorService || vendorService.deletedAt) {
      throw new NotFoundException('Vendor service not found');
    }

    if (
      vendorService.vendorId !== vendorId ||
      vendorService.branch.ownerId !== vendorId ||
      vendorService.branch.deletedAt
    ) {
      throw new ForbiddenException('You do not have access to this vendor service');
    }

    return vendorService;
  }

  private toVendorServiceResponse(service: {
    id: number;
    serviceId: number;
    name: string | null;
    pricePerUnit: Prisma.Decimal;
    priceUnit: PriceUnit;
    maxCapacity: number;
    isAvailable: boolean;
    service: {
      name: string;
    };
  }): VendorServiceResponseDto {
    return {
      vendorServiceId: service.id,
      serviceId: service.serviceId,
      name: service.name ?? service.service.name,
      pricePerUnit: Number(service.pricePerUnit),
      priceUnit: toApiPriceUnit(service.priceUnit),
      maxCapacity: service.maxCapacity,
      isAvailable: service.isAvailable,
    };
  }

  private resolveBranchStatus(todayOccupancy: number): VendorBranchStatus {
    if (todayOccupancy >= 80) {
      return VendorBranchStatus.busy;
    }

    if (todayOccupancy >= 40) {
      return VendorBranchStatus.moderate;
    }

    return VendorBranchStatus.calm;
  }

  private validateCapacityBounds(newCapacity: number): void {
    if (newCapacity < CAPACITY_MIN || newCapacity > CAPACITY_MAX) {
      throw new UnprocessableEntityException(
        `newCapacity must be between ${CAPACITY_MIN} and ${CAPACITY_MAX}`,
      );
    }
  }

  private async enforceCapacityRateLimit(vendorId: number, requestIp: string): Promise<void> {
    const client = this.redisService.getClient();
    const vendorKey = `vendors:capacity-request:vendor:${vendorId}`;
    const ipKey = `vendors:capacity-request:ip:${requestIp || 'unknown'}`;

    const vendorCount = await client.incr(vendorKey);
    if (vendorCount === 1) {
      await client.expire(vendorKey, CAPACITY_RATE_WINDOW_SECONDS);
    }

    if (vendorCount > CAPACITY_RATE_VENDOR_MAX) {
      throw new HttpException(
        'Too many capacity requests for this vendor',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const ipCount = await client.incr(ipKey);
    if (ipCount === 1) {
      await client.expire(ipKey, CAPACITY_RATE_WINDOW_SECONDS);
    }

    if (ipCount > CAPACITY_RATE_IP_MAX) {
      throw new HttpException(
        'Too many capacity requests from this IP',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private async enforcePendingCapacityLimit(vendorId: number): Promise<void> {
    const pendingCount = await this.prisma.approvalRequest.count({
      where: {
        type: ApprovalRequestType.capacity_request,
        status: ApprovalStatus.pending,
        requestedById: vendorId,
        deletedAt: null,
      },
    });

    if (pendingCount >= CAPACITY_REQUEST_PENDING_LIMIT) {
      throw new ConflictException('Too many pending capacity requests');
    }
  }

  private signApprovalPayload(payload: Record<string, unknown>): string {
    const key = this.getRequiredConfig('HMAC_APPROVAL_REQUESTS_KEY');

    const canonicalPayload = this.toCanonicalJson(payload);
    return createHmac('sha256', key).update(canonicalPayload).digest('hex');
  }

  private parseDateBounds(date: string): { dayStart: Date; dayEnd: Date } {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException('date must be in YYYY-MM-DD format');
    }

    const dayStart = new Date(`${date}T00:00:00.000Z`);
    if (Number.isNaN(dayStart.getTime())) {
      throw new BadRequestException('Invalid date');
    }

    return {
      dayStart,
      dayEnd: new Date(dayStart.getTime() + 24 * 60 * 60 * 1000),
    };
  }

  private normalizeAvailabilitySlots(
    dayStart: Date,
    slots: AvailabilitySlotDto[],
    maxCapacity: number,
  ): Array<{ slotStart: Date; slotEnd: Date; availableUnits: number }> {
    const parsed = slots.map((slot) => {
      const slotStart = this.toSlotDate(dayStart, slot.start);
      const slotEnd = this.toSlotDate(dayStart, slot.end);
      if (slotEnd.getTime() <= slotStart.getTime()) {
        throw new BadRequestException('slot end must be after slot start');
      }

      if (slot.availableUnits > maxCapacity) {
        throw new BadRequestException('availableUnits cannot exceed maxCapacity');
      }

      return {
        slotStart,
        slotEnd,
        availableUnits: slot.availableUnits,
      };
    });

    parsed.sort((a, b) => a.slotStart.getTime() - b.slotStart.getTime());
    for (let index = 1; index < parsed.length; index += 1) {
      const current = parsed[index];
      const previous = parsed[index - 1];
      if (current.slotStart.getTime() < previous.slotEnd.getTime()) {
        throw new BadRequestException('availability slots cannot overlap');
      }
    }

    return parsed;
  }

  private toSlotDate(dayStart: Date, value: string): Date {
    const [hoursRaw, minutesRaw] = value.split(':');
    const hours = Number(hoursRaw);
    const minutes = Number(minutesRaw);

    return new Date(
      Date.UTC(
        dayStart.getUTCFullYear(),
        dayStart.getUTCMonth(),
        dayStart.getUTCDate(),
        hours,
        minutes,
        0,
        0,
      ),
    );
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

  private getRequiredConfig(key: string): string {
    const value = process.env[key] ?? this.configService.get<string>(key);
    if (!value || value.trim().length === 0) {
      throw new InternalServerErrorException(`Missing required config: ${key}`);
    }

    return value;
  }
}
