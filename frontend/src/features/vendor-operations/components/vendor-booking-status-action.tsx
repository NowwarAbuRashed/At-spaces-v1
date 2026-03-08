import { Button } from '@/components/ui/button'
import type { VendorBookingStatus } from '@/features/vendor-operations/types'

export interface VendorBookingStatusActionProps {
  status: VendorBookingStatus
  onMarkCompleted: () => void
  onMarkNoShow: () => void
  isUpdating?: boolean
}

function canMarkCompleted(status: VendorBookingStatus) {
  return status !== 'completed' && status !== 'no_show' && status !== 'cancelled'
}

function canMarkNoShow(status: VendorBookingStatus) {
  return status !== 'no_show' && status !== 'completed' && status !== 'cancelled'
}

export function VendorBookingStatusAction({
  status,
  onMarkCompleted,
  onMarkNoShow,
  isUpdating = false,
}: VendorBookingStatusActionProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        size="sm"
        variant="secondary"
        disabled={!canMarkCompleted(status) || isUpdating}
        onClick={onMarkCompleted}
      >
        Mark Completed
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={!canMarkNoShow(status) || isUpdating}
        onClick={onMarkNoShow}
      >
        Mark No Show
      </Button>
    </div>
  )
}
