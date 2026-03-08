import {
  Bell,
  CheckCheck,
  Clock3,
  Loader2,
  ShieldAlert,
  Store,
  Tags,
  UserRoundPlus,
  Users,
} from 'lucide-react'
import type { ComponentType } from 'react'
import { cn } from '@/lib/cn'
import type { NotificationItem } from '@/features/notifications/types'

const categoryStyles: Record<
  NotificationItem['category'],
  {
    icon: ComponentType<{ className?: string }>
    iconClassName: string
    iconWrapClassName: string
  }
> = {
  approvals: {
    icon: CheckCheck,
    iconClassName: 'text-app-warning',
    iconWrapClassName: 'bg-app-warning/15',
  },
  branches: {
    icon: Store,
    iconClassName: 'text-app-success',
    iconWrapClassName: 'bg-app-success/15',
  },
  vendors: {
    icon: Users,
    iconClassName: 'text-app-info',
    iconWrapClassName: 'bg-app-info/15',
  },
  pricing: {
    icon: Tags,
    iconClassName: 'text-app-accent',
    iconWrapClassName: 'bg-app-accent/15',
  },
  security: {
    icon: ShieldAlert,
    iconClassName: 'text-app-danger',
    iconWrapClassName: 'bg-app-danger/15',
  },
  applications: {
    icon: UserRoundPlus,
    iconClassName: 'text-violet-400',
    iconWrapClassName: 'bg-violet-500/15',
  },
}

function formatAge(minutesAgo: number) {
  if (minutesAgo < 60) {
    return `${minutesAgo} min ago`
  }

  const hours = Math.floor(minutesAgo / 60)
  return `${hours} hr ago`
}

export interface NotificationItemCardProps {
  notification: NotificationItem
  onMarkRead?: (notification: NotificationItem) => void
  isMarkingRead?: boolean
}

export function NotificationItemCard({
  notification,
  onMarkRead,
  isMarkingRead = false,
}: NotificationItemCardProps) {
  const style = categoryStyles[notification.category]
  const Icon = style?.icon ?? Bell

  return (
    <article
      className={cn(
        'rounded-2xl border border-app-border bg-app-surface p-5 transition-colors',
        !notification.read && 'border-app-accent/35',
      )}
    >
      <div className="flex items-start gap-4">
        <span
          className={cn(
            'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
            style?.iconWrapClassName ?? 'bg-app-surface-alt',
          )}
        >
          <Icon className={cn('h-5 w-5', style?.iconClassName ?? 'text-app-muted')} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-heading text-2xl font-semibold text-app-text">{notification.title}</h3>
            {!notification.read ? <span className="h-2 w-2 rounded-full bg-app-accent" /> : null}
          </div>
          <p className="mt-1 text-base text-app-muted">{notification.description}</p>
          <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-app-muted">
            <Clock3 className="h-3.5 w-3.5" />
            {formatAge(notification.minutesAgo)}
          </p>

          {!notification.read ? (
            <button
              type="button"
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-app-border px-2.5 py-1 text-xs font-semibold text-app-muted transition-colors hover:border-app-accent/50 hover:text-app-text"
              onClick={() => onMarkRead?.(notification)}
              disabled={isMarkingRead}
            >
              {isMarkingRead ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Mark as read
            </button>
          ) : null}
        </div>
      </div>
    </article>
  )
}
