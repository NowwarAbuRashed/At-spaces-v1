import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface CustomerAuthFieldProps {
  id: string
  label: string
  error?: string
  hint?: string
  rightLabel?: ReactNode
  children: ReactNode
  className?: string
}

export function CustomerAuthField({
  id,
  label,
  error,
  hint,
  rightLabel,
  children,
  className,
}: CustomerAuthFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-semibold text-app-text">
          {label}
        </label>
        {rightLabel}
      </div>
      {children}
      {error ? <p className="text-xs text-app-danger">{error}</p> : null}
      {!error && hint ? <p className="text-xs text-app-muted">{hint}</p> : null}
    </div>
  )
}
