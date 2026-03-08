import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import type { VendorQuickAction } from '@/features/vendor-dashboard/types'

export interface VendorQuickActionCardProps {
  action: VendorQuickAction
}

export function VendorQuickActionCard({ action }: VendorQuickActionCardProps) {
  return (
    <Link to={action.path} className="block h-full">
      <Card className="group flex h-full flex-col gap-3 p-5 transition-colors hover:border-app-accent/50">
        <div className="flex items-start justify-between gap-3">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-app-surface-alt text-app-accent">
            <action.icon className="h-5 w-5" />
          </span>
          {action.badge ? <Badge variant="accent">{action.badge}</Badge> : null}
        </div>

        <div className="flex-1">
          <p className="font-heading text-xl font-semibold text-app-text">{action.label}</p>
          <p className="mt-1 text-sm text-app-muted">{action.description}</p>
        </div>

        <p className="inline-flex items-center gap-1 text-sm font-semibold text-app-accent">
          Open
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </p>
      </Card>
    </Link>
  )
}
