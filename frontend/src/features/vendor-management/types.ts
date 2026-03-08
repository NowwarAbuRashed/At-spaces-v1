import type { StatusBadgeVariant } from '@/types/ui'

export type VendorFacilityIconKey =
  | 'wifi'
  | 'coffee'
  | 'shield'
  | 'car'
  | 'presentation'
  | 'dumbbell'

export interface VendorBranchDetails {
  id: string
  name: string
  description: string
  city: string
  address: string
  latitude: string
  longitude: string
  status: StatusBadgeVariant
  managerName: string
  supportPhone: string
  occupancyPercent: number
  todayBookings: number
}

export type VendorBranchEditableField =
  | 'name'
  | 'description'
  | 'city'
  | 'address'
  | 'latitude'
  | 'longitude'

export interface VendorFacility {
  id: string
  name: string
  iconKey: VendorFacilityIconKey
  isAvailable: boolean
  description: string
  details: string
}

export type VendorPriceUnit = 'hour' | 'day' | 'week' | 'month'

export interface VendorServiceFeature {
  id: string
  name: string
  description: string
  quantity: number
  unitLabel: string
}

export interface VendorService {
  id: string
  name: string
  description: string
  status: StatusBadgeVariant
  pricePerUnit: number
  priceUnit: VendorPriceUnit
  activeCapacity: number
  totalCapacity: number
  features: VendorServiceFeature[]
}

export interface VendorNewServiceFeatureInput {
  name: string
  description: string
  quantity: number
  unitLabel: string
}
