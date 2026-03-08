import { CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import type { CustomerBranchFacility } from '@/types/customer'

export interface CustomerFacilityListProps {
  facilities: CustomerBranchFacility[]
}

export function CustomerFacilityList({ facilities }: CustomerFacilityListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Facilities</CardTitle>
        <CardDescription>Everything available on-site for comfort and productivity.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {facilities.map((facility) => (
          <div
            key={facility.id}
            className="rounded-xl border border-app-border bg-app-surface-alt/70 p-3"
          >
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-app-text">
              <CheckCircle2 className="h-4 w-4 text-app-success" />
              {facility.name}
            </p>
            <p className="mt-1 text-xs text-app-muted">{facility.description}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
