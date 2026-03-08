import { ArrowRight, MapPin, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import { formatCurrency } from '@/lib/format'
import { getCustomerBranchDetailsRoute } from '@/lib/routes'
import type { CustomerBranch } from '@/types/customer'
import { getBranchStartingPrice } from '@/features/customer-discovery/data/customer-branches-mock-data'

export interface CustomerBranchCardProps {
  branch: CustomerBranch
}

export function CustomerBranchCard({ branch }: CustomerBranchCardProps) {
  return (
    <Card className="h-full">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <CardTitle className="truncate text-lg">{branch.name}</CardTitle>
            <CardDescription className="inline-flex items-center gap-1.5 text-sm">
              <MapPin className="h-4 w-4" />
              {branch.city}, {branch.district}
            </CardDescription>
          </div>
          <Badge variant="warning" className="inline-flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-app-warning text-app-warning" />
            {branch.rating.toFixed(1)}
          </Badge>
        </div>
        <p className="text-sm text-app-muted">{branch.locationSummary}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-app-muted">{branch.description}</p>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-app-muted">
            Services ({branch.services.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {branch.services.slice(0, 3).map((service) => (
              <Badge key={service.id} variant="subtle">
                {service.name}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-app-muted">Facilities</p>
          <div className="flex flex-wrap gap-2">
            {branch.facilities.slice(0, 2).map((facility) => (
              <Badge key={facility.id} variant="neutral">
                {facility.name}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-app-text">
            From {formatCurrency(getBranchStartingPrice(branch))}/{branch.services[0]?.unit ?? 'hour'}
          </p>
          <Link to={getCustomerBranchDetailsRoute(branch.id)}>
            <Button type="button" size="sm">
              View details
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
