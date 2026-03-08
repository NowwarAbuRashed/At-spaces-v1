import { apiRequest } from '@/api/client'
import type {
  CustomerAuthLoginResponse,
  CustomerAuthMessageResponse,
  CustomerAuthRefreshResponse,
  CustomerAuthRegisterEmailResponse,
  CustomerAvailabilityCheckRequest,
  CustomerAvailabilityCheckResponse,
  CustomerBranchDetailsApiResponse,
  CustomerBookingDetailsApiResponse,
  CustomerBookingPreviewResponse,
  CustomerCreateBookingRequest,
  CustomerCreateBookingResponse,
  CustomerMyBookingsApiResponse,
  CustomerProfileApiResponse,
  CustomerPublicBranchesApiResponse,
  CustomerPublicFacilityApiItem,
  CustomerPublicServiceApiItem,
} from '@/types/customer-api'

interface AuthenticatedRequestOptions {
  accessToken: string
}

export async function customerRegisterEmailRequest(payload: {
  fullName: string
  email: string
  password: string
}) {
  return apiRequest<CustomerAuthRegisterEmailResponse>('/auth/customer/register-email', {
    method: 'POST',
    body: payload,
  })
}

export async function customerLoginRequest(payload: { email: string; password: string }) {
  return apiRequest<CustomerAuthLoginResponse>('/auth/customer/login-email', {
    method: 'POST',
    body: payload,
  })
}

export async function customerRefreshRequest() {
  return apiRequest<CustomerAuthRefreshResponse>('/auth/customer/refresh', {
    method: 'POST',
  })
}

export async function customerLogoutRequest() {
  return apiRequest<CustomerAuthMessageResponse>('/auth/customer/logout', {
    method: 'POST',
  })
}

export async function customerForgotPasswordRequest(payload: { email: string }) {
  return apiRequest<CustomerAuthMessageResponse>('/auth/customer/forgot-password', {
    method: 'POST',
    body: payload,
  })
}

export async function listCustomerServicesRequest() {
  return apiRequest<CustomerPublicServiceApiItem[]>('/services')
}

export async function listCustomerFacilitiesRequest() {
  return apiRequest<CustomerPublicFacilityApiItem[]>('/facilities')
}

export async function listCustomerBranchesRequest(options?: {
  city?: string
  serviceId?: number
  page?: number
  limit?: number
}) {
  return apiRequest<CustomerPublicBranchesApiResponse>('/branches', {
    query: {
      city: options?.city,
      serviceId: options?.serviceId,
      page: options?.page ?? 1,
      limit: options?.limit ?? 20,
    },
  })
}

export async function searchCustomerBranchesRequest(options: {
  q: string
  page?: number
  limit?: number
}) {
  return apiRequest<CustomerPublicBranchesApiResponse>('/branches/search', {
    query: {
      q: options.q,
      page: options.page ?? 1,
      limit: options.limit ?? 20,
    },
  })
}

export async function getCustomerBranchDetailsRequest(branchId: number) {
  return apiRequest<CustomerBranchDetailsApiResponse>(`/branches/${branchId}`)
}

export async function customerCheckAvailabilityRequest(payload: CustomerAvailabilityCheckRequest) {
  return apiRequest<CustomerAvailabilityCheckResponse>('/availability/check', {
    method: 'POST',
    body: payload,
  })
}

export async function customerBookingPreviewRequest(payload: CustomerAvailabilityCheckRequest) {
  return apiRequest<CustomerBookingPreviewResponse>('/bookings/preview', {
    method: 'POST',
    body: payload,
  })
}

export async function customerCreateBookingRequest(
  options: AuthenticatedRequestOptions & {
    payload: CustomerCreateBookingRequest
  },
) {
  return apiRequest<CustomerCreateBookingResponse>('/bookings', {
    method: 'POST',
    accessToken: options.accessToken,
    body: options.payload,
  })
}

export async function listCustomerMyBookingsRequest(
  options: AuthenticatedRequestOptions & { page?: number; limit?: number },
) {
  return apiRequest<CustomerMyBookingsApiResponse>('/bookings/my', {
    accessToken: options.accessToken,
    query: {
      page: options.page ?? 1,
      limit: options.limit ?? 20,
    },
  })
}

export async function getCustomerBookingDetailsRequest(
  options: AuthenticatedRequestOptions & { bookingId: number },
) {
  return apiRequest<CustomerBookingDetailsApiResponse>(`/bookings/${options.bookingId}`, {
    accessToken: options.accessToken,
  })
}

export async function cancelCustomerBookingRequest(
  options: AuthenticatedRequestOptions & { bookingId: number },
) {
  return apiRequest<CustomerAuthMessageResponse>(`/bookings/${options.bookingId}/cancel`, {
    method: 'POST',
    accessToken: options.accessToken,
  })
}

export async function exportCustomerBookingCalendarRequest(
  options: AuthenticatedRequestOptions & { bookingId: number },
) {
  return apiRequest<string>(`/bookings/${options.bookingId}/calendar.ics`, {
    accessToken: options.accessToken,
    responseType: 'text',
  })
}

export async function getCustomerProfileRequest(options: AuthenticatedRequestOptions) {
  return apiRequest<CustomerProfileApiResponse>('/users/me', {
    accessToken: options.accessToken,
  })
}

export async function updateCustomerProfileRequest(
  options: AuthenticatedRequestOptions & {
    fullName?: string
    email?: string
  },
) {
  return apiRequest<CustomerProfileApiResponse>('/users/me', {
    method: 'PUT',
    accessToken: options.accessToken,
    body: {
      fullName: options.fullName,
      email: options.email,
    },
  })
}

export async function customerRecommendRequest(payload: {
  query: string
  location: string
  time: string
  durationMinutes: number
}) {
  return apiRequest<Record<string, unknown>>('/ai/recommend', {
    method: 'POST',
    body: payload,
  })
}
