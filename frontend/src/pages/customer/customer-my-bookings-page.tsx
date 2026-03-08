import { CalendarCheck2, CalendarX2, Download } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { CustomerPageShell } from '@/components/customer'
import { LoadingState } from '@/components/shared/loading-state'
import { Badge, Button, Card, CardContent } from '@/components/ui'
import { getCustomerBookingDetailsRequest, getCustomerBranchDetailsRequest } from '@/api/customer-api'
import {
  CustomerBookingCard,
  CustomerBookingsEmptyState,
  CustomerCancelBookingModal,
} from '@/features/customer-bookings/components'
import { mapBookingRecordToCustomerBooking } from '@/features/customer/lib/customer-mappers'
import { useCustomerAuth } from '@/features/customer-auth/store/customer-auth-context'
import {
  customerQueryKeys,
  useCancelCustomerBookingMutation,
  useCustomerBranchesQuery,
  useCustomerMyBookingsQuery,
  useExportCustomerBookingCalendarMutation,
} from '@/features/customer/hooks/use-customer-queries'
import { getInlineApiErrorMessage } from '@/lib/api-error'
import { CUSTOMER_ROUTES } from '@/lib/routes'
import type { CustomerBookingListItem } from '@/types/customer'
import { useQueries } from '@tanstack/react-query'

function countByStatus(bookings: CustomerBookingListItem[]) {
  return bookings.reduce(
    (acc, booking) => {
      acc[booking.status] += 1
      return acc
    },
    {
      confirmed: 0,
      pending: 0,
      cancelled: 0,
    },
  )
}

