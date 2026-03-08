import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface AuthFieldProps {
  id: string
  label: string
  error?: string
  rightLabel?: ReactNode
  children: ReactNode
  className?: string
}

export function AuthField({ id, label, error, rightLabel, children, className }: AuthFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-sm font-semibold text-app-text">
          {label}
        </label>
        {rightLabel}
      </div>
      {children}
      {error ? <p className="text-xs text-app-danger">{error}</p> : null}
    </div>
  )
}

