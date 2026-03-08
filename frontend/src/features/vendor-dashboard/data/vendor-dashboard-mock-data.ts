import {
  CalendarCheck,
  CalendarClock,
  ClipboardList,
  Gauge,
  ShieldCheck,
  Wrench,
} from 'lucide-react'
import { ROUTES } from '@/lib/routes'
import type {
  VendorBranchStatusSummary,
  VendorDashboardKpi,
  VendorQuickAction,
  VendorRecentBooking,
} from '@/features/vendor-dashboard/types'

export const vendorDashboardKpis: VendorDashboardKpi[] = [
  {
    id: 'today-occupancy',
    label: 'Today Occupancy',
    value: '78%',
    icon: Gauge,
    trendLabel: '+6.4%',
    trendDirection: 'up',
    helperText: 'Compared to this day last week.',
  },
  {
    id: 'upcoming-bookings',
    label: 'Upcoming Bookings',
    value: '14',
    icon: CalendarClock,
    trendLabel: '+3',
    trendDirection: 'up',
    helperText: 'Scheduled in the next 24 hours.',
  },
  {
    id: 'active-services',
    label: 'Active Services',
    value: '11',
    icon: Wrench,
    trendLabel: 'Stable',
    trendDirection: 'neutral',
    helperText: 'Published and available for booking.',
  },
  {
    id: 'pending-requests',
    label: 'Pending Requests',
    value: '3',
    icon: ClipboardList,
    trendLabel: '-1',
    trendDirection: 'down',
    helperText: 'Awaiting review or operational action.',
  },
]

export const vendorBranchStatusSummary: VendorBranchStatusSummary = {
  branchName: 'Amman Downtown Hub',
  branchStatus: 'active',
  occupancyPercent: 78,
  healthPercent: 92,
  activeCapacity: 39,
  totalCapacity: 50,
  nextPeakWindow: '6:00 PM - 8:00 PM',
  summary:
    'Operations are healthy with balanced staffing, no service outage risk, and strong evening demand.',
}

export const vendorRecentBookings: VendorRecentBooking[] = [
  {
    id: 'booking-1001',
    customerName: 'Lina Haddad',
    serviceName: 'Premium Desk Slot',
    dateTimeLabel: 'Today, 10:30 AM',
    status: 'confirmed',
  },
  {
    id: 'booking-1002',
    customerName: 'Omar Salem',
    serviceName: 'Meeting Room - 6 Seats',
    dateTimeLabel: 'Today, 1:15 PM',
    status: 'pending',
  },
  {
    id: 'booking-1003',
    customerName: 'Nour Al-Khatib',
    serviceName: 'Private Studio Session',
    dateTimeLabel: 'Today, 4:00 PM',
    status: 'confirmed',
  },
  {
    id: 'booking-1004',
    customerName: 'Khaled Nasser',
    serviceName: 'Business Lounge Access',
    dateTimeLabel: 'Tomorrow, 9:00 AM',
    status: 'completed',
  },
]

export const vendorQuickActions: VendorQuickAction[] = [
  {
    id: 'quick-services',
    label: 'Services',
    description: 'Update service catalog and pricing visibility.',
    path: ROUTES.VENDOR_SERVICES,
    icon: Wrench,
    badge: 'Manage',
  },
  {
    id: 'quick-availability',
    label: 'Availability',
    description: 'Adjust operating windows and booking slots.',
    path: ROUTES.VENDOR_AVAILABILITY,
    icon: CalendarClock,
  },
  {
    id: 'quick-bookings',
    label: 'Bookings',
    description: 'Review reservations and booking timelines.',
    path: ROUTES.VENDOR_BOOKINGS,
    icon: CalendarCheck,
  },
  {
    id: 'quick-requests',
    label: 'Requests',
    description: 'Process open branch and service requests.',
    path: ROUTES.VENDOR_REQUESTS,
    icon: ShieldCheck,
    badge: '3 Open',
  },
]
