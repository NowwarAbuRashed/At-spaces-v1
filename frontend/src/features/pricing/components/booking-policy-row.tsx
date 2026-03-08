import { CircleHelp, PencilLine } from 'lucide-react'
import { toast } from 'sonner'
import type { BookingPolicy } from '@/features/pricing/types'

export interface BookingPolicyRowProps {
  policy: BookingPolicy
}

export function BookingPolicyRow({ policy }: BookingPolicyRowProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-app-surface-alt/55 px-4 py-4">
      <div>
        <p className="inline-flex items-center gap-1.5 text-lg font-semibold text-app-text">
          {policy.title}
          <CircleHelp className="h-4 w-4 text-app-muted" />
        </p>
        {policy.description ? <p className="text-sm text-app-muted">{policy.description}</p> : null}
      </div>

      <div className="inline-flex items-center gap-3">
        <p className="text-lg font-semibold text-app-accent">{policy.value}</p>
        <button
          type="button"
          onClick={() => toast.info(`Edit ${policy.title}`)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-app-border text-app-muted transition-colors hover:border-app-accent/50 hover:text-app-accent"
          aria-label={`Edit ${policy.title}`}
        >
          <PencilLine className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

