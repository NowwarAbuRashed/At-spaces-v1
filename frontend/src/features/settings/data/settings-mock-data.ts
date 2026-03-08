import type { ActivityLogEntry, ProfileSettings, ToggleSetting } from '@/features/settings/types'

export const profileDefaults: ProfileSettings = {
  fullName: 'Admin User',
  email: 'admin@atspaces.com',
  phone: '+962 7 9000 0000',
}

export const securitySettingsDefaults: ToggleSetting[] = [
  {
    key: 'mfa',
    title: 'Require MFA for admin login',
    description: 'All admin sessions must complete one-time verification.',
    enabled: true,
  },
  {
    key: 'suspicious_login_alerts',
    title: 'Alert on suspicious logins',
    description: 'Notify security channel when unrecognized devices attempt access.',
    enabled: true,
  },
  {
    key: 'session_timeout',
    title: 'Enforce 30-minute idle timeout',
    description: 'Automatically expire inactive admin sessions.',
    enabled: false,
  },
]

export const notificationSettingsDefaults: ToggleSetting[] = [
  {
    key: 'approval_updates',
    title: 'Approval workflow updates',
    description: 'Receive alerts when requests change status.',
    enabled: true,
  },
  {
    key: 'branch_alerts',
    title: 'Branch occupancy alerts',
    description: 'Get notified when occupancy breaches thresholds.',
    enabled: true,
  },
  {
    key: 'vendor_signals',
    title: 'Vendor performance alerts',
    description: 'Track reliability drops and no-show spikes.',
    enabled: true,
  },
  {
    key: 'weekly_digest',
    title: 'Weekly performance digest',
    description: 'Send a weekly email summary of network KPIs.',
    enabled: false,
  },
]

export const settingsActivityLog: ActivityLogEntry[] = [
  {
    id: 'LOG-001',
    title: 'Password changed',
    detail: 'Admin account password was updated successfully.',
    timestamp: 'Today, 09:18 AM',
  },
  {
    id: 'LOG-002',
    title: 'MFA enabled for all admins',
    detail: 'Security policy updated for role: admin.',
    timestamp: 'Yesterday, 04:02 PM',
  },
  {
    id: 'LOG-003',
    title: 'Notification preferences updated',
    detail: 'Approval and branch alert preferences were modified.',
    timestamp: 'Feb 22, 2026 - 11:41 AM',
  },
  {
    id: 'LOG-004',
    title: 'Profile photo changed',
    detail: 'Avatar updated for Admin User.',
    timestamp: 'Feb 20, 2026 - 03:29 PM',
  },
]

