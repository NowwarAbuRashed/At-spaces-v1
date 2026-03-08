import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingState } from '@/components/shared/loading-state'
import { PageHeader } from '@/components/shared/page-header'
import { SectionCard } from '@/components/shared/section-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useVendorAuth } from '@/features/auth/store/vendor-auth-context'
import {
  VendorBookingRow,
  VendorBookingsFilterBar,
} from '@/features/vendor-operations/components'
import type {
  VendorBookingStatus,
  VendorBookingStatusOption,
} from '@/features/vendor-operations/types'
import {
  useUpdateVendorBookingStatusMutation,
  useVendorBookingsQuery,
  useVendorServicesQuery,
} from '@/features/vendor/hooks/use-vendor-queries'
import { mapVendorBookingToView, mapVendorServiceToOption } from '@/features/vendor/lib/vendor-mappers'
import { getInlineApiErrorMessage } from '@/lib/api-error'

const bookingStatusOptions: VendorBookingStatusOption[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'no_show', label: 'No Show' },
  { value: 'cancelled', label: 'Cancelled' },
]

export function VendorBookingsPage() {
  const { accessToken } = useVendorAuth()
  const [dateFilter, setDateFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | VendorBookingStatus>('all')
  const [serviceFilter, setServiceFilter] = useState<'all' | string>('all')

  const bookingsQuery = useVendorBookingsQuery(accessToken, dateFilter || undefined)
  const servicesQuery = useVendorServicesQuery(accessToken)
  const updateStatusMutation = useUpdateVendorBookingStatusMutation(accessToken, dateFilter || undefined)

  const serviceOptions = useMemo(
    () => (servicesQuery.data?.items ?? []).map(mapVendorServiceToOption),
    [servicesQuery.data?.items],
  )

  const serviceMap = useMemo(
    () => new Map(serviceOptions.map((service) => [service.id, service.name])),
    [serviceOptions],
  )

  const bookings = useMemo(
    () => (bookingsQuery.data?.items ?? []).map(mapVendorBookingToView),
    [bookingsQuery.data?.items],
  )

  const filteredBookings = useMemo(
    () =>
      bookings.filter((booking) => {
        const matchesStatus = statusFilter === 'all' || booking.status === statusFilter
        const matchesService = serviceFilter === 'all' || booking.serviceId === serviceFilter
        return matchesStatus && matchesService
      }),
    [bookings, serviceFilter, statusFilter],
  )

  const totalQuantity = useMemo(
    () => filteredBookings.reduce((accumulator, booking) => accumulator + booking.quantity, 0),
    [filteredBookings],
  )

  const updateBookingStatus = async (bookingId: string, status: 'completed' | 'no_show') => {
    const parsedId = Number(bookingId)
    if (Number.isNaN(parsedId)) {
      toast.error('Invalid booking identifier.')
      return
    }

    try {
      await updateStatusMutation.mutateAsync({
        bookingId: parsedId,
        status,
      })
      toast.success(`Booking ${bookingId} marked as ${status}.`)
    } catch (error) {
      toast.error(getInlineApiErrorMessage(error, 'Failed to update booking status.', { sessionLabel: 'vendor' }))
    }
  }

  if (bookingsQuery.isPending || servicesQuery.isPending) {
    return <LoadingState label="Loading bookings..." />
  }

  if (bookingsQuery.isError || servicesQuery.isError) {
    const error = bookingsQuery.error ?? servicesQuery.error
    return (
      <EmptyState
        title="Unable to load bookings"
        description={getInlineApiErrorMessage(error, 'Please retry in a moment.', {
          sessionLabel: 'vendor',
        })}
        action={
          <Button
            variant="outline"
            onClick={() => {
              void bookingsQuery.refetch()
              void servicesQuery.refetch()
            }}
          >
            Retry
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bookings Management"
        description="Review upcoming reservations and update booking outcomes from live vendor booking APIs."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="neutral">{filteredBookings.length} bookings</Badge>
            <Badge variant="subtle">Total Quantity: {totalQuantity}</Badge>
          </div>
        }
      />

      <VendorBookingsFilterBar
        date={dateFilter}
        onDateChange={setDateFilter}
        status={statusFilter}
        onStatusChange={setStatusFilter}
        serviceId={serviceFilter}
        onServiceIdChange={setServiceFilter}
        statusOptions={bookingStatusOptions}
        serviceOptions={serviceOptions}
      />

      <SectionCard title="Vendor Bookings" description="Use status actions to mark completed or no-show bookings.">
        {filteredBookings.length ? (
          <div className="space-y-3">
            {filteredBookings.map((booking) => (
              <VendorBookingRow
                key={booking.id}
                booking={booking}
                serviceName={serviceMap.get(booking.serviceId) ?? `Service #${booking.serviceId}`}
                onMarkCompleted={(bookingId) => {
                  void updateBookingStatus(bookingId, 'completed')
                }}
                onMarkNoShow={(bookingId) => {
                  void updateBookingStatus(bookingId, 'no_show')
                }}
                isStatusUpdating={
                  updateStatusMutation.isPending &&
                  updateStatusMutation.variables?.bookingId === Number(booking.id)
                }
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No bookings match these filters"
            description="Clear one or more filters to view additional bookings."
          />
        )}
      </SectionCard>
    </div>
  )
}
