import { History } from 'lucide-react'
import type { ActivityLogEntry } from '@/features/settings/types'

export interface SettingsActivityItemProps {
  item: ActivityLogEntry
}

export function SettingsActivityItem({ item }: SettingsActivityItemProps) {
  return (
    <div className="rounded-xl border border-app-border bg-app-surface-alt/55 px-4 py-3">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-app-surface text-app-muted">
          <History className="h-4 w-4" />
        </span>
        <div>
          <p className="text-base font-semibold text-app-text">{item.title}</p>
          <p className="text-sm text-app-muted">{item.detail}</p>
          <p className="mt-1 text-xs text-app-muted">{item.timestamp}</p>
        </div>
      </div>
    </div>
  )
}

