import { Button } from '@/components/ui/button'
import type { VendorBookingStatus } from '@/features/vendor-operations/types'

export interface VendorBookingStatusActionProps {
  status: VendorBookingStatus
  onMarkCompleted: () => void
  onMarkNoShow: () => void
}

function canMarkCompleted(status: VendorBookingStatus) {
  return status !== 'completed' && status !== 'no_show'
}

function canMarkNoShow(status: VendorBookingStatus) {
  return status !== 'no_show' && status !== 'completed'
}

export function VendorBookingStatusAction({
  status,
  onMarkCompleted,
  onMarkNoShow,
}: VendorBookingStatusActionProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        size="sm"
        variant="secondary"
        disabled={!canMarkCompleted(status)}
        onClick={onMarkCompleted}
      >
        Mark Completed
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={!canMarkNoShow(status)}
        onClick={onMarkNoShow}
      >
        Mark No Show
      </Button>
    </div>
  )
}
