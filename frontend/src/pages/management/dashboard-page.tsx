import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, ArrowRight, Clock3, TrendingUp } from 'lucide-react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { listApprovalRequests, listAdminBranches, listAuditLog, fetchAdminAnalytics } from '@/api/admin-api'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingState } from '@/components/shared/loading-state'
import { MetricCard } from '@/components/shared/metric-card'
import { PageHeader } from '@/components/shared/page-header'
import { SectionCard } from '@/components/shared/section-card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/store/auth-context'
import {
  DashboardAlertItem,
  QuickActionCard,
  RecentActivityRow,
  TopBranchRow,
} from '@/features/dashboard/components'
import {
  buildDashboardAlerts,
  mapAuditLogToRecentActivity,
  mapDashboardMetrics,
  mapTopCitiesToTopBranches,
} from '@/features/dashboard/lib/dashboard-mappers'
import {
  dashboardAlerts as mockDashboardAlerts,
  dashboardMetrics as mockDashboardMetrics,
  quickActions,
  recentActivity as mockRecentActivity,
  topBranches as mockTopBranches,
} from '@/features/dashboard/data/dashboard-mock-data'
import { getInlineApiErrorMessage } from '@/lib/api-error'
import { ROUTES } from '@/lib/routes'

function toIsoDate(value: Date) {
  return value.toISOString().slice(0, 10)
}

function getAnalyticsWindow() {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 29)

  return {
    from: toIsoDate(from),
    to: toIsoDate(to),
  }
}

export function DashboardPage() {
  const { accessToken } = useAuth()
  const navigate = useNavigate()
  const analyticsWindow = useMemo(() => getAnalyticsWindow(), [])

  const analyticsQuery = useQuery({
    queryKey: ['admin', 'dashboard', 'analytics', accessToken, analyticsWindow.from, analyticsWindow.to],
    queryFn: () =>
      fetchAdminAnalytics({
        accessToken: accessToken!,
        from: analyticsWindow.from,
        to: analyticsWindow.to,
      }),
    enabled: Boolean(accessToken),
  })

  const branchesQuery = useQuery({
    queryKey: ['admin', 'dashboard', 'branches', accessToken],
    queryFn: () => listAdminBranches({ accessToken: accessToken!, limit: 100 }),
    enabled: Boolean(accessToken),
  })

  const approvalsQuery = useQuery({
    queryKey: ['admin', 'dashboard', 'approvals', accessToken],
    queryFn: () => listApprovalRequests({ accessToken: accessToken!, limit: 100 }),
    enabled: Boolean(accessToken),
  })

  const activityQuery = useQuery({
    queryKey: ['admin', 'dashboard', 'activity', accessToken],
    queryFn: () => listAuditLog({ accessToken: accessToken!, limit: 10 }),
    enabled: Boolean(accessToken),
  })

  const isLoading =
    Boolean(accessToken) &&
    (analyticsQuery.isPending || branchesQuery.isPending || approvalsQuery.isPending || activityQuery.isPending)
  const isError =
    Boolean(accessToken) &&
    (analyticsQuery.isError || branchesQuery.isError || approvalsQuery.isError || activityQuery.isError)
  const dashboardError = analyticsQuery.error ?? branchesQuery.error ?? approvalsQuery.error ?? activityQuery.error

  const dashboardMetrics = useMemo(() => {
    if (!accessToken || !analyticsQuery.data || !branchesQuery.data) {
      return mockDashboardMetrics
    }

    return mapDashboardMetrics(analyticsQuery.data, branchesQuery.data.items)
  }, [accessToken, analyticsQuery.data, branchesQuery.data])

  const alerts = useMemo(() => {
    if (!accessToken || !branchesQuery.data || !approvalsQuery.data) {
      return mockDashboardAlerts
    }

    return buildDashboardAlerts(approvalsQuery.data.items, branchesQuery.data.items)
  }, [accessToken, approvalsQuery.data, branchesQuery.data])

  const topBranchRows = useMemo(() => {
    if (!accessToken || !analyticsQuery.data) {
      return mockTopBranches
    }

    return mapTopCitiesToTopBranches(analyticsQuery.data)
  }, [accessToken, analyticsQuery.data])

  const recentActivity = useMemo(() => {
    if (!accessToken || !activityQuery.data) {
      return mockRecentActivity
    }

    return mapAuditLogToRecentActivity(activityQuery.data.items)
  }, [accessToken, activityQuery.data])

  const statusLabel = useMemo(() => {
    const highRiskAlerts = alerts.filter((alert) => alert.tone === 'danger').length
    return highRiskAlerts > 0 ? 'Needs Attention' : 'Healthy'
  }, [alerts])

  const currentDayLabel = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date())

  return (
    <div className="space-y-6">
      <PageHeader
        title="Good evening, Admin"
        description={
          <span>
            {currentDayLabel} - Network Status:{' '}
            <span className={statusLabel === 'Healthy' ? 'font-semibold text-app-success' : 'font-semibold text-app-warning'}>
              {statusLabel}
            </span>
          </span>
        }
        actions={
          <Button size="md" className="gap-2" onClick={() => navigate(ROUTES.ANALYTICS)}>
            <TrendingUp className="h-4 w-4" />
            View Insights
          </Button>
        }
      />

      {isLoading ? <LoadingState label="Loading dashboard..." /> : null}

      {isError ? (
        <EmptyState
          title="Unable to load dashboard"
          description={getInlineApiErrorMessage(dashboardError, 'Refresh and try again.')}
          action={
            <Button
              variant="outline"
              onClick={() => {
                void analyticsQuery.refetch()
                void branchesQuery.refetch()
                void approvalsQuery.refetch()
                void activityQuery.refetch()
              }}
            >
              Retry
            </Button>
          }
        />
      ) : null}

      {!isLoading && !isError ? (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {dashboardMetrics.map((metric) => (
              <MetricCard
                key={metric.label}
                label={metric.label}
                value={metric.value}
                icon={metric.icon}
                trend={metric.trend}
                trendDirection={metric.trendDirection}
              />
            ))}
          </section>

          <SectionCard
            title="Alerts & Actions"
            action={
              <span className="inline-flex items-center gap-2 text-sm text-app-warning">
                <AlertTriangle className="h-4 w-4" />
                Attention Needed
              </span>
            }
          >
            <div className="space-y-3">
              {alerts.map((alert) => (
                <DashboardAlertItem key={alert.id} alert={alert} />
              ))}
            </div>
          </SectionCard>

          <section className="grid gap-6 xl:grid-cols-2">
            <SectionCard
              title="Top Branches"
              action={
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-app-accent transition-colors hover:text-orange-300"
                  onClick={() => navigate(ROUTES.BRANCHES)}
                >
                  View All
                  <ArrowRight className="h-4 w-4" />
                </button>
              }
            >
              <div className="space-y-3">
                {topBranchRows.map((branch) => (
                  <TopBranchRow key={branch.rank} branch={branch} />
                ))}
              </div>
            </SectionCard>

            <SectionCard
              title="Recent Activity"
              action={
                <span className="inline-flex items-center gap-1.5 text-sm text-app-muted">
                  <Clock3 className="h-3.5 w-3.5" />
                  Live
                </span>
              }
            >
              <div className="space-y-3">
                {recentActivity.map((item) => (
                  <RecentActivityRow key={item.id} item={item} />
                ))}
              </div>
            </SectionCard>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            {quickActions.map((action) => (
              <QuickActionCard key={action.id} action={action} />
            ))}
          </section>
        </>
      ) : null}
    </div>
  )
}
