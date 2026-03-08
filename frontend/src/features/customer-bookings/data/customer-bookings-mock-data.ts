import type { CustomerBookingListItem } from '@/types/customer'

export const mockCustomerBookings: CustomerBookingListItem[] = [
  {
    id: 'booking-7841',
    bookingNumber: 'BK-7841',
    branchName: 'Riyadh Tech Hub',
    serviceName: 'Meeting Room',
    startAt: '2026-03-15T09:00:00.000Z',
    endAt: '2026-03-15T11:00:00.000Z',
    quantity: 1,
    totalPrice: 520,
    currency: 'SAR',
    status: 'confirmed',
    canCancel: true,
    canExportCalendar: true,
    calendarExportedAt: null,
  },
  {
    id: 'booking-7838',
    bookingNumber: 'BK-7838',
    branchName: 'Jeddah Bay Collective',
    serviceName: 'Workshop Hall',
    startAt: '2026-03-20T13:00:00.000Z',
    endAt: '2026-03-20T16:00:00.000Z',
    quantity: 2,
    totalPrice: 1500,
    currency: 'SAR',
    status: 'pending',
    canCancel: true,
    canExportCalendar: true,
    calendarExportedAt: null,
  },
  {
    id: 'booking-7829',
    bookingNumber: 'BK-7829',
    branchName: 'Khobar Business Lounge',
    serviceName: 'Day Pass',
    startAt: '2026-03-05T08:00:00.000Z',
    endAt: '2026-03-05T17:00:00.000Z',
    quantity: 1,
    totalPrice: 140,
    currency: 'SAR',
    status: 'cancelled',
    canCancel: false,
    canExportCalendar: false,
    calendarExportedAt: null,
  },
]

export function cloneMockCustomerBookings() {
  return mockCustomerBookings.map((booking) => ({ ...booking }))
}
