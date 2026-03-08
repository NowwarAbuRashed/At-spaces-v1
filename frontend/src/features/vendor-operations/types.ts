import type { StatusBadgeVariant } from '@/types/ui'

export interface VendorOperationServiceOption {
  id: string
  name: string
}

export type VendorAvailabilitySlotState = 'active' | 'blocked'

export interface VendorAvailabilitySlot {
  id: string
  date: string
  serviceId: string
  startTime: string
  endTime: string
  availableUnits: number
  state: VendorAvailabilitySlotState
}

export interface VendorAvailabilitySlotInput {
  date: string
  serviceId: string
  startTime: string
  endTime: string
  availableUnits: number
  state: VendorAvailabilitySlotState
}

export type VendorBookingStatus = 'confirmed' | 'pending' | 'completed' | 'no_show'

export interface VendorBooking {
  id: string
  customerName: string
  serviceId: string
  date: string
  timeRange: string
  quantity: number
  status: VendorBookingStatus
}

export interface VendorBookingStatusOption {
  value: 'all' | VendorBookingStatus
  label: string
}

export interface VendorAvailabilityStateOption {
  value: VendorAvailabilitySlotState
  label: string
  badgeTone: StatusBadgeVariant
}
