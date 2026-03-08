import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { EmptyState } from '@/components/shared/empty-state'
import { PageHeader } from '@/components/shared/page-header'
import { SectionCard } from '@/components/shared/section-card'
import { Badge } from '@/components/ui/badge'
import {
  VendorBookingRow,
  VendorBookingsFilterBar,
} from '@/features/vendor-operations/components'
import {
  vendorBookingsMock,
  vendorBookingStatusOptions,
  vendorOperationServicesMock,
} from '@/features/vendor-operations/data/vendor-operations-mock-data'
import type {
  VendorBooking,
  VendorBookingStatus,
} from '@/features/vendor-operations/types'

export function VendorBookingsPage() {
  const [bookings, setBookings] = useState<VendorBooking[]>(vendorBookingsMock)
  const [dateFilter, setDateFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | VendorBookingStatus>('all')
  const [serviceFilter, setServiceFilter] = useState<'all' | string>('all')

  const serviceMap = useMemo(
    () => new Map(vendorOperationServicesMock.map((service) => [service.id, service.name])),
    [],
  )

  const filteredBookings = useMemo(
    () =>
      bookings.filter((booking) => {
        const matchesDate = !dateFilter || booking.date === dateFilter
        const matchesStatus = statusFilter === 'all' || booking.status === statusFilter
        const matchesService = serviceFilter === 'all' || booking.serviceId === serviceFilter
        return matchesDate && matchesStatus && matchesService
      }),
    [bookings, dateFilter, serviceFilter, statusFilter],
  )

  const totalQuantity = useMemo(
    () => filteredBookings.reduce((accumulator, booking) => accumulator + booking.quantity, 0),
    [filteredBookings],
  )

  const updateBookingStatus = (bookingId: string, status: VendorBookingStatus) => {
    setBookings((prev) =>
      prev.map((booking) =>
        booking.id === bookingId
          ? {
              ...booking,
              status,
            }
          : booking,
      ),
    )

    toast.success(`Booking ${bookingId} marked as ${status}.`)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bookings Management"
        description="Review upcoming reservations and update booking outcomes in local mock state."
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
        statusOptions={vendorBookingStatusOptions}
        serviceOptions={vendorOperationServicesMock}
      />

      <SectionCard
        title="Vendor Bookings"
        description="Use status actions to mark completed or no-show bookings. Changes are local only."
      >
        {filteredBookings.length ? (
          <div className="space-y-3">
            {filteredBookings.map((booking) => (
              <VendorBookingRow
                key={booking.id}
                booking={booking}
                serviceName={serviceMap.get(booking.serviceId) ?? 'Service'}
                onMarkCompleted={(bookingId) => updateBookingStatus(bookingId, 'completed')}
                onMarkNoShow={(bookingId) => updateBookingStatus(bookingId, 'no_show')}
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
