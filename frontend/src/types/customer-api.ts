import type { AuthUser, MeApiResponse, PagedResponse } from '@/types/api'

export interface CustomerAuthLoginResponse {
  accessToken: string
  user: AuthUser
}

export interface CustomerAuthRefreshResponse {
  accessToken: string
}

export interface CustomerAuthMessageResponse {
  message: string
}

export interface CustomerAuthRegisterEmailResponse {
  userId: number
  message: string
}

export interface CustomerPublicServiceApiItem {
  id: number
  name: string
  unit: string
}

export interface CustomerPublicFacilityApiItem {
  id: number
  name: string
  icon: string | null
}

export interface CustomerPublicBranchApiItem {
  id: number
  name: string
  city: string
  address: string
}

export type CustomerPublicBranchesApiResponse = PagedResponse<CustomerPublicBranchApiItem>

export type CustomerPriceUnitApi = 'hour' | 'day' | 'week' | 'month'

export interface CustomerBranchServiceApiItem {
  vendorServiceId: number
  serviceId: number
  name: string
  pricePerUnit: number
  priceUnit: CustomerPriceUnitApi
  maxCapacity: number
  isAvailable: boolean
}

export interface CustomerBranchDetailsApiResponse {
  id: number
  name: string
  description: string | null
  city: string
  address: string
  latitude: number | null
  longitude: number | null
  facilities: Array<{
    id: number
    name: string
    icon: string | null
    isAvailable: boolean
    description: string | null
  }>
  services: CustomerBranchServiceApiItem[]
}

export interface CustomerAvailabilityCheckRequest {
  vendorServiceId: number
  startTime: string
  endTime: string
  quantity: number
}

export interface CustomerAvailabilityCheckResponse {
  available: boolean
  price: number
}

export interface CustomerBookingPreviewResponse {
  totalPrice: number
  currency: string
}

export type CustomerBookingPaymentMethodApi = 'cash' | 'card' | 'apple_pay'

export interface CustomerCreateBookingRequest extends CustomerAvailabilityCheckRequest {
  paymentMethod: CustomerBookingPaymentMethodApi
}

export type CustomerBookingApiStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'no_show'
  | 'cancelled'

export interface CustomerCreateBookingResponse {
  bookingId: number
  bookingNumber: string
  totalPrice: number
  status: CustomerBookingApiStatus
  paymentStatus: string
}

export interface CustomerBookingListApiItem {
  id: number
  bookingNumber: string
  branchName: string
  startTime: string
  endTime: string
  status: CustomerBookingApiStatus
}

export type CustomerMyBookingsApiResponse = PagedResponse<CustomerBookingListApiItem>

export interface CustomerBookingDetailsApiResponse extends CustomerBookingListApiItem {
  quantity: number
  totalPrice: number
  vendorServiceId: number
}

export type CustomerProfileApiResponse = MeApiResponse
