import { useMemo, useState } from 'react'
import { EmptyState } from '@/components/shared/empty-state'
import { PageHeader } from '@/components/shared/page-header'
import { SectionCard } from '@/components/shared/section-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  VendorNotificationFilterBar,
  VendorNotificationItem,
} from '@/features/vendor-control/components'
import { vendorNotificationsMock } from '@/features/vendor-control/data/vendor-control-mock-data'
import type {
  VendorNotification,
  VendorNotificationFilterTab,
  VendorNotificationFilterValue,
} from '@/features/vendor-control/types'

export function VendorNotificationsPage() {
  const [notifications, setNotifications] = useState<VendorNotification[]>(vendorNotificationsMock)
  const [filter, setFilter] = useState<VendorNotificationFilterValue>('all')

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications],
  )

  const filterTabs = useMemo<VendorNotificationFilterTab[]>(
    () => [
      { label: 'All', value: 'all', count: notifications.length },
      { label: 'Unread', value: 'unread', count: unreadCount },
      {
        label: 'Operations',
        value: 'operations',
        count: notifications.filter((notification) => notification.category === 'operations').length,
      },
      {
        label: 'Requests',
        value: 'requests',
        count: notifications.filter((notification) => notification.category === 'requests').length,
      },
      {
        label: 'Security',
        value: 'security',
        count: notifications.filter((notification) => notification.category === 'security').length,
      },
      {
        label: 'Billing',
        value: 'billing',
        count: notifications.filter((notification) => notification.category === 'billing').length,
      },
    ],
    [notifications, unreadCount],
  )

  const filteredNotifications = useMemo(() => {
    if (filter === 'all') {
      return notifications
    }

    if (filter === 'unread') {
      return notifications.filter((notification) => !notification.isRead)
    }

    return notifications.filter((notification) => notification.category === filter)
  }, [filter, notifications])

  const handleMarkRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id
          ? {
              ...notification,
              isRead: true,
            }
          : notification,
      ),
    )
  }

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })))
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Track operational alerts, request updates, and account messages from one vendor inbox."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="accent">{unreadCount} unread</Badge>
            <Button
              type="button"
              variant="outline"
              onClick={handleMarkAllRead}
              disabled={!unreadCount}
            >
              Mark all as read
            </Button>
          </div>
        }
      />

      <SectionCard
        title="Notification Center"
        description="Filter by unread state or category. Mark one or all notifications as read using local state."
      >
        <div className="space-y-4">
          <VendorNotificationFilterBar
            filterTabs={filterTabs}
            value={filter}
            onChange={setFilter}
          />

          {filteredNotifications.length ? (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => (
                <VendorNotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkRead={handleMarkRead}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No notifications for this filter"
              description="Try another filter tab to view additional messages."
            />
          )}
        </div>
      </SectionCard>
    </div>
  )
}
