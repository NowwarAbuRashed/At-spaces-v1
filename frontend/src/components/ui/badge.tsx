import { cva, type VariantProps } from 'class-variance-authority'
import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold tracking-wide',
  {
    variants: {
      variant: {
        neutral: 'border-app-border bg-app-surface-alt text-app-muted',
        accent: 'border-app-accent/30 bg-app-accent/15 text-app-accent',
        success: 'border-app-success/30 bg-app-success/15 text-app-success',
        warning: 'border-app-warning/35 bg-app-warning/12 text-app-warning',
        danger: 'border-app-danger/35 bg-app-danger/12 text-app-danger',
        info: 'border-app-info/35 bg-app-info/12 text-app-info',
        subtle: 'border-transparent bg-app-surface-alt text-app-muted',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  },
)

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
