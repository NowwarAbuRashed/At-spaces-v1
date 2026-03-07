import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  BookingStatus,
  BranchStatus,
  PriceUnit,
  Prisma,
  Role,
  UserStatus,
} from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface AvailabilityInput {
  vendorServiceId: number;
  startTime: Date;
  endTime: Date;
  quantity: number;
}

export interface AvailabilityResult {
  available: boolean;
  price: number;
  effectiveCapacity: number;
  bookedQuantity: number;
  remainingCapacity: number;
  vendorService: {
    id: number;
    branchId: number;
    maxCapacity: number;
    pricePerUnit: Prisma.Decimal;
    priceUnit: PriceUnit;
  };
}

const ACTIVE_BOOKING_STATUSES: BookingStatus[] = [
  BookingStatus.pending,
  BookingStatus.confirmed,
  BookingStatus.completed,
  BookingStatus.no_show,
];

@Injectable()
export class AvailabilityEngineService {
  constructor(private readonly prisma: PrismaService) {}

  parseWindow(startTime: string, endTime: string): { startTime: Date; endTime: Date } {
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException('Invalid date format');
    }

    if (start.getTime() >= end.getTime()) {
      throw new BadRequestException('startTime must be before endTime');
    }

    return {
      startTime: start,
      endTime: end,
    };
  }

  calculatePrice(
    pricePerUnit: Prisma.Decimal,
    priceUnit: PriceUnit,
    startTime: Date,
    endTime: Date,
    quantity: number,
  ): number {
    const durationMs = endTime.getTime() - startTime.getTime();
    if (durationMs <= 0) {
      throw new BadRequestException('startTime must be before endTime');
    }

    const durationHours = durationMs / (1000 * 60 * 60);
    const durationDays = durationMs / (1000 * 60 * 60 * 24);

    let unitMultiplier = 1;
    switch (priceUnit) {
      case PriceUnit.hour:
        unitMultiplier = durationHours;
        break;
      case PriceUnit.half_day:
        unitMultiplier = Math.ceil(durationHours / 4);
        break;
      case PriceUnit.full_day:
        unitMultiplier = Math.ceil(durationHours / 8);
        break;
      case PriceUnit.day:
        unitMultiplier = Math.ceil(durationDays);
        break;
      case PriceUnit.week:
        unitMultiplier = Math.ceil(durationDays / 7);
        break;
      case PriceUnit.month:
        unitMultiplier = Math.ceil(durationDays / 30);
        break;
      default:
        unitMultiplier = durationHours;
    }

    const normalizedMultiplier = Math.max(unitMultiplier, 1);
    const total =
      Number(pricePerUnit) * quantity * normalizedMultiplier;

    return Number(total.toFixed(2));
  }

  async checkAvailability(
    input: AvailabilityInput,
    tx?: Prisma.TransactionClient,
  ): Promise<AvailabilityResult> {
    const client = tx ?? this.prisma;

    const vendorService = await client.vendorService.findFirst({
      where: {
        id: input.vendorServiceId,
        deletedAt: null,
        isAvailable: true,
        branch: {
          deletedAt: null,
          status: BranchStatus.active,
        },
        vendor: {
          deletedAt: null,
          role: Role.vendor,
          status: UserStatus.active,
        },
        service: {
          isActive: true,
        },
      },
      select: {
        id: true,
        branchId: true,
        maxCapacity: true,
        pricePerUnit: true,
        priceUnit: true,
      },
    });

    if (!vendorService) {
      throw new NotFoundException('Vendor service not found');
    }

    const [blockedCount, slots, aggregateBookings] = await Promise.all([
      client.availability.count({
        where: {
          vendorServiceId: input.vendorServiceId,
          deletedAt: null,
          isBlocked: true,
          slotStart: { lt: input.endTime },
          slotEnd: { gt: input.startTime },
        },
      }),
      client.availability.findMany({
        where: {
          vendorServiceId: input.vendorServiceId,
          deletedAt: null,
          isBlocked: false,
          slotStart: { lt: input.endTime },
          slotEnd: { gt: input.startTime },
        },
        select: {
          availableUnits: true,
        },
      }),
      client.booking.aggregate({
        where: {
          vendorServiceId: input.vendorServiceId,
          deletedAt: null,
          status: {
            in: ACTIVE_BOOKING_STATUSES,
          },
          startTime: { lt: input.endTime },
          endTime: { gt: input.startTime },
        },
        _sum: {
          quantity: true,
        },
      }),
    ]);

    const slotCapacity =
      slots.length > 0
        ? Math.min(...slots.map((slot) => slot.availableUnits))
        : vendorService.maxCapacity;
    const effectiveCapacity = blockedCount > 0 ? 0 : Math.min(slotCapacity, vendorService.maxCapacity);
    const bookedQuantity = aggregateBookings._sum.quantity ?? 0;
    const remainingCapacity = Math.max(effectiveCapacity - bookedQuantity, 0);
    const available = remainingCapacity >= input.quantity;
    const price = this.calculatePrice(
      vendorService.pricePerUnit,
      vendorService.priceUnit,
      input.startTime,
      input.endTime,
      input.quantity,
    );

    return {
      available,
      price,
      effectiveCapacity,
      bookedQuantity,
      remainingCapacity,
      vendorService,
    };
  }
}
