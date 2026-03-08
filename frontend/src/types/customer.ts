export type CustomerServiceUnit = 'hour' | 'day' | 'session'

export interface CustomerBranchFacility {
  id: string
  name: string
  description: string
}

export interface CustomerBranchService {
  id: string
  serviceId?: number
  vendorServiceId?: number
  name: string
  description: string
  category: string
  price: number
  unit: CustomerServiceUnit
  durationLabel: string
  capacityLabel: string
}

export interface CustomerBranch {
  id: string
  name: string
  city: string
  district: string
  addressLine: string
  locationSummary: string
  heroHighlight: string
  rating: number
  reviewsCount: number
  description: string
  facilities: CustomerBranchFacility[]
  services: CustomerBranchService[]
}

export interface CustomerBranchServiceFilterOption {
  id: string
  label: string
  count: number
}

export interface CustomerBookingSelectionSummary {
  branchId: string
  branchName: string
  city: string
  district: string
  addressLine: string
  serviceId: string
  serviceName: string
  serviceCategory: string
  serviceUnit: CustomerServiceUnit
  serviceUnitPrice: number
}

export interface CustomerPaymentMethodOption {
  id: string
  label: string
  description: string
  feeLabel: string
  additionalFee: number
}

export interface CustomerBookingPreviewFormState {
  bookingDate: string
  startTime: string
  endTime: string
  quantity: number
  paymentMethodId: string
  notes: string
}

export interface CustomerBookingPriceBreakdown {
  durationUnits: number
  basePrice: number
  platformFee: number
  paymentFee: number
  discount: number
  tax: number
  total: number
}

export interface CustomerBookingPreviewState {
  selection: CustomerBookingSelectionSummary
  formDefaults: CustomerBookingPreviewFormState
  paymentMethods: CustomerPaymentMethodOption[]
  currency: string
  taxRate: number
  platformFee: number
  discount: number
}

export type CustomerBookingStatus = 'confirmed' | 'pending' | 'cancelled'

export interface CustomerBookingSummary {
  id: string
  branchName: string
  serviceName: string
  startAt: string
  endAt: string
  status: CustomerBookingStatus
  totalPrice: number
}

export interface CustomerBookingListItem {
  id: string
  bookingNumber: string
  branchName: string
  serviceName: string
  startAt: string
  endAt: string
  quantity: number
  totalPrice: number
  currency: string
  status: CustomerBookingStatus
  canCancel: boolean
  canExportCalendar: boolean
  calendarExportedAt: string | null
}

export type CustomerWorkspacePreference = 'quiet' | 'collaborative' | 'private-office'

export interface CustomerNotificationPreferences {
  bookingReminders: boolean
  scheduleChanges: boolean
  specialOffers: boolean
}

export interface CustomerProfilePreferences {
  preferredCity: string
  workspacePreference: CustomerWorkspacePreference
  notifications: CustomerNotificationPreferences
}

export interface CustomerProfile {
  id: string
  fullName: string
  email: string
  phone: string
  memberSince: string
  loyaltyTier: string
  preferences: CustomerProfilePreferences
}

export interface CustomerProfileFormValues {
  fullName: string
  email: string
  phone: string
  preferredCity: string
  workspacePreference: CustomerWorkspacePreference
  bookingReminders: boolean
  scheduleChanges: boolean
  specialOffers: boolean
}

export interface CustomerRecommendationPlaceholderState {
  title: string
  description: string
  ctaLabel: string
}
