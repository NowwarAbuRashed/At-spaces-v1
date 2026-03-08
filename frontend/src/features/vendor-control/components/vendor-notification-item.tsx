import { Bell, BellRing, Clock3 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/cn'
import type { VendorNotification } from '@/features/vendor-control/types'

export interface VendorNotificationItemProps {
  notification: VendorNotification
  onMarkRead: (id: string) => void
}

const categoryLabelMap: Record<VendorNotification['category'], string> = {
  operations: 'Operations',
  requests: 'Requests',
  security: 'Security',
  billing: 'Billing',
}

export function VendorNotificationItem({ notification, onMarkRead }: VendorNotificationItemProps) {
  return (
    <Card className={cn(!notification.isRead && 'border-app-accent/45')}>
      <CardContent className="space-y-3 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="inline-flex items-start gap-3">
            <span
              className={cn(
                'inline-flex h-10 w-10 items-center justify-center rounded-xl',
                notification.isRead ? 'bg-app-surface-alt text-app-muted' : 'bg-app-accent/20 text-app-accent',
              )}
            >
              {notification.isRead ? <Bell className="h-5 w-5" /> : <BellRing className="h-5 w-5" />}
            </span>
            <div>
              <p className="font-semibold text-app-text">{notification.title}</p>
              <p className="mt-1 text-sm text-app-muted">{notification.message}</p>
            </div>
          </div>

          <Badge variant={notification.isRead ? 'neutral' : 'accent'}>
            {notification.isRead ? 'Read' : 'Unread'}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-app-muted">
              <Clock3 className="h-3.5 w-3.5" />
              {new Date(notification.createdAt).toLocaleString('en-US')}
            </p>
            <Badge variant="subtle">{categoryLabelMap[notification.category]}</Badge>
          </div>
          {!notification.isRead ? (
            <Button type="button" variant="outline" size="sm" onClick={() => onMarkRead(notification.id)}>
              Mark as read
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
