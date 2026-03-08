import type { LucideIcon } from 'lucide-react'
import { ArrowUpRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/cn'

export interface MetricCardProps {
  label: string
  value: string
  icon: LucideIcon
  trend?: string
  trendDirection?: 'up' | 'down' | 'neutral'
}

export function MetricCard({
  label,
  value,
  icon: Icon,
  trend,
  trendDirection = 'neutral',
}: MetricCardProps) {
  return (
    <Card className="h-full">
      <CardContent className="space-y-5 pt-6">
        <div className="flex items-center justify-between">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-app-surface-alt text-app-accent">
            <Icon className="h-5 w-5" />
          </span>
          {trend ? (
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold',
                trendDirection === 'up' && 'bg-app-success/20 text-app-success',
                trendDirection === 'down' && 'bg-app-danger/20 text-app-danger',
                trendDirection === 'neutral' && 'bg-app-surface-alt text-app-muted',
              )}
            >
              <ArrowUpRight className={cn('h-3 w-3', trendDirection === 'down' && 'rotate-180')} />
              {trend}
            </span>
          ) : null}
        </div>

        <div>
          <p className="font-heading text-3xl font-semibold text-app-text">{value}</p>
          <p className="mt-1 text-sm text-app-muted">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

