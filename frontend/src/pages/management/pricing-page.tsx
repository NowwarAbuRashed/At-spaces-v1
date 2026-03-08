import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/shared/page-header'
import { SectionCard } from '@/components/shared/section-card'
import { Badge, Tabs } from '@/components/ui'
import { BookingPolicyRow, PricingTierRow } from '@/features/pricing/components'
import { bookingPolicies, pricingPlans } from '@/features/pricing/data/pricing-mock-data'
import type { PricingPlanKey } from '@/features/pricing/types'

export function PricingPage() {
  const [activePlan, setActivePlan] = useState<PricingPlanKey>('hotDesk')

  const selectedPlan = useMemo(
    () => pricingPlans.find((plan) => plan.key === activePlan) ?? pricingPlans[0],
    [activePlan],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pricing & Policies"
        description="Centralized pricing control across the network."
        actions={<Badge variant="warning">Backend Update API Unavailable</Badge>}
      />

      <SectionCard title="Availability Notice">
        <p className="text-sm text-app-muted">
          Pricing read/update endpoints are not currently exposed by the backend API contract.
          This screen is read-only and does not persist changes.
        </p>
      </SectionCard>

      <Tabs
        value={activePlan}
        onChange={setActivePlan}
        items={pricingPlans.map((plan) => ({
          label: plan.label,
          value: plan.key,
        }))}
      />

      <SectionCard title={selectedPlan.title}>
        <div className="space-y-3">
          {selectedPlan.tiers.map((tier) => (
            <PricingTierRow key={tier.id} tier={tier} />
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Booking Policies">
        <div className="space-y-3">
          {bookingPolicies.map((policy) => (
            <BookingPolicyRow key={policy.id} policy={policy} />
          ))}
        </div>
      </SectionCard>
    </div>
  )
}
