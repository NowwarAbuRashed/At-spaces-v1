export type UserRole = 'customer' | 'vendor' | 'admin'

export interface AuthUser {
  id: number
  role: UserRole
  fullName: string
}

export interface PagedResponse<T> {
  items: T[]
  page: number
  limit: number
  total: number
  hasNext: boolean
}

export interface ApiErrorPayload {
  code?: string
  message?: string
  details?: Array<{ field?: string; issue?: string }>
}

export interface AdminBranchApiItem {
  id: number
  name: string
  city: string
  address: string
  status: 'pending' | 'active' | 'suspended'
  ownerId: number | null
}

export interface AdminVendorApiItem {
  id: number
  fullName: string
  email: string | null
  status: 'pending' | 'active' | 'suspended'
}

export interface AdminApprovalApiItem {
  id: number
  type: 'vendor_registration' | 'capacity_request' | 'branch_update' | 'vendor_service_update'
  status: 'pending' | 'approved' | 'rejected'
  branchId: number | null
  vendorServiceId: number | null
  requestedById: number | null
  reviewedById: number | null
  reviewedAt: string | null
  createdAt: string
}

export interface AdminAnalyticsApiResponse {
  totalBookings: number
  occupancyRate: number
  revenue: number
  topCities: Array<{ city: string; bookings: number }>
}

export interface AdminReportExportResponse {
  status: 'ready' | 'unavailable'
  url?: string | null
  expiresIn?: number | null
  message?: string | null
}

export interface AuditLogApiItem {
  id: number
  actorId: number | null
  action: string
  entity: string
  entityId: number | null
  metadata: Record<string, unknown>
  timestamp: string
}

export interface ServiceApiItem {
  id: number
  name: string
  unit: string
}

export interface FeatureApiItem {
  id: number
  name: string
  icon: string | null
}

export interface VersionApiResponse {
  version: string
}

export interface UploadImageApiResponse {
  url: string
  key: string
}

export interface AdminApprovalDetailsApiResponse {
  [key: string]: unknown
}

export interface NotificationApiItem {
  id: number
  type: string
  title: string
  body: string
  isRead: boolean
  createdAt: string
}

export interface MeApiResponse {
  id: number
  fullName: string
  email: string | null
  phoneNumber: string | null
  role: UserRole
}
