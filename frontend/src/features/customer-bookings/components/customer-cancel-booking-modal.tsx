import { Button, Modal } from '@/components/ui'
import type { CustomerBookingListItem } from '@/types/customer'

export interface CustomerCancelBookingModalProps {
  booking: CustomerBookingListItem | null
  open: boolean
  isCancelling?: boolean
  onClose: () => void
  onConfirm: () => void
}

export function CustomerCancelBookingModal({
  booking,
  open,
  isCancelling = false,
  onClose,
  onConfirm,
}: CustomerCancelBookingModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Cancel booking"
      description="This action sends a real cancellation request to the backend."
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose}>
            Keep booking
          </Button>
          <Button type="button" variant="danger" isLoading={isCancelling} onClick={onConfirm}>
            Confirm cancel
          </Button>
        </>
      }
    >
      <div className="space-y-2 text-sm text-app-muted">
        <p>
          You are cancelling <span className="font-semibold text-app-text">{booking?.bookingNumber}</span>.
        </p>
        <p>
          Branch: <span className="font-semibold text-app-text">{booking?.branchName}</span>
        </p>
        <p>
          Service: <span className="font-semibold text-app-text">{booking?.serviceName}</span>
        </p>
      </div>
    </Modal>
  )
}
