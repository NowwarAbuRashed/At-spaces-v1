import type {
  VendorCapacityRequest,
  VendorCapacityServiceOption,
  VendorNotification,
  VendorPreferenceSettings,
  VendorProfileSettings,
} from '@/features/vendor-control/types'

export const vendorCapacityServiceOptionsMock: VendorCapacityServiceOption[] = [
  {
    id: 'service-001',
    name: 'Premium Desk Slot',
    currentCapacity: 42,
  },
  {
    id: 'service-002',
    name: 'Meeting Room - 6 Seats',
    currentCapacity: 10,
  },
  {
    id: 'service-003',
    name: 'Business Lounge Access',
    currentCapacity: 30,
  },
]

export const vendorCapacityRequestsMock: VendorCapacityRequest[] = [
  {
    id: 'request-001',
    serviceId: 'service-001',
    currentCapacity: 42,
    requestedCapacity: 48,
    reason: 'Sustained demand increase on weekday mornings over the past two weeks.',
    requestDate: '2026-03-05',
    status: 'underReview',
  },
  {
    id: 'request-002',
    serviceId: 'service-002',
    currentCapacity: 10,
    requestedCapacity: 12,
    reason: 'Corporate team packages for monthly strategy sessions require extra room slots.',
    requestDate: '2026-03-03',
    status: 'approved',
  },
  {
    id: 'request-003',
    serviceId: 'service-003',
    currentCapacity: 30,
    requestedCapacity: 34,
    reason: 'Weekend lounge occupancy exceeded 90% and affected customer check-in flow.',
    requestDate: '2026-03-01',
    status: 'pending',
  },
]

export const vendorNotificationsMock: VendorNotification[] = [
  {
    id: 'notification-001',
    title: 'Capacity Request Updated',
    message: 'Your Meeting Room capacity request has been approved.',
    category: 'requests',
    createdAt: '2026-03-08T09:00:00.000Z',
    isRead: false,
  },
  {
    id: 'notification-002',
    title: 'Operational Alert',
    message: 'Peak utilization expected between 6 PM and 8 PM today.',
    category: 'operations',
    createdAt: '2026-03-08T06:45:00.000Z',
    isRead: false,
  },
  {
    id: 'notification-003',
    title: 'Security Reminder',
    message: 'Please rotate branch manager credentials within the next 48 hours.',
    category: 'security',
    createdAt: '2026-03-07T14:30:00.000Z',
    isRead: true,
  },
  {
    id: 'notification-004',
    title: 'Billing Summary Ready',
    message: 'Your monthly billing summary for March is now available.',
    category: 'billing',
    createdAt: '2026-03-06T12:00:00.000Z',
    isRead: true,
  },
]

export const vendorProfileSettingsMock: VendorProfileSettings = {
  fullName: 'Maya Al-Masri',
  email: 'maya.almarsri@atspaces-vendor.com',
  phoneNumber: '+962 7 9012 4455',
}

export const vendorPreferenceSettingsMock: VendorPreferenceSettings = {
  emailAlerts: true,
  smsAlerts: false,
  weeklyDigest: true,
}
