import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: ReactNode
  rightAddon?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, leftIcon, rightAddon, ...props }, ref) => (
    <label className="relative block w-full">
      {leftIcon ? (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-app-muted">
          {leftIcon}
        </span>
      ) : null}
      <input
        ref={ref}
        className={cn(
          'h-11 w-full rounded-xl border border-app-border bg-app-surface-alt px-3 text-sm text-app-text outline-none transition-all placeholder:text-app-muted/90 focus:border-app-accent/60 focus:ring-2 focus:ring-app-accent/30',
          leftIcon && 'pl-10',
          rightAddon && 'pr-12',
          className,
        )}
        {...props}
      />
      {rightAddon ? (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-app-muted">{rightAddon}</span>
      ) : null}
    </label>
  ),
)

Input.displayName = 'Input'
