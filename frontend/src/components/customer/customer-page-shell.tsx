import type { PropsWithChildren, ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/cn'

export interface CustomerPageShellProps extends PropsWithChildren {
  eyebrow?: string
  title: string
  description: string
  badges?: string[]
  actions?: ReactNode
  className?: string
}

export function CustomerPageShell({
  eyebrow,
  title,
  description,
  badges = [],
  actions,
  className,
  children,
}: CustomerPageShellProps) {
  return (
    <section className={cn('space-y-6', className)}>
      <header className="relative overflow-hidden rounded-[1.75rem] border border-app-border bg-app-surface/85 p-6 shadow-soft sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-app-accent/20 blur-3xl" />
        <div className="relative">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-app-accent/90">{eyebrow}</p>
          ) : null}
          <h1 className="mt-2 font-heading text-3xl font-semibold text-app-text sm:text-4xl">{title}</h1>
          <p className="mt-3 max-w-3xl text-base text-app-muted sm:text-lg">{description}</p>

          {badges.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {badges.map((badge) => (
                <Badge key={badge} variant="subtle" className="text-[11px] uppercase tracking-[0.08em]">
                  {badge}
                </Badge>
              ))}
            </div>
          ) : null}

          {actions ? <div className="mt-6">{actions}</div> : null}
        </div>
      </header>

      <div className="space-y-6">{children}</div>
    </section>
  )
}
