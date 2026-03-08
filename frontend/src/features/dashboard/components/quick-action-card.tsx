import { ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import type { DashboardQuickAction } from '@/features/dashboard/types'

export interface QuickActionCardProps {
  action: DashboardQuickAction
}

export function QuickActionCard({ action }: QuickActionCardProps) {
  return (
    <button type="button" className="w-full text-left">
      <Card className="group flex h-full items-center gap-4 p-5 transition-colors hover:border-app-accent/50">
        <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-app-surface-alt text-app-accent">
          <action.icon className="h-6 w-6" />
        </span>

        <p className="flex-1 text-xl font-semibold text-app-text">{action.label}</p>

        {action.badge ? (
          <Badge variant="accent" className="text-sm">
            {action.badge}
          </Badge>
        ) : null}

        <ArrowRight className="h-5 w-5 text-app-muted transition-transform group-hover:translate-x-1" />
      </Card>
    </button>
  )
}

