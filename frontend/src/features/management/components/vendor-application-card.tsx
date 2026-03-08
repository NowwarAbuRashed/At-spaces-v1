import { Eye } from 'lucide-react'
import { StatusBadge } from '@/components/shared/status-badge'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import type { VendorApplication } from '@/features/management/types'

export interface VendorApplicationCardProps {
  application: VendorApplication
}

export function VendorApplicationCard({ application }: VendorApplicationCardProps) {
  return (
    <Card className="flex flex-wrap items-center justify-between gap-5 p-5">
      <div className="flex min-w-0 flex-1 gap-4">
        <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-app-surface-alt text-xl font-semibold text-app-accent">
          {application.workspaceName.charAt(0)}
        </span>

        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="text-sm text-app-muted">{application.id}</span>
            <StatusBadge status={application.status} />
            {application.isNew ? <Badge variant="info">New</Badge> : null}
          </div>
          <h3 className="truncate font-heading text-2xl font-semibold text-app-text">
            {application.workspaceName}
          </h3>
          <p className="mt-1 text-base text-app-muted">
            {application.ownerName} · {application.city} · {application.date}
          </p>
        </div>
      </div>

      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-xl border border-app-border px-4 py-2.5 text-sm font-semibold text-app-text transition-colors hover:border-app-accent/50"
      >
        <Eye className="h-4 w-4" />
        Review
      </button>
    </Card>
  )
}

