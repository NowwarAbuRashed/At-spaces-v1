import { ClipboardList, Gauge, Wrench, CalendarDays, CalendarClock, Clock3 } from 'lucide-react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingState } from '@/components/shared/loading-state'
import { PageHeader } from '@/components/shared/page-header'
import { SectionCard } from '@/components/shared/section-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useVendorAuth } from '@/features/auth/store/vendor-auth-context'
import {
  VendorBranchStatusWidget,
  VendorKpiCard,
  VendorQuickActionCard,
  VendorRecentBookingsWidget,
} from '@/features/vendor-dashboard/components'
import {
  vendorQuickActions,
} from '@/features/vendor-dashboard/data/vendor-dashboard-mock-data'
import { useVendorBookingsQuery, useVendorBranchesQuery, useVendorDashboardQuery, useVendorNotificationsQuery, useVendorServicesQuery } from '@/features/vendor/hooks/use-vendor-queries'
import { mapVendorBookingToRecent, mapVendorDashboardStatusToBadge } from '@/features/vendor/lib/vendor-mappers'
import { getInlineApiErrorMessage } from '@/lib/api-error'
import { ROUTES } from '@/lib/routes'

export function VendorDashboardPage() {
  const navigate = useNavigate()
  const { accessToken } = useVendorAuth()
  const todayLabel = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date())

  const dashboardQuery = useVendorDashboardQuery(accessToken)
  const branchesQuery = useVendorBranchesQuery(accessToken)
  const servicesQuery = useVendorServicesQuery(accessToken)
  const bookingsQuery = useVendorBookingsQuery(accessToken)
  const notificationsQuery = useVendorNotificationsQuery(accessToken)

  const serviceNameById = useMemo(() => {
    return new Map((servicesQuery.data?.items ?? []).map((service) => [service.vendorServiceId, service.name]))
  }, [servicesQuery.data?.items])

  const kpis = useMemo(() => {
    const dashboard = dashboardQuery.data
    const services = servicesQuery.data?.items ?? []
    const activeServices = services.filter((service) => service.isAvailable).length
    const pendingRequestHints =
      notificationsQuery.data?.items.filter((notification) => {
        const normalized = `${notification.type} ${notification.title} ${notification.body}`.toLowerCase()
        return (
          !notification.isRead &&
          (normalized.includes('request') || normalized.includes('capacity') || normalized.includes('approval'))
        )
      }).length ?? 0

    return [
      {
        id: 'today-occupancy',
        label: 'Today Occupancy',
        value: dashboard ? `${dashboard.todayOccupancy}%` : '--',
        icon: Gauge,
        trendLabel: 'Live',
        trendDirection: 'neutral' as const,
        helperText: 'From vendor dashboard API.',
      },
      {
        id: 'upcoming-bookings',
        label: 'Upcoming Bookings',
        value: dashboard ? String(dashboard.upcomingBookings) : '--',
        icon: CalendarClock,
        trendLabel: 'Live',
        trendDirection: 'neutral' as const,
        helperText: 'Bookings scheduled ahead.',
      },
      {
        id: 'active-services',
        label: 'Active Services',
        value: String(activeServices),
        icon: Wrench,
        trendLabel: `${services.length} total`,
        trendDirection: 'neutral' as const,
        helperText: 'Vendor service list API.',
      },
      {
        id: 'pending-requests',
        label: 'Pending Requests',
        value: notificationsQuery.isError ? 'N/A' : String(pendingRequestHints),
        icon: ClipboardList,
        trendLabel: notificationsQuery.isError ? 'Unavailable' : 'Derived',
        trendDirection: 'neutral' as const,
        helperText: 'Exact request history endpoint is not available yet.',
      },
    ]
  }, [
    dashboardQuery.data,
    notificationsQuery.data?.items,
    notificationsQuery.isError,
    servicesQuery.data?.items,
  ])

  const recentBookings = useMemo(() => {
    const bookings = bookingsQuery.data?.items ?? []
    return bookings.slice(0, 6).map((booking) => mapVendorBookingToRecent(booking, serviceNameById))
  }, [bookingsQuery.data?.items, serviceNameById])

  const branchStatusSummary = useMemo(() => {
    const branchName = branchesQuery.data?.[0]?.name ?? 'Primary Branch'
    const totalCapacity = (servicesQuery.data?.items ?? []).reduce(
      (sum, service) => sum + service.maxCapacity,
      0,
    )
    const activeCapacity = (servicesQuery.data?.items ?? []).reduce(
      (sum, service) => sum + (service.isAvailable ? service.maxCapacity : 0),
      0,
    )
    const occupancy = dashboardQuery.data?.todayOccupancy ?? 0
    const status = dashboardQuery.data?.branchStatus ?? 'calm'

    const healthPercentByStatus = {
      calm: 92,
      moderate: 79,
      busy: 64,
    } as const

    return {
      branchName,
      branchStatus: mapVendorDashboardStatusToBadge(status),
      occupancyPercent: occupancy,
      healthPercent: healthPercentByStatus[status],
      activeCapacity,
      totalCapacity,
      summary:
        status === 'busy'
          ? 'High occupancy detected. Plan for peak traffic and ensure staffing coverage.'
          : status === 'moderate'
            ? 'Balanced operational load with manageable demand.'
            : 'Stable utilization with healthy remaining capacity.',
      nextPeakWindow:
        status === 'busy'
          ? 'Peak window in progress'
          : `Next 24h bookings: ${dashboardQuery.data?.upcomingBookings ?? 0}`,
    }
  }, [branchesQuery.data, dashboardQuery.data, servicesQuery.data?.items])

  if (dashboardQuery.isPending || branchesQuery.isPending || servicesQuery.isPending || bookingsQuery.isPending) {
    return <LoadingState label="Loading vendor dashboard..." />
  }

  if (dashboardQuery.isError || branchesQuery.isError || servicesQuery.isError || bookingsQuery.isError) {
    const candidateError =
      dashboardQuery.error ?? branchesQuery.error ?? servicesQuery.error ?? bookingsQuery.error
    return (
      <EmptyState
        title="Unable to load vendor dashboard"
        description={getInlineApiErrorMessage(candidateError, 'Please retry in a moment.', {
          sessionLabel: 'vendor',
        })}
        action={
          <Button
            variant="outline"
            onClick={() => {
              void dashboardQuery.refetch()
              void branchesQuery.refetch()
              void servicesQuery.refetch()
              void bookingsQuery.refetch()
            }}
          >
            Retry
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendor Dashboard"
        description={
          <span className="inline-flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-app-accent" />
            {todayLabel}
          </span>
        }
        actions={
          <>
            <Badge variant="accent" className="h-9">
              Live Backend Data
            </Badge>
            <Button
              type="button"
              variant="secondary"
              className="gap-2"
              onClick={() => navigate(ROUTES.VENDOR_BOOKINGS)}
            >
              <Clock3 className="h-4 w-4" />
              View Bookings
            </Button>
          </>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((metric) => (
          <VendorKpiCard key={metric.id} metric={metric} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <VendorRecentBookingsWidget bookings={recentBookings} />
        <VendorBranchStatusWidget summary={branchStatusSummary} />
      </section>

      <SectionCard title="Quick Actions" description="Move directly to high-impact operational workflows.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {vendorQuickActions.map((action) => (
            <VendorQuickActionCard key={action.id} action={action} />
          ))}
        </div>
      </SectionCard>
    </div>
  )
}