export function CustomerMyBookingsPage() {
  const { accessToken } = useCustomerAuth()
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null)
  const [calendarExportedAtByBookingId, setCalendarExportedAtByBookingId] = useState<Map<number, string>>(
    () => new Map(),
  )

  const bookingsQuery = useCustomerMyBookingsQuery(accessToken, {
    page: 1,
    limit: 20,
  })
  const cancelMutation = useCancelCustomerBookingMutation(accessToken, 1, 20)
  const exportCalendarMutation = useExportCustomerBookingCalendarMutation(accessToken)

  const bookingItems = useMemo(() => bookingsQuery.data?.items ?? [], [bookingsQuery.data?.items])
  const bookingDetailsQueries = useQueries({
    queries: bookingItems.map((booking) => ({
      queryKey: customerQueryKeys.bookingDetails(accessToken ?? 'no-token', booking.id),
      queryFn: () =>
        getCustomerBookingDetailsRequest({
          accessToken: accessToken!,
          bookingId: booking.id,
        }),
      enabled: Boolean(accessToken),
      retry: false,
    })),
  })

  const branchesQuery = useCustomerBranchesQuery({}, { enabled: true })
  const branchDetailsQueries = useQueries({
    queries: (branchesQuery.data?.items ?? []).map((branch) => ({
      queryKey: customerQueryKeys.branchDetails(branch.id),
      queryFn: () => getCustomerBranchDetailsRequest(branch.id),
      retry: false,
    })),
  })

  const serviceNameById = useMemo(() => {
    const map = new Map<number, string>()
    for (const query of branchDetailsQueries) {
      if (!query.data) {
        continue
      }

      for (const service of query.data.services) {
        map.set(service.vendorServiceId, service.name)
      }
    }

    return map
  }, [branchDetailsQueries])

  const bookings = useMemo(
    () =>
      bookingItems.map((booking, index) =>
        mapBookingRecordToCustomerBooking(booking, bookingDetailsQueries[index]?.data, {
          serviceNameById,
          calendarExportedAtByBookingId,
        }),
      ),
    [bookingDetailsQueries, bookingItems, calendarExportedAtByBookingId, serviceNameById],
  )

  const cancelTarget = useMemo(
    () => bookings.find((booking) => booking.id === cancelTargetId) ?? null,
    [bookings, cancelTargetId],
  )

  const statusTotals = useMemo(() => countByStatus(bookings), [bookings])

  const handleCancelRequest = (booking: CustomerBookingListItem) => {
    if (!booking.canCancel || booking.status === 'cancelled') {
      return
    }

    setCancelTargetId(booking.id)
  }

  const handleCancelConfirm = async () => {
    if (!cancelTarget) {
      return
    }

    try {
      await cancelMutation.mutateAsync(Number(cancelTarget.id))
      setCancelTargetId(null)
      toast.success(`Booking ${cancelTarget.bookingNumber} cancelled.`)
    } catch (error) {
      toast.error(getInlineApiErrorMessage(error, 'Failed to cancel booking.', { sessionLabel: 'user' }))
    }
  }

  const triggerCalendarDownload = (bookingNumber: string, calendarContent: string) => {
    if (typeof window === 'undefined') {
      return
    }

    if (typeof window.URL.createObjectURL !== 'function') {
      return
    }

    const blob = new Blob([calendarContent], { type: 'text/calendar;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const anchor = window.document.createElement('a')
    anchor.href = url
    anchor.download = `${bookingNumber}.ics`
    window.document.body.appendChild(anchor)
    anchor.click()
    window.document.body.removeChild(anchor)
    window.URL.revokeObjectURL(url)
  }

  const handleExportCalendar = async (booking: CustomerBookingListItem) => {
    if (!booking.canExportCalendar) {
      return
    }

    try {
      const calendarContent = await exportCalendarMutation.mutateAsync(Number(booking.id))
      triggerCalendarDownload(booking.bookingNumber, calendarContent)

      const exportedAt = new Date().toISOString()
      setCalendarExportedAtByBookingId((current) => {
        const next = new Map(current)
        next.set(Number(booking.id), exportedAt)
        return next
      })
      toast.success(`Calendar export created for ${booking.bookingNumber}.`)
    } catch (error) {
      toast.error(getInlineApiErrorMessage(error, 'Calendar export failed.', { sessionLabel: 'user' }))
    }
  }

  const refreshBookings = async () => {
    await bookingsQuery.refetch()
    toast.message('Bookings refreshed.')
  }

  const isPageLoading =
    bookingsQuery.isLoading || bookingDetailsQueries.some((queryState) => queryState.isLoading)
  const pageError =
    bookingsQuery.error ??
    bookingDetailsQueries.find((queryState) => queryState.error)?.error

  if (isPageLoading) {
    return (
      <CustomerPageShell
        eyebrow="My Bookings"
        title="Loading your bookings"
        description="Fetching your reservation list from the backend."
        badges={['Customer bookings']}
      >
        <LoadingState label="Loading your bookings..." />
      </CustomerPageShell>
    )
  }

  if (pageError) {
    return (
      <CustomerPageShell
        eyebrow="My Bookings"
        title="Unable to load bookings"
        description={getInlineApiErrorMessage(pageError, 'Your booking list is unavailable right now.', {
          sessionLabel: 'user',
        })}
        badges={['Backend response']}
      >
        <Card>
          <CardContent className="space-y-4 pt-6">
            <p className="text-sm text-app-muted">Please retry loading your bookings.</p>
            <Button type="button" variant="secondary" onClick={refreshBookings}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </CustomerPageShell>
    )
  }

  return (
    <CustomerPageShell
      eyebrow="My Bookings"
      title="Manage your reservations"
      description="Review your bookings, cancel when needed, and export calendar events."
      badges={['Live booking data', 'Real cancel/export actions']}
      actions={
        <div className="flex flex-wrap gap-2">
          <Link to={CUSTOMER_ROUTES.BOOKING_PREVIEW}>
            <Button type="button" variant="secondary">
              Create another booking
            </Button>
          </Link>
          <Button type="button" variant="ghost" onClick={refreshBookings}>
            Refresh list
          </Button>
        </div>
      }
    >
      <Card>
        <CardContent className="flex flex-wrap items-center gap-2 pt-6">
          <Badge variant="success" className="inline-flex items-center gap-1.5">
            <CalendarCheck2 className="h-3.5 w-3.5" />
            {statusTotals.confirmed} confirmed
          </Badge>
          <Badge variant="warning" className="inline-flex items-center gap-1.5">
            <Download className="h-3.5 w-3.5" />
            {statusTotals.pending} pending
          </Badge>
          <Badge variant="danger" className="inline-flex items-center gap-1.5">
            <CalendarX2 className="h-3.5 w-3.5" />
            {statusTotals.cancelled} cancelled
          </Badge>
        </CardContent>
      </Card>

      {bookings.length === 0 ? (
        <CustomerBookingsEmptyState onReset={refreshBookings} />
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <CustomerBookingCard
              key={booking.id}
              booking={booking}
              isCancelling={cancelMutation.isPending && cancelTargetId === booking.id}
              onCancelRequest={handleCancelRequest}
              onExportCalendar={handleExportCalendar}
            />
          ))}
        </div>
      )}

      <CustomerCancelBookingModal
        open={Boolean(cancelTarget)}
        booking={cancelTarget}
        isCancelling={cancelMutation.isPending}
        onClose={() => setCancelTargetId(null)}
        onConfirm={handleCancelConfirm}
      />
    </CustomerPageShell>
  )
}
