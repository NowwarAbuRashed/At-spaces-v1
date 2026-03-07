import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtUser } from '../../common/interfaces/jwt-user.interface';
import { AvailabilityCheckDto } from '../availability/dto/availability-check.dto';
import { BookingsService } from './bookings.service';
import { BookingDetailsDto } from './dto/booking-details.dto';
import { BookingMessageResponseDto } from './dto/booking-message-response.dto';
import { BookingPreviewResponseDto } from './dto/booking-preview-response.dto';
import { BookingsPaginationQueryDto } from './dto/bookings-pagination-query.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CreateBookingResponseDto } from './dto/create-booking-response.dto';
import { PagedBookingsResponseDto } from './dto/paged-bookings-response.dto';

@ApiTags('Bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post('preview')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Preview booking price (no booking created)' })
  @ApiOkResponse({ type: BookingPreviewResponseDto })
  async previewBooking(@Body() dto: AvailabilityCheckDto) {
    return this.bookingsService.previewBooking(dto);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.customer)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create booking' })
  @ApiCreatedResponse({ type: CreateBookingResponseDto })
  async createBooking(@CurrentUser() user: JwtUser, @Body() dto: CreateBookingDto) {
    return this.bookingsService.createBooking(user.sub, dto);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.customer)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List my bookings' })
  @ApiOkResponse({ type: PagedBookingsResponseDto })
  async listMyBookings(
    @CurrentUser() user: JwtUser,
    @Query() query: BookingsPaginationQueryDto,
  ) {
    return this.bookingsService.listMyBookings(user.sub, query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.customer)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Booking details (ownership required)' })
  @ApiOkResponse({ type: BookingDetailsDto })
  async getBooking(@CurrentUser() user: JwtUser, @Param('id', ParseIntPipe) id: number) {
    return this.bookingsService.getMyBooking(user.sub, id);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.customer)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel booking' })
  @ApiOkResponse({ type: BookingMessageResponseDto })
  async cancelBooking(@CurrentUser() user: JwtUser, @Param('id', ParseIntPipe) id: number) {
    return this.bookingsService.cancelMyBooking(user.sub, id);
  }

  @Get(':id/calendar.ics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.customer)
  @ApiBearerAuth()
  @ApiProduces('text/calendar')
  @Header('Content-Type', 'text/calendar; charset=utf-8')
  @ApiOperation({ summary: 'Export booking to calendar (ICS)' })
  @ApiOkResponse({
    description: 'ICS calendar file',
    content: {
      'text/calendar': {
        schema: { type: 'string' },
      },
    },
  })
  async exportCalendar(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseIntPipe) id: number,
    @Res({ passthrough: true }) response: Response,
  ) {
    const calendar = await this.bookingsService.exportCalendar(user.sub, id);
    response.setHeader('Content-Disposition', `attachment; filename="${calendar.fileName}"`);
    return calendar.content;
  }
}
