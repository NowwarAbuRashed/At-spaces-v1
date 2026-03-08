import { apiRequest } from '@/api/client'
import type {
  AdminApprovalDetailsApiResponse,
  AdminAnalyticsApiResponse,
  AdminApprovalApiItem,
  AdminBranchApiItem,
  AdminReportExportResponse,
  AdminVendorApiItem,
  AuditLogApiItem,
  PagedResponse,
} from '@/types/api'

interface AuthenticatedRequestOptions {
  accessToken: string
}

export async function listAdminBranches(
  options: AuthenticatedRequestOptions & { page?: number; limit?: number },
) {
  return apiRequest<PagedResponse<AdminBranchApiItem>>('/admin/branches', {
    accessToken: options.accessToken,
    query: {
      page: options.page ?? 1,
      limit: options.limit ?? 100,
    },
  })
}

export async function updateAdminBranchStatus(
  options: AuthenticatedRequestOptions & { branchId: number; status: 'active' | 'suspended' },
) {
  return apiRequest<{ id: number; status: 'active' | 'suspended' }>(
    `/admin/branches/${options.branchId}/status`,
    {
      method: 'PATCH',
      accessToken: options.accessToken,
      body: { status: options.status },
    },
  )
}

export async function listAdminVendors(
  options: AuthenticatedRequestOptions & { page?: number; limit?: number },
) {
  return apiRequest<PagedResponse<AdminVendorApiItem>>('/admin/vendors', {
    accessToken: options.accessToken,
    query: {
      page: options.page ?? 1,
      limit: options.limit ?? 100,
    },
  })
}

export async function updateAdminVendorStatus(
  options: AuthenticatedRequestOptions & { vendorId: number; status: 'active' | 'suspended' },
) {
  return apiRequest<{ id: number; status: 'active' | 'suspended' }>(
    `/admin/vendors/${options.vendorId}/status`,
    {
      method: 'PATCH',
      accessToken: options.accessToken,
      body: { status: options.status },
    },
  )
}

export async function listApprovalRequests(
  options: AuthenticatedRequestOptions & {
    page?: number
    limit?: number
    status?: 'pending' | 'approved' | 'rejected'
  },
) {
  return apiRequest<PagedResponse<AdminApprovalApiItem>>('/admin/approval-requests', {
    accessToken: options.accessToken,
    query: {
      page: options.page ?? 1,
      limit: options.limit ?? 100,
      status: options.status,
    },
  })
}

export async function getApprovalRequestDetails(
  options: AuthenticatedRequestOptions & { requestId: number },
) {
  return apiRequest<AdminApprovalDetailsApiResponse>(`/admin/approval-requests/${options.requestId}`, {
    accessToken: options.accessToken,
  })
}

export async function approveRequest(options: AuthenticatedRequestOptions & { requestId: number }) {
  return apiRequest<{ message: string }>(`/admin/approval-requests/${options.requestId}/approve`, {
    method: 'POST',
    accessToken: options.accessToken,
  })
}

export async function rejectRequest(
  options: AuthenticatedRequestOptions & { requestId: number; reason: string },
) {
  return apiRequest<{ message: string }>(`/admin/approval-requests/${options.requestId}/reject`, {
    method: 'POST',
    accessToken: options.accessToken,
    body: { reason: options.reason },
  })
}

export async function fetchAdminAnalytics(
  options: AuthenticatedRequestOptions & { from: string; to: string },
) {
  return apiRequest<AdminAnalyticsApiResponse>('/admin/analytics', {
    accessToken: options.accessToken,
    query: {
      from: options.from,
      to: options.to,
    },
  })
}

export async function exportAdminReport(
  options: AuthenticatedRequestOptions & {
    reportType: string
    format: 'csv' | 'pdf' | 'xlsx'
    filters: Record<string, unknown>
  },
) {
  return apiRequest<AdminReportExportResponse>('/admin/reports/export', {
    method: 'POST',
    accessToken: options.accessToken,
    body: {
      reportType: options.reportType,
      format: options.format,
      filters: options.filters,
    },
  })
}

export async function listAuditLog(
  options: AuthenticatedRequestOptions & {
    page?: number
    limit?: number
    from?: string
    to?: string
  },
) {
  return apiRequest<PagedResponse<AuditLogApiItem>>('/admin/audit-log', {
    accessToken: options.accessToken,
    query: {
      page: options.page ?? 1,
      limit: options.limit ?? 50,
      from: options.from,
      to: options.to,
    },
  })
}
