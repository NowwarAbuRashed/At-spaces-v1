export type NotificationCategory =
  | 'approvals'
  | 'branches'
  | 'vendors'
  | 'pricing'
  | 'security'
  | 'applications'

export interface NotificationItem {
  id: string
  title: string
  description: string
  minutesAgo: number
  category: NotificationCategory
  read: boolean
}

