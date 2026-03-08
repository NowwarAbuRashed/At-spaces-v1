import type { NotificationApiItem } from '@/types/api'
import { clamp } from '@/lib/format'
import type { NotificationCategory, NotificationItem } from '@/features/notifications/types'

function mapCategory(type: string): NotificationCategory {
  const normalized = type.toLowerCase()

  if (normalized.includes('approval')) return 'approvals'
  if (normalized.includes('branch')) return 'branches'
  if (normalized.includes('vendor')) return 'vendors'
  if (normalized.includes('pricing') || normalized.includes('price')) return 'pricing'
  if (normalized.includes('security') || normalized.includes('login') || normalized.includes('auth')) {
    return 'security'
  }
  if (normalized.includes('application') || normalized.includes('registration')) return 'applications'

  return 'approvals'
}

export interface NotificationViewItem extends NotificationItem {
  apiId?: number
}

export function mapNotificationApiItem(item: NotificationApiItem): NotificationViewItem {
  const ageMinutes = Math.max(
    1,
    Math.round((Date.now() - new Date(item.createdAt).getTime()) / (1000 * 60)),
  )

  return {
    id: `NTF-${item.id.toString().padStart(3, '0')}`,
    apiId: item.id,
    title: item.title,
    description: item.body,
    minutesAgo: clamp(ageMinutes, 1, 60 * 24 * 14),
    category: mapCategory(item.type),
    read: item.isRead,
  }
}
