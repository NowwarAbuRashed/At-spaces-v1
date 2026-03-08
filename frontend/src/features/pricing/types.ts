export type PricingPlanKey = 'hotDesk' | 'privateOffice' | 'meetingRoom'

export interface PricingTier {
  id: string
  name: string
  bookingsShare: string
  price: string
}

export interface PricingPlan {
  key: PricingPlanKey
  label: string
  title: string
  tiers: PricingTier[]
}

export interface BookingPolicy {
  id: string
  title: string
  description?: string
  value: string
}

