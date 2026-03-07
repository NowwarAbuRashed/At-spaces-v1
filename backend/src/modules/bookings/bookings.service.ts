import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  BookingStatus,
  PaymentMethod,
  PaymentProvider,
  PaymentStatus,
  Prisma,
  Role,
} from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AvailabilityEngineService } from '../availability/availability-engine.service';
import { AvailabilityCheckDto } from '../availability/dto/availability-check.dto';
import { BookingsPaginationQueryDto } from './dto/bookings-pagination-query.dto';
import { CreateBookingDto } from './dto/create-booking.dto';

const CURRENCY = 'JOD';
const BOOKING_NUMBER_RETRY_LIMIT = 5;
const BOOKING_NUMBER_PADDING = 4;

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly availabilityEngine: AvailabilityEngineService,
  ) {}

  async previewBooking(dto: AvailabilityCheckDto) {
    const { startTime, endTime } = this.availabilityEngine.parseWindow(
      dto.startTime,
      dto.endTime,
    );
    const availability = await this.availabilityEngine.checkAvailability({
      vendorServiceId: dto.vendorServiceId,
      startTime,
      endTime,
      quantity: dto.quantity,
    });

    return {
      totalPrice: availability.price,
      currency: CURRENCY,
    };
  }

  async createBooking(customerId: number, dto: CreateBookingDto) {
    const { startTime, endTime } = this.availabilityEngine.parseWindow(
      dto.startTime,
      dto.endTime,
    );

    for (let attempt = 0; attempt < BOOKING_NUMBER_RETRY_LIMIT; attempt += 1) {
      try {
        return await this.prisma.$transaction(
          async (tx) => {
            const customer = await tx.user.findFirst({
              where: {
                id: customerId,
                role: Role.customer,
                deletedAt: null,
              },
              select: {
                id: true,
              },
            });

            if (!customer) {
              throw new NotFoundException('Customer not found');
            }

            const availability = await this.availabilityEngine.checkAvailability(
              {
                vendorServiceId: dto.vendorServiceId,
                startTime,
                endTime,
                quantity: dto.quantity,
              },
              tx,
            );

            if (!availability.available) {
              throw new ConflictException('Not enough availability');
            }

            const bookingNumber = await this.generateBookingNumber(tx);
            const booking = await tx.booking.create({
              data: {
                bookingNumber,
                customerId,
                vendorServiceId: dto.vendorServiceId,
                branchId: availability.vendorService.branchId,
                startTime,
                endTime,
                quantity: dto.quantity,
                totalPrice: availability.price,
                currency: CURRENCY,
                status: BookingStatus.pending,
                paymentStatus: PaymentStatus.pending,
                paymentMethod: dto.paymentMethod as PaymentMethod,
              },
            });

            await tx.payment.create({
              data: {
                bookingId: booking.id,
                provider: PaymentProvider.none,
                method: dto.paymentMethod as PaymentMethod,
                amount: availability.price,
                currency: CURRENCY,
                status: PaymentStatus.pending,
              },
            });

            return {
              bookingId: booking.id,
              bookingNumber: booking.bookingNumber,
              totalPrice: Number(booking.totalPrice),
              status: booking.status,
              paymentStatus: booking.paymentStatus,
            };
          },
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          },
        );
      } catch (error) {
        if (this.isBookingNumberConflict(error) && attempt < BOOKING_NUMBER_RETRY_LIMIT - 1) {
          continue;
        }

        throw error;
      }
    }

    throw new InternalServerErrorException('Could not create booking');
  }

  async listMyBookings(customerId: number, query: BookingsPaginationQueryDto) {
    const skip = (query.page - 1) * query.limit;
    const where: Prisma.BookingWhereInput = {
      customerId,
      deletedAt: null,
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.booking.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
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
      items: items.map((booking) => ({
        id: booking.id,
        bookingNumber: booking.bookingNumber,
        branchName: booking.branch.name,
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status,
      })),
      page: query.page,
      limit: query.limit,
      total,
      hasNext: skip + items.length < total,
    };
  }

  async getMyBooking(customerId: number, bookingId: number) {
    const booking = await this.prisma.booking.findUnique({
      where: {
        id: bookingId,
      },
      include: {
        branch: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!booking || booking.deletedAt) {
      throw new NotFoundException('Booking not found');
    }

    this.assertOwnership(customerId, booking.customerId);

    return {
      id: booking.id,
      bookingNumber: booking.bookingNumber,
      branchName: booking.branch.name,
      startTime: booking.startTime,
      endTime: booking.endTime,
      status: booking.status,
      quantity: booking.quantity,
      totalPrice: Number(booking.totalPrice),
      vendorServiceId: booking.vendorServiceId,
    };
  }

  async cancelMyBooking(customerId: number, bookingId: number) {
    const booking = await this.prisma.booking.findUnique({
      where: {
        id: bookingId,
      },
      select: {
        id: true,
        customerId: true,
        status: true,
        deletedAt: true,
      },
    });

    if (!booking || booking.deletedAt) {
      throw new NotFoundException('Booking not found');
    }

    this.assertOwnership(customerId, booking.customerId);

    if (booking.status === BookingStatus.cancelled) {
      throw new ConflictException('Booking already cancelled');
    }

    if (booking.status === BookingStatus.completed || booking.status === BookingStatus.no_show) {
      throw new ConflictException('Booking cannot be cancelled');
    }

    await this.prisma.booking.update({
      where: {
        id: booking.id,
      },
      data: {
        status: BookingStatus.cancelled,
        cancelledAt: new Date(),
      },
    });

    return {
      message: 'Booking cancelled',
    };
  }

  async exportCalendar(customerId: number, bookingId: number) {
    const booking = await this.prisma.booking.findUnique({
      where: {
        id: bookingId,
      },
      include: {
        branch: true,
        vendorService: {
          include: {
            service: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!booking || booking.deletedAt) {
      throw new NotFoundException('Booking not found');
    }

    this.assertOwnership(customerId, booking.customerId);

    const serviceName = booking.vendorService.name ?? booking.vendorService.service.name;
    const location = booking.branch.address;
    const summary = `At Spaces Booking ${booking.bookingNumber}`;
    const description = `Service: ${serviceName}\\nQuantity: ${booking.quantity}`;
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//At Spaces//Booking Calendar//EN',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `UID:booking-${booking.id}@atspaces`,
      `DTSTAMP:${this.toIcsDate(new Date())}`,
      `DTSTART:${this.toIcsDate(booking.startTime)}`,
      `DTEND:${this.toIcsDate(booking.endTime)}`,
      `SUMMARY:${this.escapeIcsText(summary)}`,
      `DESCRIPTION:${this.escapeIcsText(description)}`,
      `LOCATION:${this.escapeIcsText(location)}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ];

    return {
      fileName: `${booking.bookingNumber}.ics`,
      content: `${lines.join('\r\n')}\r\n`,
    };
  }

  private async generateBookingNumber(tx: Prisma.TransactionClient): Promise<string> {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth();
    const day = now.getUTCDate();
    const startOfDay = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(year, month, day + 1, 0, 0, 0, 0));

    const sequence = await tx.booking.count({
      where: {
        createdAt: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
    });

    const datePart = `${year}${(month + 1).toString().padStart(2, '0')}${day
      .toString()
      .padStart(2, '0')}`;
    const indexPart = (sequence + 1).toString().padStart(BOOKING_NUMBER_PADDING, '0');
    return `BKG-${datePart}-${indexPart}`;
  }

  private assertOwnership(requestedBy: number, ownerId: number): void {
    if (requestedBy !== ownerId) {
      throw new ForbiddenException('You do not have access to this booking');
    }
  }

  private isBookingNumberConflict(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }

  private toIcsDate(date: Date): string {
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    const seconds = date.getUTCSeconds().toString().padStart(2, '0');
    return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
  }

  private escapeIcsText(value: string): string {
    return value
      .replace(/\\/g, '\\\\')
      .replace(/\r\n|\n|\r/g, '\\n')
      .replace(/,/g, '\\,')
      .replace(/;/g, '\\;');
  }
}
