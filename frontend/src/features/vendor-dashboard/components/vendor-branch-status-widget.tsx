import { Activity, Building2 } from 'lucide-react'
import { SectionCard } from '@/components/shared/section-card'
import { StatusBadge } from '@/components/shared/status-badge'
import { cn } from '@/lib/cn'
import type { VendorBranchStatusSummary } from '@/features/vendor-dashboard/types'

function clampPercent(value: number) {
  return Math.min(100, Math.max(0, value))
}

function getHealthTone(healthPercent: number) {
  if (healthPercent >= 85) {
    return 'text-app-success'
  }

  if (healthPercent >= 70) {
    return 'text-app-warning'
  }

  return 'text-app-danger'
}

export interface VendorBranchStatusWidgetProps {
  summary: VendorBranchStatusSummary
}

export function VendorBranchStatusWidget({ summary }: VendorBranchStatusWidgetProps) {
  const safeOccupancy = clampPercent(summary.occupancyPercent)
  const safeHealth = clampPercent(summary.healthPercent)

  return (
    <SectionCard
      title="Branch Status"
      description={summary.branchName}
      action={<StatusBadge status={summary.branchStatus} />}
      className="h-full"
    >
      <div className="space-y-5">
        <div className="rounded-xl border border-app-border bg-app-surface-alt/70 p-4">
          <p className="text-sm text-app-muted">{summary.summary}</p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-app-muted">Live Capacity</span>
            <span className="font-semibold text-app-text">
              {summary.activeCapacity}/{summary.totalCapacity}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-app-surface-alt">
            <div
              className="h-full rounded-full bg-app-accent transition-[width] duration-500"
              style={{ width: `${safeOccupancy}%` }}
            />
          </div>
          <p className="text-xs text-app-muted">Occupancy {safeOccupancy}%</p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-app-muted">Operational Health</span>
            <span className={cn('font-semibold', getHealthTone(safeHealth))}>{safeHealth}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-app-surface-alt">
            <div
              className={cn(
                'h-full rounded-full transition-[width] duration-500',
                safeHealth >= 85 && 'bg-app-success',
                safeHealth >= 70 && safeHealth < 85 && 'bg-app-warning',
                safeHealth < 70 && 'bg-app-danger',
              )}
              style={{ width: `${safeHealth}%` }}
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-app-border bg-app-surface-alt/60 p-3">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-app-muted">
              <Building2 className="h-3.5 w-3.5 text-app-accent" />
              Branch Window
            </p>
            <p className="mt-1 text-sm font-semibold text-app-text">{summary.nextPeakWindow}</p>
          </div>
          <div className="rounded-xl border border-app-border bg-app-surface-alt/60 p-3">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-app-muted">
              <Activity className="h-3.5 w-3.5 text-app-accent" />
              Status
            </p>
            <p className="mt-1 text-sm font-semibold text-app-text">
              Stable operations with no critical blockers.
            </p>
          </div>
        </div>
      </div>
    </SectionCard>
  )
}
