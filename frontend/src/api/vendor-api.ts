import { apiRequest } from '@/api/client'
import type {
  VendorAuthLoginResponse,
  VendorAuthMessageResponse,
  VendorAuthRefreshResponse,
  VendorRegisterRequest,
  VendorResetPasswordRequest,
  VendorAvailabilityUpsertRequest,
  VendorAvailabilityUpsertResponse,
  VendorBookingsListApiResponse,
  VendorBranchApiItem,
  VendorBranchDetailsApiResponse,
  VendorCapacityRequestCreateRequest,
  VendorCapacityRequestCreateResponse,
  VendorDashboardApiResponse,
  VendorServiceApiItem,
  VendorServicePriceUpdateRequest,
  VendorServicesListApiResponse,
  VendorUpdateBookingStatusResponse,
} from '@/types/vendor-api'

interface AuthenticatedRequestOptions {
  accessToken: string
}

export async function vendorLoginRequest(payload: { email: string; password: string }) {
  return apiRequest<VendorAuthLoginResponse>('/auth/vendor/login', {
    method: 'POST',
    body: payload,
  })
}

export async function vendorRefreshRequest() {
  return apiRequest<VendorAuthRefreshResponse>('/auth/vendor/refresh', {
    method: 'POST',
  })
}

export async function vendorLogoutRequest() {
  return apiRequest<VendorAuthMessageResponse>('/auth/vendor/logout', {
    method: 'POST',
  })
}

export async function vendorForgotPasswordRequest(payload: { email: string }) {
  return apiRequest<VendorAuthMessageResponse>('/auth/vendor/forgot-password', {
    method: 'POST',
    body: payload,
  })
}

export async function vendorResetPasswordRequest(payload: VendorResetPasswordRequest) {
  return apiRequest<VendorAuthMessageResponse>('/auth/vendor/reset-password', {
    method: 'POST',
    body: payload,
  })
}

export async function vendorRegisterRequest(payload: VendorRegisterRequest) {
  return apiRequest<VendorAuthMessageResponse>('/vendors/register', {
    method: 'POST',
    body: payload,
  })
}

export async function getVendorDashboard(options: AuthenticatedRequestOptions) {
  return apiRequest<VendorDashboardApiResponse>('/vendors/dashboard', {
    accessToken: options.accessToken,
  })
}

export async function listVendorBranches(options: AuthenticatedRequestOptions) {
  return apiRequest<VendorBranchApiItem[]>('/vendors/branches/me', {
    accessToken: options.accessToken,
  })
}

export async function updateVendorBranch(
  options: AuthenticatedRequestOptions & {
    branchId: number
    payload: {
      name: string
      description?: string | null
      city: string
      address: string
      latitude?: number | null
      longitude?: number | null
    }
  },
) {
  return apiRequest<VendorBranchDetailsApiResponse>(`/vendors/branches/${options.branchId}`, {
    method: 'PUT',
    accessToken: options.accessToken,
    body: options.payload,
  })
}

export async function listVendorServices(
  options: AuthenticatedRequestOptions & { branchId?: number; page?: number; limit?: number },
) {
  return apiRequest<VendorServicesListApiResponse>('/vendors/vendor-services', {
    accessToken: options.accessToken,
    query: {
      branchId: options.branchId,
      page: options.page ?? 1,
      limit: options.limit ?? 100,
    },
  })
}

export async function getVendorService(
  options: AuthenticatedRequestOptions & { vendorServiceId: number },
) {
  return apiRequest<VendorServiceApiItem>(`/vendors/vendor-services/${options.vendorServiceId}`, {
    accessToken: options.accessToken,
  })
}

export async function updateVendorServicePrice(
  options: AuthenticatedRequestOptions & {
    vendorServiceId: number
    payload: VendorServicePriceUpdateRequest
  },
) {
  return apiRequest<VendorServiceApiItem>(
    `/vendors/vendor-services/${options.vendorServiceId}/price`,
    {
      method: 'PUT',
      accessToken: options.accessToken,
      body: options.payload,
    },
  )
}

export async function createVendorCapacityRequest(
  options: AuthenticatedRequestOptions & {
    vendorServiceId: number
    payload: VendorCapacityRequestCreateRequest
  },
) {
  return apiRequest<VendorCapacityRequestCreateResponse>(
    `/vendors/vendor-services/${options.vendorServiceId}/capacity-request`,
    {
      method: 'POST',
      accessToken: options.accessToken,
      body: options.payload,
    },
  )
}

export async function upsertVendorAvailability(
  options: AuthenticatedRequestOptions & { payload: VendorAvailabilityUpsertRequest },
) {
  return apiRequest<VendorAvailabilityUpsertResponse>('/vendors/availability', {
    method: 'PUT',
    accessToken: options.accessToken,
    body: options.payload,
  })
}

export async function listVendorBookings(
  options: AuthenticatedRequestOptions & { date?: string; page?: number; limit?: number },
) {
  return apiRequest<VendorBookingsListApiResponse>('/vendors/bookings', {
    accessToken: options.accessToken,
    query: {
      date: options.date,
      page: options.page ?? 1,
      limit: options.limit ?? 100,
    },
  })
}

export async function updateVendorBookingStatus(
  options: AuthenticatedRequestOptions & {
    bookingId: number
    status: 'completed' | 'no_show'
  },
) {
  return apiRequest<VendorUpdateBookingStatusResponse>(
    `/vendors/bookings/${options.bookingId}/status`,
    {
      method: 'PATCH',
      accessToken: options.accessToken,
      body: {
        status: options.status,
      },
    },
  )
}
