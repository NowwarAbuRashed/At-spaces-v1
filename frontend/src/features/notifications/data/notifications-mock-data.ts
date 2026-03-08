import type { NotificationCategory, NotificationItem } from '@/features/notifications/types'

export const notificationCategories: Array<{
  key: 'all' | NotificationCategory
  label: string
}> = [
  { key: 'all', label: 'All' },
  { key: 'approvals', label: 'Approvals' },
  { key: 'branches', label: 'Branches' },
  { key: 'vendors', label: 'Vendors' },
  { key: 'pricing', label: 'Pricing' },
  { key: 'security', label: 'Security' },
  { key: 'applications', label: 'Applications' },
]

export const notificationsMockData: NotificationItem[] = [
  {
    id: 'NTF-001',
    title: 'New Approval Request',
    description:
      'Mohammed Al-Khatib requested to increase Hot Desk capacity from 30 to 45 seats at Amman Downtown Hub.',
    minutesAgo: 5,
    category: 'approvals',
    read: false,
  },
  {
    id: 'NTF-002',
    title: 'Low Occupancy Alert',
    description: 'Zarqa Tech Park occupancy dropped below 30% for the third consecutive day.',
    minutesAgo: 12,
    category: 'branches',
    read: false,
  },
  {
    id: 'NTF-003',
    title: 'New Vendor Application',
    description: "Khalil Rawashine submitted a 'Become a Vendor' application for Khalil Co-Work in Amman.",
    minutesAgo: 34,
    category: 'applications',
    read: false,
  },
  {
    id: 'NTF-004',
    title: 'Unusual Login Detected',
    description: 'A login attempt from an unrecognized IP address (185.234.xx.xx) was blocked.',
    minutesAgo: 60,
    category: 'security',
    read: false,
  },
  {
    id: 'NTF-005',
    title: 'Request Expiring Soon',
    description: 'REQ-002 from Dina Masri has been pending for 4 days and auto-expires in 3 days.',
    minutesAgo: 120,
    category: 'approvals',
    read: true,
  },
  {
    id: 'NTF-006',
    title: 'Branch Activated',
    description: 'Abdali Business Center is now active after successful compliance review.',
    minutesAgo: 145,
    category: 'branches',
    read: true,
  },
  {
    id: 'NTF-007',
    title: 'Pricing Updated',
    description: 'Meeting Room hourly price changed from 10 JOD to 12 JOD in Amman Downtown Hub.',
    minutesAgo: 210,
    category: 'pricing',
    read: true,
  },
  {
    id: 'NTF-008',
    title: 'Vendor Reliability Drop',
    description: 'Omar Nabil reliability dropped to 72% and now requires review.',
    minutesAgo: 260,
    category: 'vendors',
    read: true,
  },
  {
    id: 'NTF-009',
    title: 'Security Policy Updated',
    description: 'MFA is now required for all admin accounts after next login.',
    minutesAgo: 320,
    category: 'security',
    read: true,
  },
  {
    id: 'NTF-010',
    title: 'Vendor Suspension Applied',
    description: 'Dina Masri account was set to suspended due to repeated no-show violations.',
    minutesAgo: 365,
    category: 'vendors',
    read: true,
  },
  {
    id: 'NTF-011',
    title: 'Approval Finalized',
    description: 'REQ-004 was approved and branch inventory has been updated.',
    minutesAgo: 415,
    category: 'approvals',
    read: true,
  },
  {
    id: 'NTF-012',
    title: 'Branch Maintenance Scheduled',
    description: 'Salt Creative Hub will be under maintenance this weekend from 10:00 to 14:00.',
    minutesAgo: 500,
    category: 'branches',
    read: true,
  },
]

