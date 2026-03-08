import { Check, Clock3, Loader2, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { StatusBadge } from '@/components/shared/status-badge'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import type { ApprovalRequest } from '@/features/management/types'

const priorityVariant: Record<ApprovalRequest['priority'], 'danger' | 'warning' | 'success'> = {
  high: 'danger',
  medium: 'warning',
  low: 'success',
}

export interface ApprovalRequestCardProps {
  request: ApprovalRequest
  onApprove?: (request: ApprovalRequest) => void
  onReject?: (request: ApprovalRequest) => void
  isApproving?: boolean
  isRejecting?: boolean
  detailsHref?: string
}

export function ApprovalRequestCard({
  request,
  onApprove,
  onReject,
  isApproving = false,
  isRejecting = false,
  detailsHref,
}: ApprovalRequestCardProps) {
  const isPending = request.status === 'pending'
  const isBusy = isApproving || isRejecting

  return (
    <Card className="flex flex-wrap items-center justify-between gap-5 p-5">
      <div className="flex min-w-0 flex-1 gap-4">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-app-surface-alt text-app-warning">
          <Clock3 className="h-5 w-5" />
        </span>

        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="text-sm text-app-muted">{request.id}</span>
            <StatusBadge status={request.status} />
            <Badge variant={priorityVariant[request.priority]}>{request.priority}</Badge>
          </div>
          <h3 className="truncate font-heading text-2xl font-semibold text-app-text">{request.title}</h3>
          <p className="mt-1 text-base text-app-muted">
            {request.requester} · {request.branch} · {request.date}
          </p>
        </div>
      </div>

      {isPending ? (
        <div className="flex flex-wrap items-center gap-2">
          {detailsHref ? (
            <Link
              to={detailsHref}
              className="inline-flex items-center gap-2 rounded-xl border border-app-border px-4 py-2.5 text-sm font-semibold text-app-text hover:border-app-accent/50"
            >
              Details
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => {
              if (onApprove) {
                onApprove(request)
                return
              }

              toast.success(`Approved ${request.id}`)
            }}
            disabled={isBusy}
            className="inline-flex items-center gap-2 rounded-xl bg-app-success px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(34,197,94,0.28)] hover:brightness-110"
          >
            {isApproving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Approve
          </button>
          <button
            type="button"
            onClick={() => {
              if (onReject) {
                onReject(request)
                return
              }

              toast.error(`Rejected ${request.id}`)
            }}
            disabled={isBusy}
            className="inline-flex items-center gap-2 rounded-xl border border-app-danger/50 px-4 py-2.5 text-sm font-semibold text-app-danger hover:bg-app-danger/10"
          >
            {isRejecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
            Reject
          </button>
        </div>
      ) : detailsHref ? (
        <Link
          to={detailsHref}
          className="inline-flex items-center gap-2 rounded-xl border border-app-border px-4 py-2.5 text-sm font-semibold text-app-text hover:border-app-accent/50"
        >
          Details
        </Link>
      ) : null}
    </Card>
  )
}
