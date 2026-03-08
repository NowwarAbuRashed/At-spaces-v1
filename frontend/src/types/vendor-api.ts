import type { AuthUser, PagedResponse } from '@/types/api'

export interface VendorAuthLoginResponse {
  accessToken: string
  user: AuthUser
}

export interface VendorAuthRefreshResponse {
  accessToken: string
}

export interface VendorAuthMessageResponse {
  message: string
}

export interface VendorRegisterRequest {
  fullName: string
  email: string
  password: string
  branch: {
    name: string
    city: string
    address: string
    latitude?: number | null
    longitude?: number | null
  }
}

export interface VendorResetPasswordRequest {
  resetToken: string
  newPassword: string
}

export type VendorBranchDashboardStatus = 'calm' | 'moderate' | 'busy'

export interface VendorDashboardApiResponse {
  todayOccupancy: number
  upcomingBookings: number
  branchStatus: VendorBranchDashboardStatus
}

export interface VendorBranchApiItem {
  id: number
  name: string
  city: string
  address: string
}

export interface VendorFacilityApiItem {
  id: number
  name: string
  icon: string | null
  isAvailable: boolean
  description: string | null
}

export type VendorPriceUnitApi = 'hour' | 'day' | 'week' | 'month'

export interface VendorServiceApiItem {
  vendorServiceId: number
  serviceId: number
  name: string
  pricePerUnit: number
  priceUnit: VendorPriceUnitApi
  maxCapacity: number
  isAvailable: boolean
}

export interface VendorBranchDetailsApiResponse {
  id: number
  name: string
  description: string | null
  city: string
  address: string
  latitude: number | null
  longitude: number | null
  facilities: VendorFacilityApiItem[]
  services: VendorServiceApiItem[]
}

export type VendorServicesListApiResponse = PagedResponse<VendorServiceApiItem>

export interface VendorServicePriceUpdateRequest {
  pricePerUnit: number
  priceUnit: VendorPriceUnitApi
}

export interface VendorCapacityRequestCreateRequest {
  newCapacity: number
  reason: string
}

export interface VendorCapacityRequestCreateResponse {
  requestId: number
  status: 'pending' | string
}

export interface VendorAvailabilityUpsertRequest {
  vendorServiceId: number
  date: string
  slots: Array<{
    start: string
    end: string
    availableUnits: number
  }>
}

export interface VendorAvailabilityUpsertResponse {
  message: string
}

export type VendorBookingApiStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'no_show'
  | 'cancelled'

export interface VendorBookingApiItem {
  id: number
  bookingNumber: string
  vendorServiceId: number
  branchId: number
  branchName: string
  startTime: string
  endTime: string
  quantity: number
  status: VendorBookingApiStatus
}

export type VendorBookingsListApiResponse = PagedResponse<VendorBookingApiItem>

export interface VendorUpdateBookingStatusRequest {
  status: 'completed' | 'no_show'
}

export interface VendorUpdateBookingStatusResponse {
  id: number
  status: VendorBookingApiStatus
}
