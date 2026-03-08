import { CalendarDays, Clock3 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/shared/page-header'
import { SectionCard } from '@/components/shared/section-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  VendorBranchStatusWidget,
  VendorKpiCard,
  VendorQuickActionCard,
  VendorRecentBookingsWidget,
} from '@/features/vendor-dashboard/components'
import {
  vendorBranchStatusSummary,
  vendorDashboardKpis,
  vendorQuickActions,
  vendorRecentBookings,
} from '@/features/vendor-dashboard/data/vendor-dashboard-mock-data'
import { ROUTES } from '@/lib/routes'

export function VendorDashboardPage() {
  const navigate = useNavigate()
  const todayLabel = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date())

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendor Dashboard"
        description={
          <span className="inline-flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-app-accent" />
            {todayLabel}
          </span>
        }
        actions={
          <>
            <Badge variant="accent" className="h-9">
              Mock Data Preview
            </Badge>
            <Button
              type="button"
              variant="secondary"
              className="gap-2"
              onClick={() => navigate(ROUTES.VENDOR_BOOKINGS)}
            >
              <Clock3 className="h-4 w-4" />
              View Bookings
            </Button>
          </>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {vendorDashboardKpis.map((metric) => (
          <VendorKpiCard key={metric.id} metric={metric} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <VendorRecentBookingsWidget bookings={vendorRecentBookings} />
        <VendorBranchStatusWidget summary={vendorBranchStatusSummary} />
      </section>

      <SectionCard title="Quick Actions" description="Move directly to high-impact operational workflows.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {vendorQuickActions.map((action) => (
            <VendorQuickActionCard key={action.id} action={action} />
          ))}
        </div>
      </SectionCard>
    </div>
  )
}
