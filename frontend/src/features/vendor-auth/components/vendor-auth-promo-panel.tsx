import { LogoMark } from '@/components/shared/logo-mark'
import { Card } from '@/components/ui/card'

const vendorHighlights = [
  { value: '1.2K', label: 'Monthly Bookings' },
  { value: '96%', label: 'On-time Operations' },
  { value: '24/7', label: 'Vendor Support' },
]

export function VendorAuthPromoPanel() {
  return (
    <section className="hidden border-r border-app-border bg-gradient-to-b from-app-surface to-app-bg lg:flex lg:min-h-screen">
      <div className="flex w-full flex-col p-10 xl:p-12">
        <LogoMark subtitle="Vendor" />
        <div className="mt-20 max-w-lg space-y-5">
          <h1 className="font-heading text-5xl font-semibold leading-tight text-white">
            Operate every branch
            <br />
            <span className="text-app-accent">with precision.</span>
          </h1>
          <p className="text-2xl leading-relaxed text-app-muted">
            Access your vendor workspace to manage schedules, bookings, and service delivery in one
            premium control hub.
          </p>
        </div>
        <div className="mt-auto grid gap-4 sm:grid-cols-3">
          {vendorHighlights.map((item) => (
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
