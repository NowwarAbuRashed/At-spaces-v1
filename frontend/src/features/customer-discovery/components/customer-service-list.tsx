import { Clock3, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import { formatCurrency } from '@/lib/format'
import { getCustomerServiceDetailsRoute } from '@/lib/routes'
import type { CustomerBranchService } from '@/types/customer'

export interface CustomerServiceListProps {
  services: CustomerBranchService[]
}

export function CustomerServiceList({ services }: CustomerServiceListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Services</CardTitle>
        <CardDescription>Available service options with price and unit summaries.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {services.map((service) => (
          <div
            key={service.id}
            className="rounded-xl border border-app-border bg-app-surface-alt/70 p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-app-text">{service.name}</p>
                <p className="text-xs text-app-muted">{service.description}</p>
              </div>
              <Badge variant="accent">{service.category}</Badge>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-app-muted">
              <p className="font-semibold text-app-text">
                {formatCurrency(service.price)}/{service.unit}
              </p>
              <p className="inline-flex items-center gap-1.5">
                <Clock3 className="h-3.5 w-3.5 text-app-accent" />
                {service.durationLabel}
              </p>
              <p className="inline-flex items-center gap-1.5">
                <UsersRound className="h-3.5 w-3.5 text-app-accent" />
                {service.capacityLabel}
              </p>
              {typeof service.serviceId === 'number' ? (
                <Link
                  to={getCustomerServiceDetailsRoute(service.serviceId)}
                  className="font-semibold text-app-accent transition-colors hover:text-orange-300"
                >
                  Service details
                </Link>
              ) : null}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
