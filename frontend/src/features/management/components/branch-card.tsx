import { Loader2, MapPin, Pause, Play, UserRound } from 'lucide-react'
import { StatusBadge } from '@/components/shared/status-badge'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/cn'
import type { BranchRecord } from '@/features/management/types'

export interface BranchCardProps {
  branch: BranchRecord
  onToggleStatus?: (branch: BranchRecord) => void
  isStatusUpdating?: boolean
}

export function BranchCard({ branch, onToggleStatus, isStatusUpdating = false }: BranchCardProps) {
  const statusActionLabel = branch.status === 'paused' ? 'Resume' : 'Pause'

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-heading text-3xl font-semibold text-app-text">{branch.name}</h3>
          <p className="mt-2 inline-flex items-center gap-2 text-base text-app-muted">
            <MapPin className="h-4 w-4" />
            {branch.city}
          </p>
          <p className="mt-2 inline-flex items-center gap-2 text-base text-app-muted">
            <UserRound className="h-4 w-4" />
            {branch.manager}
          </p>
        </div>
        <StatusBadge status={branch.status} />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-app-border bg-app-surface-alt/70 p-4 text-center">
          <p className="font-heading text-4xl font-semibold text-app-text">{branch.occupancy}%</p>
          <p className="text-sm text-app-muted">Occupancy</p>
        </div>
        <div className="rounded-xl border border-app-border bg-app-surface-alt/70 p-4 text-center">
          <p className="font-heading text-4xl font-semibold text-app-text">{branch.todayBookings}</p>
          <p className="text-sm text-app-muted">Today</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {branch.services.map((service) => (
          <Badge key={service} variant="subtle" className="bg-app-accent/15 text-app-accent">
            {service}
          </Badge>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-3 border-t border-app-border pt-4">
        <button
          type="button"
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-app-border px-4 py-3 text-sm font-semibold text-app-text transition-colors hover:border-app-accent/50"
        >
          View Details
        </button>
        <button
          type="button"
          className={cn(
            'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold',
            branch.status === 'paused' ? 'text-app-success' : 'text-app-warning',
            isStatusUpdating && 'cursor-not-allowed opacity-70',
          )}
          onClick={() => onToggleStatus?.(branch)}
          disabled={isStatusUpdating}
        >
          {isStatusUpdating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : branch.status === 'paused' ? (
            <Play className="h-4 w-4" />
          ) : (
            <Pause className="h-4 w-4" />
          )}
          {statusActionLabel}
        </button>
      </div>
    </Card>
  )
}
