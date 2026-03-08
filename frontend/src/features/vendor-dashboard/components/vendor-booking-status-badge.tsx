import { Badge } from '@/components/ui/badge'
import type { VendorBookingStatus } from '@/features/vendor-dashboard/types'

const bookingStatusVariants: Record<VendorBookingStatus, 'success' | 'warning' | 'info' | 'danger'> = {
  confirmed: 'success',
  pending: 'warning',
  completed: 'info',
  cancelled: 'danger',
}

const bookingStatusLabels: Record<VendorBookingStatus, string> = {
  confirmed: 'Confirmed',
  pending: 'Pending',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export interface VendorBookingStatusBadgeProps {
  status: VendorBookingStatus
}

export function VendorBookingStatusBadge({ status }: VendorBookingStatusBadgeProps) {
  return <Badge variant={bookingStatusVariants[status]}>{bookingStatusLabels[status]}</Badge>
}
