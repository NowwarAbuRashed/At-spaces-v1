import type { LucideIcon } from 'lucide-react'
import { Inbox } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface EmptyStateProps {
  title: string
  description: string
  action?: ReactNode
  icon?: LucideIcon
  className?: string
}

export function EmptyState({
  title,
  description,
  action,
  icon: Icon = Inbox,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-app-border bg-app-surface-alt/50 px-6 py-12 text-center',
        className,
      )}
    >
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-app-surface text-app-muted">
        <Icon className="h-6 w-6" />
      </span>
      <h3 className="mt-4 font-heading text-xl font-semibold text-app-text">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-app-muted">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}

