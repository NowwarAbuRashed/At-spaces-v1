import { Grid2x2 } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface LogoMarkProps {
  compact?: boolean
  subtitle?: string
  className?: string
}

export function LogoMark({ compact = false, subtitle = 'Admin', className }: LogoMarkProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-app-accent text-white shadow-glow">
        <Grid2x2 className="h-5 w-5" />
      </span>
      {!compact ? (
        <span className="flex flex-col leading-none">
          <span className="font-heading text-2xl font-semibold text-app-text">AtSpaces</span>
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-app-muted">
            {subtitle}
          </span>
        </span>
      ) : null}
    </div>
  )
}
