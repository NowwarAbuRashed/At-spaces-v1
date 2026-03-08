import { CircleHelp, Headset, ShieldCheck } from 'lucide-react'
import type { PropsWithChildren, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import { CUSTOMER_ROUTES } from '@/lib/routes'

export interface CustomerAuthShellProps extends PropsWithChildren {
  title: string
  description: string
  formTitle: string
  formDescription: string
  badges?: string[]
  formFooter: ReactNode
}

const supportItems = [
  {
    icon: ShieldCheck,
    title: 'Secure customer access',
    body: 'Sign-in uses secure backend authentication and session refresh cookies.',
  },
  {
    icon: Headset,
    title: 'Need help?',
    body: 'Contact support@atspaces.com for account access issues.',
  },
]

export function CustomerAuthShell({
  title,
  description,
  formTitle,
  formDescription,
  badges = [],
  formFooter,
  children,
}: CustomerAuthShellProps) {
  return (
    <section className="space-y-6">
      <header className="rounded-[1.75rem] border border-app-border bg-app-surface/85 p-6 shadow-soft sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-app-accent">Customer Access</p>
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
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>{formTitle}</CardTitle>
            <CardDescription>{formDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {children}
            <div className="border-t border-app-border pt-4">{formFooter}</div>
          </CardContent>
        </Card>

        <Card className="h-full border-app-border/80 bg-gradient-to-br from-app-surface to-app-bg">
          <CardHeader>
            <CardTitle>Customer Support</CardTitle>
            <CardDescription>Simple and friendly help while signing in.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {supportItems.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-app-border bg-app-surface-alt/70 p-3"
              >
                <p className="inline-flex items-center gap-2 text-sm font-semibold text-app-text">
                  <item.icon className="h-4 w-4 text-app-accent" />
                  {item.title}
                </p>
                <p className="mt-1 text-xs text-app-muted">{item.body}</p>
              </div>
            ))}

            <div className="rounded-xl border border-app-accent/30 bg-app-accent/10 p-3">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-app-text">
                <CircleHelp className="h-4 w-4 text-app-accent" />
                Looking for a branch first?
              </p>
              <p className="mt-1 text-xs text-app-muted">
                You can continue browsing branches before signing in.
              </p>
              <Link to={CUSTOMER_ROUTES.BRANCHES} className="mt-3 inline-flex">
                <Button type="button" size="sm" variant="outline">
                  Browse branches
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
