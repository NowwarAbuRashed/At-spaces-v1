import { Wallet } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { CustomerPaymentMethodOption } from '@/types/customer'

export interface CustomerPaymentMethodSelectorProps {
  options: CustomerPaymentMethodOption[]
  selectedMethodId: string
  onChange: (methodId: string) => void
}

export function CustomerPaymentMethodSelector({
  options,
  selectedMethodId,
  onChange,
}: CustomerPaymentMethodSelectorProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-app-text">Payment Method</p>
      <div className="grid gap-2">
        {options.map((option) => {
          const isActive = option.id === selectedMethodId
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              className={cn(
                'flex w-full flex-col items-start gap-1 rounded-xl border p-3 text-left transition-colors',
                isActive
                  ? 'border-app-accent/50 bg-app-accent/12'
                  : 'border-app-border bg-app-surface-alt/70 hover:border-app-accent/30',
              )}
              aria-pressed={isActive}
            >
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-app-text">
                <Wallet className="h-4 w-4 text-app-accent" />
                {option.label}
              </span>
              <span className="text-xs text-app-muted">{option.description}</span>
              <span className="text-xs font-semibold text-app-accent">{option.feeLabel}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
