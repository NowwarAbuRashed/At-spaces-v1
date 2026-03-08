export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'

export type ButtonSize = 'sm' | 'md' | 'lg'

export type StatusBadgeVariant =
  | 'active'
  | 'paused'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'underReview'
  | 'suspended'
  | 'info'

export interface TabItem<T extends string> {
  label: string
  value: T
  count?: number
}

