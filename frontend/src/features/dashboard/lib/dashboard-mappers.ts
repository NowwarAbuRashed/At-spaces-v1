import { Activity, Building2, CalendarCheck2, DollarSign } from 'lucide-react'
import type {
  AdminAnalyticsApiResponse,
  AdminApprovalApiItem,
  AdminBranchApiItem,
  AuditLogApiItem,
} from '@/types/api'
import { formatCurrency, titleFromSnakeCase } from '@/lib/format'
import type {
  DashboardAlert,
  DashboardMetric,
  RecentActivityItem,
  TopBranch,
} from '@/features/dashboard/types'

function compactNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value)
}

function relativeAge(value: string) {
  const diffMs = Math.max(0, Date.now() - new Date(value).getTime())
  const minutes = Math.max(1, Math.round(diffMs / 60000))

  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  return `${Math.round(hours / 24)} days ago`
}

export function mapDashboardMetrics(
  analytics: AdminAnalyticsApiResponse,
  branches: AdminBranchApiItem[],
): DashboardMetric[] {
  const activeBranches = branches.filter((item) => item.status === 'active').length

  return [
    {
      label: 'Total Bookings',
      value: compactNumber(analytics.totalBookings),
      icon: CalendarCheck2,
      trend: 'Live',
      trendDirection: 'neutral',
    },
    {
      label: 'Network Occupancy',
      value: `${Math.round(analytics.occupancyRate)}%`,
      icon: Activity,
      trend: 'Live',
      trendDirection: 'neutral',
    },
    {
      label: 'Active Branches',
      value: compactNumber(activeBranches),
      icon: Building2,
      trend: `${branches.length} total`,
      trendDirection: 'up',
    },
    {
      label: 'Total Revenue',
      value: formatCurrency(analytics.revenue),
      icon: DollarSign,
      trend: 'Live',
      trendDirection: 'neutral',
    },
  ]
}

export function mapTopCitiesToTopBranches(analytics: AdminAnalyticsApiResponse): TopBranch[] {
  if (!analytics.topCities.length) {
    return []
  }

  const maxBookings = Math.max(...analytics.topCities.map((item) => item.bookings))
  return analytics.topCities.slice(0, 5).map((item, index) => ({
    rank: index + 1,
    name: `${item.city} Cluster`,
    city: item.city,
    occupancy: Math.max(8, Math.round((item.bookings / maxBookings) * 100)),
  }))
}

export function mapAuditLogToRecentActivity(items: AuditLogApiItem[]): RecentActivityItem[] {
  return items.slice(0, 6).map((item) => ({
    id: `ACT-${item.id}`,
    event: titleFromSnakeCase(item.action),
    detail: `${titleFromSnakeCase(item.entity)} #${item.entityId ?? 'n/a'}`,
    when: relativeAge(item.timestamp),
  }))
}

export function buildDashboardAlerts(
  approvals: AdminApprovalApiItem[],
  branches: AdminBranchApiItem[],
): DashboardAlert[] {
  const pendingApprovals = approvals.filter((item) => item.status === 'pending').length
  const suspendedBranches = branches.filter((item) => item.status === 'suspended').length
  const pendingBranches = branches.filter((item) => item.status === 'pending').length

  return [
    {
      id: 'AL-001',
      label: `${pendingApprovals} pending approval requests`,
      tone: pendingApprovals > 0 ? 'warning' : 'default',
    },
    {
      id: 'AL-002',
      label: `${suspendedBranches} suspended branches requiring review`,
      tone: suspendedBranches > 0 ? 'danger' : 'default',
    },
    {
      id: 'AL-003',
      label: `${pendingBranches} branches in onboarding`,
      tone: 'default',
    },
  ]
}
