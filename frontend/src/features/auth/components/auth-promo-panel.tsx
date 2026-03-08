import { LogoMark } from '@/components/shared/logo-mark'
import { Card } from '@/components/ui/card'

const networkHighlights = [
  { value: '42', label: 'Active Branches' },
  { value: '18', label: 'Total Vendors' },
  { value: '73%', label: 'Network Occupancy' },
]

export function AuthPromoPanel() {
  return (
    <section className="hidden border-r border-app-border bg-gradient-to-b from-app-surface to-app-bg lg:flex lg:min-h-screen">
      <div className="flex w-full flex-col p-10 xl:p-12">
        <LogoMark />
        <div className="mt-20 max-w-lg space-y-5">
          <h1 className="font-heading text-5xl font-semibold leading-tight text-white">
            Command your network
            <br />
            <span className="text-app-accent">with confidence.</span>
          </h1>
          <p className="text-2xl leading-relaxed text-app-muted">
            Your strategic command center for network analytics, branch management, vendor oversight, and
            pricing control.
          </p>
        </div>
        <div className="mt-auto grid gap-4 sm:grid-cols-3">
          {networkHighlights.map((item) => (
            <Card key={item.label} className="border-app-border/80 bg-app-surface-alt/80 p-5">
              <p className="font-heading text-4xl font-semibold text-app-accent">{item.value}</p>
              <p className="mt-1 text-base text-app-muted">{item.label}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

