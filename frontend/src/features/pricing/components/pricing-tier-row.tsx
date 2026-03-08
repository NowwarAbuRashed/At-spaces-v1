import { PencilLine } from 'lucide-react'
import { toast } from 'sonner'
import type { PricingTier } from '@/features/pricing/types'

export interface PricingTierRowProps {
  tier: PricingTier
}

export function PricingTierRow({ tier }: PricingTierRowProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-app-surface-alt/55 px-4 py-4">
      <div>
        <p className="text-lg font-semibold text-app-text">{tier.name}</p>
        <p className="text-sm text-app-muted">{tier.bookingsShare}</p>
      </div>

      <div className="inline-flex items-center gap-3">
        <p className="font-heading text-3xl font-semibold text-app-text">{tier.price}</p>
        <button
          type="button"
          onClick={() => toast.info(`Edit ${tier.name} pricing`)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-app-border text-app-muted transition-colors hover:border-app-accent/50 hover:text-app-accent"
          aria-label={`Edit ${tier.name} price`}
        >
          <PencilLine className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

