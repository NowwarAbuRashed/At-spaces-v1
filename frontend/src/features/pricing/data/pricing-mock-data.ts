import type { BookingPolicy, PricingPlan } from '@/features/pricing/types'

export const pricingPlans: PricingPlan[] = [
  {
    key: 'hotDesk',
    label: 'Hot Desk',
    title: 'Hot Desk Pricing',
    tiers: [
      { id: 'HD-1', name: 'Hourly', bookingsShare: '45% of bookings', price: '3.50 JOD/hr' },
      { id: 'HD-2', name: 'Half Day (4hr)', bookingsShare: '35% of bookings', price: '12.00 JOD' },
      { id: 'HD-3', name: 'Full Day', bookingsShare: '20% of bookings', price: '20.00 JOD' },
    ],
  },
  {
    key: 'privateOffice',
    label: 'Private Office',
    title: 'Private Office Pricing',
    tiers: [
      { id: 'PO-1', name: 'Hourly', bookingsShare: '18% of bookings', price: '9.00 JOD/hr' },
      { id: 'PO-2', name: 'Half Day', bookingsShare: '40% of bookings', price: '32.00 JOD' },
      { id: 'PO-3', name: 'Full Day', bookingsShare: '42% of bookings', price: '55.00 JOD' },
    ],
  },
  {
    key: 'meetingRoom',
    label: 'Meeting Room',
    title: 'Meeting Room Pricing',
    tiers: [
      { id: 'MR-1', name: 'Standard Room (6p)', bookingsShare: '52% of bookings', price: '10.00 JOD/hr' },
      { id: 'MR-2', name: 'Boardroom (12p)', bookingsShare: '33% of bookings', price: '18.00 JOD/hr' },
      { id: 'MR-3', name: 'Training Room (20p)', bookingsShare: '15% of bookings', price: '30.00 JOD/hr' },
    ],
  },
]

export const bookingPolicies: BookingPolicy[] = [
  {
    id: 'POL-001',
    title: 'Cancellation Window',
    description: 'How long before start time a booking can be canceled.',
    value: '2 hours before start',
  },
  {
    id: 'POL-002',
    title: 'No-Show Fee',
    description: 'Charge applied when customer does not check in.',
    value: '50% of booking amount',
  },
  {
    id: 'POL-003',
    title: 'Reschedule Limit',
    description: 'Maximum allowed reschedules for a booking.',
    value: '2 times per booking',
  },
  {
    id: 'POL-004',
    title: 'Peak Hour Multiplier',
    description: 'Applied during high-demand time windows.',
    value: '1.25x base price',
  },
]

