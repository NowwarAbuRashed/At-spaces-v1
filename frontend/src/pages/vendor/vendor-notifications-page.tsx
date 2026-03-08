import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingState } from '@/components/shared/loading-state'
import { PageHeader } from '@/components/shared/page-header'
import { SectionCard } from '@/components/shared/section-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useVendorAuth } from '@/features/auth/store/vendor-auth-context'
import {
  VendorNotificationFilterBar,
  VendorNotificationItem,
} from '@/features/vendor-control/components'
import type {
  VendorNotificationFilterTab,
  VendorNotificationFilterValue,
} from '@/features/vendor-control/types'
import {
  useMarkVendorNotificationReadMutation,
  useVendorNotificationsQuery,
  vendorQueryKeys,
} from '@/features/vendor/hooks/use-vendor-queries'
import { mapNotificationToVendorView } from '@/features/vendor/lib/vendor-mappers'
import { getInlineApiErrorMessage } from '@/lib/api-error'

export function VendorNotificationsPage() {
  const { accessToken } = useVendorAuth()
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<VendorNotificationFilterValue>('all')
  const [markingIds, setMarkingIds] = useState<number[]>([])
  const notificationsQuery = useVendorNotificationsQuery(accessToken)
  const markReadMutation = useMarkVendorNotificationReadMutation(accessToken)

  const notifications = useMemo(
    () => (notificationsQuery.data?.items ?? []).map(mapNotificationToVendorView),
    [notificationsQuery.data?.items],
  )

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

  const handleMarkRead = async (id: string) => {
    const parsedId = Number(id)
    if (Number.isNaN(parsedId)) {
      return
    }

    setMarkingIds((current) => [...new Set([...current, parsedId])])
    try {
      await markReadMutation.mutateAsync(parsedId)
      toast.success('Notification marked as read.')

      if (accessToken) {
        void queryClient.invalidateQueries({
          queryKey: vendorQueryKeys.notifications(accessToken),
        })
      }
    } catch (error) {
      toast.error(getInlineApiErrorMessage(error, 'Failed to mark notification as read.', {
        sessionLabel: 'vendor',
      }))
    } finally {
      setMarkingIds((current) => current.filter((value) => value !== parsedId))
    }
  }

  const handleMarkAllRead = async () => {
    const unreadIds = notifications
      .filter((notification) => !notification.isRead)
      .map((notification) => Number(notification.id))
      .filter((value) => !Number.isNaN(value))

    if (!unreadIds.length) {
      toast.info('All notifications are already read.')
      return
    }

    setMarkingIds((current) => [...new Set([...current, ...unreadIds])])
    try {
      await Promise.all(unreadIds.map((id) => markReadMutation.mutateAsync(id)))
      toast.success('All notifications marked as read.')
      if (accessToken) {
        void queryClient.invalidateQueries({
          queryKey: vendorQueryKeys.notifications(accessToken),
        })
      }
    } catch (error) {
      toast.error(getInlineApiErrorMessage(error, 'Failed to mark all notifications as read.', {
        sessionLabel: 'vendor',
      }))
    } finally {
      setMarkingIds((current) => current.filter((value) => !unreadIds.includes(value)))
    }
  }

  if (notificationsQuery.isPending) {
    return <LoadingState label="Loading notifications..." />
  }

  if (notificationsQuery.isError) {
    return (
      <EmptyState
        title="Unable to load notifications"
        description={getInlineApiErrorMessage(notificationsQuery.error, 'Please retry in a moment.', {
          sessionLabel: 'vendor',
        })}
        action={
          <Button variant="outline" onClick={() => void notificationsQuery.refetch()}>
            Retry
          </Button>
        }
      />
    )
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
              onClick={() => {
                void handleMarkAllRead()
              }}
              disabled={!unreadCount || markReadMutation.isPending}
            >
              Mark all as read
            </Button>
          </div>
        }
      />

      <SectionCard
        title="Notification Center"
        description="Filter by unread state or category. Mark one or all notifications as read."
      >
        <div className="space-y-4">
          <VendorNotificationFilterBar filterTabs={filterTabs} value={filter} onChange={setFilter} />

          {filteredNotifications.length ? (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => (
                <VendorNotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkRead={(id) => {
                    void handleMarkRead(id)
                  }}
                  isMarkingRead={markingIds.includes(Number(notification.id))}
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
