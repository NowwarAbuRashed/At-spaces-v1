import { apiRequest } from '@/api/client'
import type { NotificationApiItem, PagedResponse } from '@/types/api'

export async function listNotifications(options: {
  accessToken: string
  page?: number
  limit?: number
}) {
  return apiRequest<PagedResponse<NotificationApiItem>>('/notifications', {
    accessToken: options.accessToken,
    query: {
      page: options.page ?? 1,
      limit: options.limit ?? 100,
    },
  })
}

export async function markNotificationRead(options: { accessToken: string; id: number }) {
  return apiRequest<{ message: string }>(`/notifications/${options.id}/read`, {
    method: 'PATCH',
    accessToken: options.accessToken,
  })
}

