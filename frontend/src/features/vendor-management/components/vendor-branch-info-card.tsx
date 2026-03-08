import { MapPin, Phone, UserRound } from 'lucide-react'
import { StatusBadge } from '@/components/shared/status-badge'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { VendorBranchDetails } from '@/features/vendor-management/types'

export interface VendorBranchInfoCardProps {
  branch: VendorBranchDetails
}

export function VendorBranchInfoCard({ branch }: VendorBranchInfoCardProps) {
  return (
    <Card className="h-full">
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{branch.name}</CardTitle>
            <p className="mt-1 text-sm text-app-muted">{branch.description}</p>
          </div>
          <StatusBadge status={branch.status} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="subtle" className="bg-app-accent/15 text-app-accent">
            {branch.city}
          </Badge>
          <Badge variant="neutral">Branch ID: {branch.id}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm text-app-muted">
          <p className="inline-flex items-center gap-2">
            <MapPin className="h-4 w-4 text-app-accent" />
            {branch.address}
          </p>
          <p className="inline-flex items-center gap-2">
            <UserRound className="h-4 w-4 text-app-accent" />
            {branch.managerName}
          </p>
          <p className="inline-flex items-center gap-2">
            <Phone className="h-4 w-4 text-app-accent" />
            {branch.supportPhone}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-app-border bg-app-surface-alt/70 p-4 text-center">
            <p className="font-heading text-3xl font-semibold text-app-text">{branch.occupancyPercent}%</p>
            <p className="text-sm text-app-muted">Occupancy</p>
          </div>
          <div className="rounded-xl border border-app-border bg-app-surface-alt/70 p-4 text-center">
            <p className="font-heading text-3xl font-semibold text-app-text">{branch.todayBookings}</p>
            <p className="text-sm text-app-muted">Today Bookings</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
