import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { LogoMark } from '@/components/shared/logo-mark'
import { cn } from '@/lib/cn'
import { VendorAuthPromoPanel } from '@/features/vendor-auth/components/vendor-auth-promo-panel'

export interface VendorAuthShellProps {
  title: string
  description: string
  badgeLabel: string
  children: ReactNode
  className?: string
}

export function VendorAuthShell({
  title,
  description,
  badgeLabel,
  children,
  className,
}: VendorAuthShellProps) {
  return (
    <div className="min-h-screen bg-app-bg">
      <div className="grid min-h-screen lg:grid-cols-[1.08fr_1fr]">
        <VendorAuthPromoPanel />

        <section className="flex items-center justify-center p-6 sm:p-10 lg:p-14">
          <div className={cn('w-full max-w-lg', className)}>
            <div className="mb-8">
              <div className="mb-5 flex items-center justify-between gap-4 lg:hidden">
                <LogoMark subtitle="Vendor" />
                <Badge variant="accent">{badgeLabel}</Badge>
              </div>
              <div className="mb-4 hidden lg:block">
                <Badge variant="accent">{badgeLabel}</Badge>
              </div>
              <h2 className="font-heading text-4xl font-semibold text-app-text">{title}</h2>
              <p className="mt-3 text-lg leading-relaxed text-app-muted">{description}</p>
            </div>
            {children}
          </div>
        </section>
      </div>
    </div>
  )
}
