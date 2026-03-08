import type { LucideIcon } from 'lucide-react'
import type { AppRoutePath } from '@/lib/routes'
import type { StatusBadgeVariant } from '@/types/ui'

export type VendorKpiTrendDirection = 'up' | 'down' | 'neutral'

export interface VendorDashboardKpi {
  id: string
  label: string
  value: string
  icon: LucideIcon
  trendLabel: string
  trendDirection: VendorKpiTrendDirection
  helperText: string
}

export type VendorBookingStatus = 'confirmed' | 'pending' | 'completed' | 'cancelled'

export interface VendorRecentBooking {
  id: string
  customerName: string
  serviceName: string
  dateTimeLabel: string
  status: VendorBookingStatus
}

export interface VendorBranchStatusSummary {
  branchName: string
  branchStatus: StatusBadgeVariant
  occupancyPercent: number
  healthPercent: number
  activeCapacity: number
  totalCapacity: number
  summary: string
  nextPeakWindow: string
}

export interface VendorQuickAction {
  id: string
  label: string
  description: string
  path: AppRoutePath
  icon: LucideIcon
  badge?: string
}
