import { useMutation, useQuery } from '@tanstack/react-query'
import { Download } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { exportAdminReport, fetchAdminAnalytics } from '@/api/admin-api'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingState } from '@/components/shared/loading-state'
import { MetricCard } from '@/components/shared/metric-card'
import { PageHeader } from '@/components/shared/page-header'
import { SectionCard } from '@/components/shared/section-card'
import { Button, Tabs } from '@/components/ui'
import {
  OccupancyCityChart,
  ServiceUsageChart,
  ServiceUsageLegend,
} from '@/features/analytics/components'
import {
  mapAdminAnalyticsToCityData,
  mapAdminAnalyticsToMetrics,
  mapAdminAnalyticsToServiceData,
} from '@/features/analytics/lib/analytics-mappers'
import {
  analyticsMetricsByRange,
  analyticsRangeTabs,
  occupancyByCityByRange,
  serviceUsageByRange,
} from '@/features/analytics/data/analytics-mock-data'
import type { AnalyticsTimeRange } from '@/features/analytics/types'
import { useAuth } from '@/features/auth/store/auth-context'
import { getInlineApiErrorMessage } from '@/lib/api-error'

interface DateRangePayload {
  from: string
  to: string
}

function toIsoDate(value: Date) {
  return value.toISOString().slice(0, 10)
}

function rangeByTab(range: AnalyticsTimeRange): DateRangePayload {
  const now = new Date()
  const to = toIsoDate(now)

  const fromDate = new Date(now)
  if (range === 'week') {
    fromDate.setDate(fromDate.getDate() - 6)
  } else if (range === 'month') {
    fromDate.setDate(fromDate.getDate() - 29)
  } else if (range === 'custom') {
    fromDate.setDate(fromDate.getDate() - 13)
  }

  const from = range === 'today' ? to : toIsoDate(fromDate)
  return { from, to }
}

export function AnalyticsPage() {
  const { accessToken } = useAuth()
  const [activeRange, setActiveRange] = useState<AnalyticsTimeRange>('month')

  const range = useMemo(() => rangeByTab(activeRange), [activeRange])

  const analyticsQuery = useQuery({
    queryKey: ['admin', 'analytics', accessToken, activeRange, range.from, range.to],
    queryFn: () =>
      fetchAdminAnalytics({
        accessToken: accessToken!,
        from: range.from,
        to: range.to,
      }),
    enabled: Boolean(accessToken),
  })

  const exportMutation = useMutation({
    mutationFn: () =>
      exportAdminReport({
        accessToken: accessToken!,
        reportType: 'analytics_overview',
        format: 'csv',
        filters: {
          range: activeRange,
          from: range.from,
          to: range.to,
        },
      }),
  })

  const activeMetrics = useMemo(() => {
    if (!accessToken || !analyticsQuery.data) {
      return analyticsMetricsByRange[activeRange]
    }

    return mapAdminAnalyticsToMetrics(analyticsQuery.data)
  }, [accessToken, activeRange, analyticsQuery.data])

  const cityData = useMemo(() => {
    if (!accessToken || !analyticsQuery.data) {
      return occupancyByCityByRange[activeRange]
    }

    return mapAdminAnalyticsToCityData(analyticsQuery.data)
  }, [accessToken, activeRange, analyticsQuery.data])

  const serviceData = useMemo(() => {
    if (!accessToken || !analyticsQuery.data) {
      return serviceUsageByRange[activeRange]
    }

    return mapAdminAnalyticsToServiceData(analyticsQuery.data)
  }, [accessToken, activeRange, analyticsQuery.data])

  const handleExport = async () => {
    if (!accessToken) {
      toast.error('You must sign in to export analytics.')
      return
    }

    try {
      const result = await exportMutation.mutateAsync()
      if (result.status === 'ready' && result.url) {
        window.open(result.url, '_blank', 'noopener,noreferrer')
        toast.success('Export link generated.')
        return
      }

      toast.error(result.message ?? 'Export is currently unavailable in this environment.')
    } catch (error) {
      toast.error(getInlineApiErrorMessage(error, 'Failed to export analytics.'))
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Network Analytics"
        description="Data-driven insights across the AtSpaces network."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Tabs
              value={activeRange}
              onChange={setActiveRange}
              items={analyticsRangeTabs}
              className="max-w-full overflow-x-auto"
            />
            <Button variant="outline" className="gap-2" onClick={handleExport} isLoading={exportMutation.isPending}>
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        }
      />

      {accessToken && analyticsQuery.isPending ? <LoadingState label="Loading analytics..." /> : null}

      {accessToken && analyticsQuery.isError ? (
        <EmptyState
          title="Unable to load analytics"
          description={getInlineApiErrorMessage(analyticsQuery.error, 'Refresh and try again.')}
          action={
            <Button variant="outline" onClick={() => void analyticsQuery.refetch()}>
              Retry
            </Button>
          }
        />
      ) : null}

      {!accessToken || analyticsQuery.isSuccess ? (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {activeMetrics.map((metric) => (
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

          <section className="grid gap-6 xl:grid-cols-2">
            <SectionCard title="Occupancy by City">
              <OccupancyCityChart data={cityData} />
            </SectionCard>

            <SectionCard title="Service Usage Distribution">
              <ServiceUsageChart data={serviceData} />
              <ServiceUsageLegend data={serviceData} />
            </SectionCard>
          </section>
        </>
      ) : null}
    </div>
  )
}
