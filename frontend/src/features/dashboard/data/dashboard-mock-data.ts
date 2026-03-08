import {
  Activity,
  Building2,
  CalendarCheck2,
  CheckSquare,
  DollarSign,
  Store,
  WalletCards,
} from 'lucide-react'
import type {
  DashboardAlert,
  DashboardMetric,
  DashboardQuickAction,
  RecentActivityItem,
  TopBranch,
} from '@/features/dashboard/types'

export const dashboardMetrics: DashboardMetric[] = [
  {
    label: 'Total Bookings Today',
    value: '247',
    icon: CalendarCheck2,
    trend: '+12%',
    trendDirection: 'up',
  },
  {
    label: 'Network Occupancy',
    value: '73%',
    icon: Activity,
    trend: '+5%',
    trendDirection: 'up',
  },
  {
    label: 'Active Branches',
    value: '42',
    icon: Building2,
    trend: '+2',
    trendDirection: 'up',
  },
  {
    label: 'Revenue Today',
    value: '3,840 JOD',
    icon: DollarSign,
    trend: '+8%',
    trendDirection: 'up',
  },
]

export const dashboardAlerts: DashboardAlert[] = [
  { id: 'AL-001', label: '3 pending approval requests', tone: 'warning' },
  { id: 'AL-002', label: "Branch 'Irbid Central' paused - vendor request pending", tone: 'danger' },
  { id: 'AL-003', label: '2 new vendor applications received', tone: 'default' },
]

export const topBranches: TopBranch[] = [
  { rank: 1, name: 'Amman Downtown Hub', city: 'Amman', occupancy: 92 },
  { rank: 2, name: 'Abdali Business Center', city: 'Amman', occupancy: 87 },
  { rank: 3, name: 'Irbid Innovation Lab', city: 'Irbid', occupancy: 81 },
  { rank: 4, name: 'Aqaba Marina Space', city: 'Aqaba', occupancy: 76 },
  { rank: 5, name: 'Zarqa Tech Park', city: 'Zarqa', occupancy: 71 },
]

export const recentActivity: RecentActivityItem[] = [
  { id: 'ACT-001', event: 'New booking', detail: 'Hot Desk at Amman Downtown Hub', when: '2 min ago' },
  { id: 'ACT-002', event: 'Vendor check-in', detail: '3 guests at Abdali Center', when: '15 min ago' },
  { id: 'ACT-003', event: 'Pricing updated', detail: 'Meeting Room hourly rate -> 12 JOD', when: '1 hr ago' },
  { id: 'ACT-004', event: 'Branch activated', detail: 'Zarqa Tech Park is now live', when: '3 hrs ago' },
  { id: 'ACT-005', event: 'Application submitted', detail: 'New vendor from Salt', when: '5 hrs ago' },
]

export const quickActions: DashboardQuickAction[] = [
  { id: 'QA-001', label: 'Review Approvals', badge: '3', icon: CheckSquare },
  { id: 'QA-002', label: 'View All Branches', icon: Store },
  { id: 'QA-003', label: 'Manage Pricing', icon: WalletCards },
]

