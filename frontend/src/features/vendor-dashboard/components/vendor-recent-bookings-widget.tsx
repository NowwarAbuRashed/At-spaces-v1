import { DataList } from '@/components/shared/data-list'
import { SectionCard } from '@/components/shared/section-card'
import type { DataListColumn } from '@/components/shared/data-list'
import { VendorBookingStatusBadge } from '@/features/vendor-dashboard/components/vendor-booking-status-badge'
import type { VendorRecentBooking } from '@/features/vendor-dashboard/types'

const bookingColumns: DataListColumn<VendorRecentBooking>[] = [
  {
    key: 'customer',
    label: 'Customer',
    render: (row) => <span className="font-semibold text-app-text">{row.customerName}</span>,
  },
  {
    key: 'service',
    label: 'Service',
    render: (row) => <span className="text-app-muted">{row.serviceName}</span>,
  },
  {
    key: 'date-time',
    label: 'Date/Time',
    render: (row) => <span className="text-app-muted">{row.dateTimeLabel}</span>,
  },
  {
    key: 'status',
    label: 'Status',
    render: (row) => <VendorBookingStatusBadge status={row.status} />,
  },
]

export interface VendorRecentBookingsWidgetProps {
  bookings: VendorRecentBooking[]
}

export function VendorRecentBookingsWidget({ bookings }: VendorRecentBookingsWidgetProps) {
  return (
    <SectionCard
      title="Recent Bookings"
      description="Latest confirmed and pending reservations across your branch."
      className="h-full"
    >
      <DataList
        columns={bookingColumns}
        rows={bookings}
        rowKey={(row) => row.id}
        emptyTitle="No bookings yet"
        emptyDescription="Incoming reservations will appear here once available."
      />
    </SectionCard>
  )
}
