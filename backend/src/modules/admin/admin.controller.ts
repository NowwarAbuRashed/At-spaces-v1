import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
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
import { AdminService } from './admin.service';
import { AdminAnalyticsResponseDto } from './dto/admin-analytics-response.dto';
import { AdminAnalyticsQueryDto } from './dto/admin-analytics-query.dto';
import { ApprovalRequestDetailsDto } from './dto/approval-request-details.dto';
import { ApprovalRequestsQueryDto } from './dto/approval-requests-query.dto';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';
import { PagedAdminBranchesResponseDto } from './dto/paged-admin-branches-response.dto';
import { PagedAdminVendorsResponseDto } from './dto/paged-admin-vendors-response.dto';
import { PagedApprovalRequestsResponseDto } from './dto/paged-approval-requests-response.dto';
import { PagedAuditLogResponseDto } from './dto/paged-audit-log-response.dto';
import { RejectApprovalRequestDto } from './dto/reject-approval-request.dto';
import { ReportExportRequestDto } from './dto/report-export-request.dto';
import { ReportExportResponseDto } from './dto/report-export-response.dto';
import { UpdateBranchStatusDto } from './dto/update-branch-status.dto';
import { UpdateVendorStatusDto } from './dto/update-vendor-status.dto';
import { AdminBranchesQueryDto } from './dto/admin-branches-query.dto';
import { AdminVendorsQueryDto } from './dto/admin-vendors-query.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.admin)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('approval-requests')
  @ApiOperation({ summary: 'List approval requests' })
  @ApiOkResponse({ type: PagedApprovalRequestsResponseDto })
  async listApprovalRequests(@Query() query: ApprovalRequestsQueryDto) {
    return this.adminService.listApprovalRequests(query);
  }

  @Get('approval-requests/:id')
  @ApiOperation({ summary: 'Approval request details (includes integrity hash)' })
  @ApiOkResponse({ type: ApprovalRequestDetailsDto })
  async getApprovalRequest(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getApprovalRequestDetails(id);
  }

  @Post('approval-requests/:id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve request' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Approved' },
      },
    },
  })
  async approveRequest(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request,
  ) {
    return this.adminService.approveRequest(user.sub, id, this.requestMeta(request));
  }

  @Post('approval-requests/:id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject request (reason required)' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Rejected' },
      },
    },
  })
  async rejectRequest(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectApprovalRequestDto,
    @Req() request: Request,
  ) {
    return this.adminService.rejectRequest(user.sub, id, dto, this.requestMeta(request));
  }

  @Get('branches')
  @ApiOperation({ summary: 'List branches' })
  @ApiOkResponse({ type: PagedAdminBranchesResponseDto })
  async listBranches(@Query() query: AdminBranchesQueryDto) {
    return this.adminService.listBranches(query);
  }

  @Patch('branches/:id/status')
  @ApiOperation({ summary: 'Update branch status (audit logged)' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 12 },
        status: { type: 'string', example: 'active' },
      },
    },
  })
  async updateBranchStatus(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBranchStatusDto,
    @Req() request: Request,
  ) {
    return this.adminService.updateBranchStatus(user.sub, id, dto, this.requestMeta(request));
  }

  @Get('vendors')
  @ApiOperation({ summary: 'List vendors' })
  @ApiOkResponse({ type: PagedAdminVendorsResponseDto })
  async listVendors(@Query() query: AdminVendorsQueryDto) {
    return this.adminService.listVendors(query);
  }

  @Patch('vendors/:id/status')
  @ApiOperation({ summary: 'Update vendor status' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 8 },
        status: { type: 'string', example: 'suspended' },
      },
    },
  })
  async updateVendorStatus(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVendorStatusDto,
    @Req() request: Request,
  ) {
    return this.adminService.updateVendorStatus(user.sub, id, dto, this.requestMeta(request));
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Analytics overview (aggregated)' })
  @ApiOkResponse({ type: AdminAnalyticsResponseDto })
  async getAnalytics(@Query() query: AdminAnalyticsQueryDto) {
    return this.adminService.getAnalytics(query);
  }

  @Post('reports/export')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Export report (S3 presigned URL)' })
  @ApiOkResponse({ type: ReportExportResponseDto })
  async exportReport(
    @CurrentUser() user: JwtUser,
    @Body() dto: ReportExportRequestDto,
    @Req() request: Request,
  ) {
    return this.adminService.exportReport(user.sub, dto, this.requestMeta(request));
  }

  @Get('audit-log')
  @ApiOperation({ summary: 'Audit log (paged)' })
  @ApiOkResponse({ type: PagedAuditLogResponseDto })
  async listAuditLog(@Query() query: AuditLogQueryDto) {
    return this.adminService.listAuditLogs(query);
  }

  private requestMeta(request: Request): { ipAddress: string; userAgent: string } {
    return {
      ipAddress: request.ip ?? request.socket.remoteAddress ?? 'unknown',
      userAgent: request.get('user-agent') ?? 'unknown',
    };
  }
}
