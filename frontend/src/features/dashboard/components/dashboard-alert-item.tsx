import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { DashboardAlert } from '@/features/dashboard/types'

const toneClasses: Record<DashboardAlert['tone'], string> = {
  default: 'border-app-border bg-app-surface-alt/50',
  warning: 'border-app-warning/35 bg-app-warning/10',
  danger: 'border-app-danger/35 bg-app-danger/10',
}

export interface DashboardAlertItemProps {
  alert: DashboardAlert
}

export function DashboardAlertItem({ alert }: DashboardAlertItemProps) {
  return (
    <button
      type="button"
      className={cn(
        'flex w-full items-center justify-between gap-4 rounded-xl border px-4 py-4 text-left transition-colors hover:border-app-accent/50',
        toneClasses[alert.tone],
      )}
    >
      <span className="text-lg font-semibold text-app-text">{alert.label}</span>
      <ArrowRight className="h-5 w-5 shrink-0 text-app-muted" />
    </button>
  )
}

