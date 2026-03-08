import type {
  VendorAvailabilitySlot,
  VendorAvailabilityStateOption,
  VendorBooking,
  VendorBookingStatusOption,
  VendorOperationServiceOption,
} from '@/features/vendor-operations/types'

export const vendorOperationServicesMock: VendorOperationServiceOption[] = [
  { id: 'service-001', name: 'Premium Desk Slot' },
  { id: 'service-002', name: 'Meeting Room - 6 Seats' },
  { id: 'service-003', name: 'Business Lounge Access' },
]

export const vendorAvailabilitySlotsMock: VendorAvailabilitySlot[] = [
  {
    id: 'slot-001',
    date: '2026-03-08',
    serviceId: 'service-001',
    startTime: '09:00',
    endTime: '11:00',
    availableUnits: 8,
    state: 'active',
  },
  {
    id: 'slot-002',
    date: '2026-03-08',
    serviceId: 'service-002',
    startTime: '11:30',
    endTime: '13:00',
    availableUnits: 2,
    state: 'active',
  },
  {
    id: 'slot-003',
    date: '2026-03-08',
    serviceId: 'service-003',
    startTime: '14:00',
    endTime: '15:30',
    availableUnits: 5,
    state: 'blocked',
  },
  {
    id: 'slot-004',
    date: '2026-03-09',
    serviceId: 'service-001',
    startTime: '10:00',
    endTime: '12:00',
    availableUnits: 6,
    state: 'active',
  },
  {
    id: 'slot-005',
    date: '2026-03-09',
    serviceId: 'service-002',
    startTime: '16:00',
    endTime: '18:00',
    availableUnits: 1,
    state: 'active',
  },
]

export const vendorAvailabilityStateOptions: VendorAvailabilityStateOption[] = [
  {
    value: 'active',
    label: 'Active',
    badgeTone: 'active',
  },
  {
    value: 'blocked',
    label: 'Blocked',
    badgeTone: 'paused',
  },
]

export const vendorBookingsMock: VendorBooking[] = [
  {
    id: 'booking-2001',
    customerName: 'Lina Haddad',
    serviceId: 'service-001',
    date: '2026-03-08',
    timeRange: '10:30 AM - 11:30 AM',
    quantity: 2,
    status: 'confirmed',
  },
  {
    id: 'booking-2002',
    customerName: 'Omar Salem',
    serviceId: 'service-002',
    date: '2026-03-08',
    timeRange: '01:15 PM - 02:15 PM',
    quantity: 1,
    status: 'pending',
  },
  {
    id: 'booking-2003',
    customerName: 'Nour Al-Khatib',
    serviceId: 'service-003',
    date: '2026-03-09',
    timeRange: '09:00 AM - 10:00 AM',
    quantity: 3,
    status: 'confirmed',
  },
  {
    id: 'booking-2004',
    customerName: 'Khaled Nasser',
    serviceId: 'service-001',
    date: '2026-03-09',
    timeRange: '04:00 PM - 05:00 PM',
    quantity: 1,
    status: 'completed',
  },
]

export const vendorBookingStatusOptions: VendorBookingStatusOption[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'no_show', label: 'No Show' },
]
