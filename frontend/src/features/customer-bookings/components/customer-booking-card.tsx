import { CalendarClock, Hash, MapPin, UsersRound } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'
import { CustomerBookingActions } from '@/features/customer-bookings/components/customer-booking-actions'
import { CustomerBookingStatusBadge } from '@/features/customer-bookings/components/customer-booking-status-badge'
import { formatCurrency, formatShortDate } from '@/lib/format'
import type { CustomerBookingListItem } from '@/types/customer'

export interface CustomerBookingCardProps {
  booking: CustomerBookingListItem
  isCancelling?: boolean
  onCancelRequest: (booking: CustomerBookingListItem) => void
  onExportCalendar: (booking: CustomerBookingListItem) => void
}

export function CustomerBookingCard({
  booking,
  isCancelling,
  onCancelRequest,
  onExportCalendar,
}: CustomerBookingCardProps) {
  const startTime = new Date(booking.startAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
  const endTime = new Date(booking.endAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-app-muted">
              <Hash className="h-3.5 w-3.5 text-app-accent" />
              {booking.bookingNumber}
            </p>
            <p className="text-base font-semibold text-app-text">{booking.branchName}</p>
            <p className="text-sm text-app-muted">{booking.serviceName}</p>
          </div>
          <CustomerBookingStatusBadge status={booking.status} />
        </div>

        <div className="grid gap-2 text-sm text-app-muted sm:grid-cols-2">
          <p className="inline-flex items-center gap-1.5 rounded-xl border border-app-border bg-app-surface-alt/70 px-3 py-2">
            <CalendarClock className="h-4 w-4 text-app-accent" />
            {formatShortDate(booking.startAt)} | {startTime} - {endTime}
          </p>
          <p className="inline-flex items-center gap-1.5 rounded-xl border border-app-border bg-app-surface-alt/70 px-3 py-2">
            <UsersRound className="h-4 w-4 text-app-accent" />
            Quantity: {booking.quantity}
          </p>
          <p className="inline-flex items-center gap-1.5 rounded-xl border border-app-border bg-app-surface-alt/70 px-3 py-2">
            <MapPin className="h-4 w-4 text-app-accent" />
            Total: {formatCurrency(booking.totalPrice, booking.currency)}
          </p>
          <p className="inline-flex items-center gap-1.5 rounded-xl border border-app-border bg-app-surface-alt/70 px-3 py-2">
            <CalendarClock className="h-4 w-4 text-app-accent" />
            {booking.calendarExportedAt
              ? `Calendar export: ${formatShortDate(booking.calendarExportedAt)}`
              : 'Calendar export not added yet'}
          </p>
        </div>

        <CustomerBookingActions
          booking={booking}
          isCancelling={isCancelling}
          onCancelRequest={onCancelRequest}
          onExportCalendar={onExportCalendar}
        />
      </CardContent>
    </Card>
  )
}
