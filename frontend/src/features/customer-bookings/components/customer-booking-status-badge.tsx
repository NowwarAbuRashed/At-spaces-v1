import { Badge } from '@/components/ui'
import type { CustomerBookingStatus } from '@/types/customer'

export interface CustomerBookingStatusBadgeProps {
  status: CustomerBookingStatus
}

function statusLabel(status: CustomerBookingStatus) {
  switch (status) {
    case 'confirmed':
      return 'Confirmed'
    case 'pending':
      return 'Pending'
    case 'cancelled':
      return 'Cancelled'
    default:
      return status
  }
}

function statusVariant(status: CustomerBookingStatus) {
  switch (status) {
    case 'confirmed':
      return 'success' as const
    case 'pending':
      return 'warning' as const
    case 'cancelled':
      return 'danger' as const
    default:
      return 'neutral' as const
  }
}

export function CustomerBookingStatusBadge({ status }: CustomerBookingStatusBadgeProps) {
  return <Badge variant={statusVariant(status)}>{statusLabel(status)}</Badge>
}
