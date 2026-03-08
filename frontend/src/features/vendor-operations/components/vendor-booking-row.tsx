import { CalendarDays, UserRound } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { VendorBookingStatusAction } from '@/features/vendor-operations/components/vendor-booking-status-action'
import { VendorBookingStatusBadge } from '@/features/vendor-operations/components/vendor-booking-status-badge'
import type { VendorBooking } from '@/features/vendor-operations/types'

export interface VendorBookingRowProps {
  booking: VendorBooking
  serviceName: string
  onMarkCompleted: (bookingId: string) => void
  onMarkNoShow: (bookingId: string) => void
  isStatusUpdating?: boolean
}

export function VendorBookingRow({
  booking,
  serviceName,
  onMarkCompleted,
  onMarkNoShow,
  isStatusUpdating = false,
}: VendorBookingRowProps) {
  return (
    <Card className="w-full" data-testid={`booking-${booking.id}`}>
      <CardContent className="space-y-4 pt-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="inline-flex items-center gap-2 font-semibold text-app-text">
              <UserRound className="h-4 w-4 text-app-accent" />
              {booking.customerName}
            </p>
            <p className="text-sm text-app-muted">{serviceName}</p>
            <p className="inline-flex items-center gap-2 text-sm text-app-muted">
              <CalendarDays className="h-4 w-4 text-app-accent" />
              {booking.date} - {booking.timeRange}
            </p>
          </div>

          <div className="text-right">
            <VendorBookingStatusBadge status={booking.status} />
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-app-muted">
              Quantity: {booking.quantity}
            </p>
          </div>
        </div>

        <VendorBookingStatusAction
          status={booking.status}
          onMarkCompleted={() => onMarkCompleted(booking.id)}
          onMarkNoShow={() => onMarkNoShow(booking.id)}
          isUpdating={isStatusUpdating}
        />
      </CardContent>
    </Card>
  )
}
