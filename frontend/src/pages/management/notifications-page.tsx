import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCheck, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { listNotifications, markNotificationRead } from '@/api/notifications-api'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingState } from '@/components/shared/loading-state'
import { PageHeader } from '@/components/shared/page-header'
import { Button, Switch, Tabs } from '@/components/ui'
import { useAuth } from '@/features/auth/store/auth-context'
import { NotificationItemCard } from '@/features/notifications/components'
import {
  notificationCategories,
  notificationsMockData,
} from '@/features/notifications/data/notifications-mock-data'
import {
  mapNotificationApiItem,
  type NotificationViewItem,
} from '@/features/notifications/lib/notification-mappers'
import { getInlineApiErrorMessage } from '@/lib/api-error'
import type { NotificationCategory, NotificationItem } from '@/features/notifications/types'

type NotificationsTab = 'all' | NotificationCategory

export function NotificationsPage() {
  const { accessToken } = useAuth()
  const queryClient = useQueryClient()
  const [activeCategory, setActiveCategory] = useState<NotificationsTab>('all')
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [mockNotifications, setMockNotifications] = useState<NotificationItem[]>(notificationsMockData)
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState<string[]>([])
  const [locallyReadApiIds, setLocallyReadApiIds] = useState<number[]>([])
  const [markingApiIds, setMarkingApiIds] = useState<number[]>([])

  const notificationsQuery = useQuery({
    queryKey: ['notifications', accessToken],
    queryFn: () => listNotifications({ accessToken: accessToken!, limit: 100 }),
    enabled: Boolean(accessToken),
  })

  const markReadMutation = useMutation({
    mutationFn: (id: number) => markNotificationRead({ accessToken: accessToken!, id }),
  })

  const notifications = useMemo<NotificationViewItem[]>(() => {
    if (!accessToken) {
      return mockNotifications
    }

    return (notificationsQuery.data?.items ?? []).map(mapNotificationApiItem)
  }, [accessToken, mockNotifications, notificationsQuery.data?.items])

  const hydratedNotifications = useMemo(() => {
    return notifications
      .filter((notification) => !dismissedNotificationIds.includes(notification.id))
      .map((notification) => ({
        ...notification,
        read:
          notification.read ||
          (typeof notification.apiId === 'number' && locallyReadApiIds.includes(notification.apiId)),
      }))
  }, [dismissedNotificationIds, locallyReadApiIds, notifications])

  const unreadCount = useMemo(
    () => hydratedNotifications.filter((notification) => !notification.read).length,
    [hydratedNotifications],
  )

  const categoryCountMap = useMemo(() => {
    return notificationCategories.reduce<Record<NotificationsTab, number>>(
      (accumulator, category) => {
        if (category.key === 'all') {
          accumulator.all = hydratedNotifications.length
        } else {
          accumulator[category.key] = hydratedNotifications.filter(
            (notification) => notification.category === category.key,
          ).length
        }

        return accumulator
      },
      {
        all: hydratedNotifications.length,
        approvals: 0,
        branches: 0,
        vendors: 0,
        pricing: 0,
        security: 0,
        applications: 0,
      },
    )
  }, [hydratedNotifications])

  const filteredNotifications = useMemo(() => {
    return hydratedNotifications.filter((notification) => {
      const matchesCategory =
        activeCategory === 'all' || notification.category === activeCategory
      const matchesReadState = !unreadOnly || !notification.read
      return matchesCategory && matchesReadState
    })
  }, [activeCategory, hydratedNotifications, unreadOnly])

  const handleMarkRead = async (notification: NotificationViewItem) => {
    if (notification.read) {
      return
    }

    if (!accessToken || typeof notification.apiId !== 'number') {
      setMockNotifications((current) =>
        current.map((item) => (item.id === notification.id ? { ...item, read: true } : item)),
      )
      toast.success('Notification marked as read.')
      return
    }

    const apiId = notification.apiId
    setMarkingApiIds((current) => [...current, apiId])
    try {
      await markReadMutation.mutateAsync(apiId)
      setLocallyReadApiIds((current) => [...new Set([...current, apiId])])
      toast.success('Notification marked as read.')
      void queryClient.invalidateQueries({ queryKey: ['notifications', accessToken] })
    } catch {
      toast.error('Failed to mark notification as read.')
    } finally {
      setMarkingApiIds((current) => current.filter((id) => id !== apiId))
    }
  }

  const handleMarkAllRead = async () => {
    if (!unreadCount) {
      toast.info('All notifications are already marked as read.')
      return
    }

    if (!accessToken) {
      setMockNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          read: true,
        })),
      )
      toast.success('All notifications marked as read.')
      return
    }

    const unreadApiIds = hydratedNotifications
      .filter((notification) => !notification.read)
      .map((notification) => notification.apiId)
      .filter((id) => typeof id === 'number')

    if (!unreadApiIds.length) {
      toast.info('No unread notifications were returned by the API.')
      return
    }

    setMarkingApiIds((current) => [...new Set([...current, ...unreadApiIds])])
    try {
      await Promise.all(unreadApiIds.map((id) => markReadMutation.mutateAsync(id)))
      setLocallyReadApiIds((current) => [...new Set([...current, ...unreadApiIds])])
      toast.success('All notifications marked as read.')
      void queryClient.invalidateQueries({ queryKey: ['notifications', accessToken] })
    } catch {
      toast.error('Failed to mark all notifications as read.')
    } finally {
      setMarkingApiIds((current) => current.filter((id) => !unreadApiIds.includes(id)))
    }
  }

  const handleClearRead = () => {
    const readIds = hydratedNotifications
      .filter((notification) => notification.read)
      .map((notification) => notification.id)

    const readCount = readIds.length
    if (!readCount) {
      toast.info('No read notifications to clear.')
      return
    }

    if (!accessToken) {
      setMockNotifications((current) => current.filter((notification) => !notification.read))
      toast.success(`Cleared ${readCount} read notifications.`)
      return
    }

    setDismissedNotificationIds((current) => [...new Set([...current, ...readIds])])
    toast.success(`Cleared ${readCount} read notifications.`)
  }

  if (accessToken && notificationsQuery.isPending) {
    return <LoadingState label="Loading notifications..." />
  }

  if (accessToken && notificationsQuery.isError) {
    return (
      <EmptyState
        title="Unable to load notifications"
        description={getInlineApiErrorMessage(notificationsQuery.error, 'Refresh and try again.')}
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
        description={
          <span>
            <span className="font-semibold text-app-accent">{unreadCount} unread</span> notifications
          </span>
        }
        actions={
          <>
            <Button variant="outline" className="gap-2" onClick={handleMarkAllRead}>
              <CheckCheck className="h-4 w-4" />
              Mark All Read
            </Button>
            <Button variant="ghost" className="gap-2" onClick={handleClearRead}>
              <Trash2 className="h-4 w-4" />
              Clear Read
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          value={activeCategory}
          onChange={setActiveCategory}
          className="max-w-full overflow-x-auto"
          items={notificationCategories.map((category) => ({
            label: category.label,
            value: category.key,
            count: categoryCountMap[category.key],
          }))}
        />

        <div className="inline-flex items-center gap-2 rounded-xl border border-app-border bg-app-surface-alt/70 px-3 py-2">
          <span className="text-sm font-semibold text-app-muted">Unread only</span>
          <Switch checked={unreadOnly} onCheckedChange={setUnreadOnly} label="Unread only" />
        </div>
      </div>

      {filteredNotifications.length ? (
        <section className="space-y-3">
          {filteredNotifications.map((notification) => (
            <NotificationItemCard
              key={notification.id}
              notification={notification}
              onMarkRead={handleMarkRead}
              isMarkingRead={
                typeof notification.apiId === 'number' && markingApiIds.includes(notification.apiId)
              }
            />
          ))}
        </section>
      ) : (
        <EmptyState
          title="No notifications to display"
          description="Adjust your filters or wait for new updates."
        />
      )}
    </div>
  )
}
