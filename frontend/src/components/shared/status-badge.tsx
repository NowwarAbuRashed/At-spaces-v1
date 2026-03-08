import type { ComponentProps } from 'react'
import { Badge } from '@/components/ui/badge'
import type { StatusBadgeVariant } from '@/types/ui'

const statusVariantMap: Record<
  StatusBadgeVariant,
  NonNullable<ComponentProps<typeof Badge>['variant']>
> = {
  active: 'success',
  paused: 'danger',
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  underReview: 'info',
  suspended: 'danger',
  info: 'neutral',
}

export interface StatusBadgeProps {
  status: StatusBadgeVariant
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const label = status
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (value) => value.toUpperCase())

  return (
    <Badge variant={statusVariantMap[status]} className={className}>
      {label}
    </Badge>
  )
}
