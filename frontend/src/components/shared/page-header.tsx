import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface PageHeaderProps {
  title: string
  description?: ReactNode
  actions?: ReactNode
  className?: string
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <header className={cn('mb-6 flex flex-wrap items-start justify-between gap-4', className)}>
      <div className="min-w-0">
        <h1 className="font-heading text-3xl font-semibold text-app-text sm:text-4xl">{title}</h1>
        {description ? <p className="mt-2 text-base text-app-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto sm:justify-end">{actions}</div> : null}
    </header>
  )
}
