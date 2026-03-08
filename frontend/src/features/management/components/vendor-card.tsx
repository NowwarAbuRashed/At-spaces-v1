import { Mail } from 'lucide-react'
import { StatusBadge } from '@/components/shared/status-badge'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/cn'
import type { VendorRecord } from '@/features/management/types'

export interface VendorCardProps {
  vendor: VendorRecord
  onViewProfile?: (vendor: VendorRecord) => void
}

function metricColor(value: number, inverse = false) {
  if (!inverse) {
    if (value >= 90) return 'text-app-success'
    if (value >= 75) return 'text-app-warning'
    return 'text-app-danger'
  }

  if (value <= 3) return 'text-app-success'
  if (value <= 8) return 'text-app-warning'
  return 'text-app-danger'
}

export function VendorCard({ vendor, onViewProfile }: VendorCardProps) {
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-app-surface-alt text-xl font-semibold text-app-accent">
            {vendor.name.charAt(0)}
          </span>
          <div className="min-w-0">
            <h3 className="truncate font-heading text-3xl font-semibold text-app-text">{vendor.name}</h3>
            <p className="mt-1 inline-flex max-w-full items-center gap-1.5 truncate text-base text-app-muted">
              <Mail className="h-4 w-4" />
              {vendor.email}
            </p>
          </div>
        </div>
        <StatusBadge status={vendor.status} />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-app-border bg-app-surface-alt/70 p-3 text-center">
          <p className={cn('font-heading text-3xl font-semibold', metricColor(vendor.reliability))}>
            {vendor.reliability}%
          </p>
          <p className="text-sm text-app-muted">Reliability</p>
        </div>
        <div className="rounded-xl border border-app-border bg-app-surface-alt/70 p-3 text-center">
          <p className={cn('font-heading text-3xl font-semibold', metricColor(vendor.checkIn))}>
            {vendor.checkIn}%
          </p>
          <p className="text-sm text-app-muted">Check-In</p>
        </div>
        <div className="rounded-xl border border-app-border bg-app-surface-alt/70 p-3 text-center">
          <p className={cn('font-heading text-3xl font-semibold', metricColor(vendor.noShow, true))}>
            {vendor.noShow}%
          </p>
          <p className="text-sm text-app-muted">No-Show</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-base text-app-muted">
        <p>
          {vendor.branches} {vendor.branches > 1 ? 'branches' : 'branch'}
        </p>
        <p>Joined {vendor.joinedAt}</p>
      </div>

      <button
        type="button"
        className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-app-border px-4 py-3 text-sm font-semibold text-app-text transition-colors hover:border-app-accent/50"
        onClick={() => onViewProfile?.(vendor)}
        aria-label={`View profile for ${vendor.name}`}
      >
        View Profile
      </button>
    </Card>
  )
}
