import { Dot } from 'lucide-react'
import type { RecentActivityItem } from '@/features/dashboard/types'

export interface RecentActivityRowProps {
  item: RecentActivityItem
}

export function RecentActivityRow({ item }: RecentActivityRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl px-1 py-2">
      <div className="flex min-w-0 gap-2">
        <Dot className="mt-0.5 h-6 w-6 shrink-0 text-app-accent" />
        <div className="min-w-0">
          <p className="truncate text-2xl font-semibold text-app-text">{item.event}</p>
          <p className="truncate text-base text-app-muted">{item.detail}</p>
        </div>
      </div>
      <p className="shrink-0 text-base text-app-muted">{item.when}</p>
    </div>
  )
}

