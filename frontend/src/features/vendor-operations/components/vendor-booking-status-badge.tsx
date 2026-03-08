import { Badge } from '@/components/ui/badge'
import type { VendorBookingStatus } from '@/features/vendor-operations/types'

const bookingStatusVariantMap: Record<VendorBookingStatus, 'success' | 'warning' | 'info' | 'danger'> = {
  confirmed: 'success',
  pending: 'warning',
  completed: 'info',
  no_show: 'danger',
  cancelled: 'danger',
}

const bookingStatusLabelMap: Record<VendorBookingStatus, string> = {
  confirmed: 'Confirmed',
  pending: 'Pending',
  completed: 'Completed',
  no_show: 'No Show',
  cancelled: 'Cancelled',
}

export interface VendorBookingStatusBadgeProps {
  status: VendorBookingStatus
}

export function VendorBookingStatusBadge({ status }: VendorBookingStatusBadgeProps) {
  return <Badge variant={bookingStatusVariantMap[status]}>{bookingStatusLabelMap[status]}</Badge>
}
