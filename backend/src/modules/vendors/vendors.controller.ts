import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtUser } from '../../common/interfaces/jwt-user.interface';
import { BranchDetailsDto } from '../branches/dto/branch-details.dto';
import { BranchListItemDto } from '../branches/dto/branch-list-item.dto';
import { CreateCapacityRequestDto } from './dto/create-capacity-request.dto';
import { CreateCapacityRequestResponseDto } from './dto/create-capacity-request-response.dto';
import { PagedVendorBookingsResponseDto } from './dto/paged-vendor-bookings-response.dto';
import { PagedVendorServicesResponseDto } from './dto/paged-vendor-services-response.dto';
import { UpdateVendorBookingStatusDto } from './dto/update-vendor-booking-status.dto';
import { UpsertVendorAvailabilityDto } from './dto/upsert-vendor-availability.dto';
import { UpdateVendorBranchDto } from './dto/update-vendor-branch.dto';
import { UpdateVendorServicePriceDto } from './dto/update-vendor-service-price.dto';
import { VendorBookingsQueryDto } from './dto/vendor-bookings-query.dto';
import { VendorDashboardResponseDto } from './dto/vendor-dashboard-response.dto';
import { VendorServiceListQueryDto } from './dto/vendor-service-list-query.dto';
import { VendorServiceResponseDto } from './dto/vendor-service-response.dto';
import { VendorsService } from './vendors.service';

@ApiTags('Vendors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.vendor)
@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Vendor dashboard overview' })
  @ApiOkResponse({ type: VendorDashboardResponseDto })
  async getDashboard(@CurrentUser() user: JwtUser) {
    return this.vendorsService.getDashboard(user.sub);
  }

  @Get('branches/me')
  @ApiOperation({ summary: 'Vendor branches (owned)' })
  @ApiOkResponse({ type: BranchListItemDto, isArray: true })
  async getMyBranches(@CurrentUser() user: JwtUser) {
    return this.vendorsService.listMyBranches(user.sub);
  }

  @Put('branches/:id')
  @ApiOperation({ summary: 'Update vendor branch info' })
  @ApiOkResponse({ type: BranchDetailsDto })
  async updateBranch(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVendorBranchDto,
  ) {
    return this.vendorsService.updateBranch(user.sub, id, dto);
  }

  @Get('vendor-services')
  @ApiOperation({ summary: 'List vendor services' })
  @ApiOkResponse({ type: PagedVendorServicesResponseDto })
  async listVendorServices(
    @CurrentUser() user: JwtUser,
    @Query() query: VendorServiceListQueryDto,
  ) {
    return this.vendorsService.listVendorServices(user.sub, query);
  }

  @Get('vendor-services/:id')
  @ApiOperation({ summary: 'Vendor service details' })
  @ApiOkResponse({ type: VendorServiceResponseDto })
  async getVendorService(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.vendorsService.getVendorService(user.sub, id);
  }

  @Put('vendor-services/:id/price')
  @ApiOperation({ summary: 'Update vendor service price' })
  @ApiOkResponse({ type: VendorServiceResponseDto })
  async updateVendorServicePrice(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVendorServicePriceDto,
  ) {
    return this.vendorsService.updateVendorServicePrice(user.sub, id, dto);
  }

  @Post('vendor-services/:id/capacity-request')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Create capacity change request (approval)' })
  @ApiAcceptedResponse({ type: CreateCapacityRequestResponseDto })
  async createCapacityRequest(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateCapacityRequestDto,
    @Req() request: Request,
  ) {
    return this.vendorsService.createCapacityRequest(
      user.sub,
      id,
      dto,
      this.getRequestIp(request),
    );
  }

  @Put('availability')
  @ApiOperation({ summary: 'Upsert availability slots' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Availability updated' },
      },
    },
  })
  async upsertAvailability(
    @CurrentUser() user: JwtUser,
    @Body() dto: UpsertVendorAvailabilityDto,
  ) {
    return this.vendorsService.upsertAvailability(user.sub, dto);
  }

  @Get('bookings')
  @ApiOperation({ summary: 'Vendor bookings list' })
  @ApiOkResponse({ type: PagedVendorBookingsResponseDto })
  async listBookings(@CurrentUser() user: JwtUser, @Query() query: VendorBookingsQueryDto) {
    return this.vendorsService.listVendorBookings(user.sub, query);
  }

  @Patch('bookings/:id/status')
  @ApiOperation({ summary: 'Update booking status (vendor only)' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 900 },
        status: { type: 'string', example: 'completed' },
      },
    },
  })
  async updateBookingStatus(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVendorBookingStatusDto,
  ) {
    return this.vendorsService.updateVendorBookingStatus(user.sub, id, dto);
  }

  private getRequestIp(request: Request): string {
    return request.ip ?? request.socket.remoteAddress ?? 'unknown';
  }
}
