import { CalendarPlus2, CalendarX2 } from 'lucide-react'
import { Button } from '@/components/ui'
import type { CustomerBookingListItem } from '@/types/customer'

export interface CustomerBookingActionsProps {
  booking: CustomerBookingListItem
  isCancelling?: boolean
  onCancelRequest: (booking: CustomerBookingListItem) => void
  onExportCalendar: (booking: CustomerBookingListItem) => void
}

export function CustomerBookingActions({
  booking,
  isCancelling = false,
  onCancelRequest,
  onExportCalendar,
}: CustomerBookingActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={!booking.canCancel || booking.status === 'cancelled'}
        isLoading={isCancelling}
        onClick={() => onCancelRequest(booking)}
      >
        <CalendarX2 className="h-4 w-4" />
        Cancel Booking
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={!booking.canExportCalendar}
        onClick={() => onExportCalendar(booking)}
      >
        <CalendarPlus2 className="h-4 w-4" />
        {booking.calendarExportedAt ? 'Exported' : 'Add to Calendar'}
      </Button>
    </div>
  )
}
