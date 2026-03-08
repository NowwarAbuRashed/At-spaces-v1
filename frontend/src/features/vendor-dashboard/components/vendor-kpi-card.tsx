import { ArrowUpRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/cn'
import type { VendorDashboardKpi } from '@/features/vendor-dashboard/types'

export interface VendorKpiCardProps {
  metric: VendorDashboardKpi
}

export function VendorKpiCard({ metric }: VendorKpiCardProps) {
  return (
    <Card className="h-full">
      <CardContent className="space-y-5 pt-6">
        <div className="flex items-center justify-between">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-app-surface-alt text-app-accent">
            <metric.icon className="h-5 w-5" />
          </span>
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold',
              metric.trendDirection === 'up' && 'bg-app-success/20 text-app-success',
              metric.trendDirection === 'down' && 'bg-app-danger/20 text-app-danger',
              metric.trendDirection === 'neutral' && 'bg-app-surface-alt text-app-muted',
            )}
          >
            <ArrowUpRight className={cn('h-3 w-3', metric.trendDirection === 'down' && 'rotate-180')} />
            {metric.trendLabel}
          </span>
        </div>

        <div className="space-y-1.5">
          <p className="font-heading text-3xl font-semibold text-app-text">{metric.value}</p>
          <p className="text-sm text-app-muted">{metric.label}</p>
          <p className="text-xs text-app-muted/90">{metric.helperText}</p>
        </div>
      </CardContent>
    </Card>
  )
}
