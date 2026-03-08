import { CalendarDays, Layers } from 'lucide-react'
import { StatusBadge } from '@/components/shared/status-badge'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { VendorCapacityRequest } from '@/features/vendor-control/types'

export interface VendorRequestCardProps {
  request: VendorCapacityRequest
  serviceName: string
}

export function VendorRequestCard({ request, serviceName }: VendorRequestCardProps) {
  return (
    <Card className="h-full">
      <CardContent className="space-y-4 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-app-text">{serviceName}</p>
            <p className="mt-1 inline-flex items-center gap-2 text-sm text-app-muted">
              <CalendarDays className="h-4 w-4 text-app-accent" />
              {request.requestDate}
            </p>
          </div>
          <StatusBadge status={request.status} />
        </div>

        <div className="inline-flex items-center gap-2 rounded-xl border border-app-border bg-app-surface-alt/60 px-3 py-2">
          <Layers className="h-4 w-4 text-app-accent" />
          <p className="text-sm text-app-muted">
            Current: <span className="font-semibold text-app-text">{request.currentCapacity}</span>
            {'  '}
            Requested: <span className="font-semibold text-app-text">{request.requestedCapacity}</span>
          </p>
        </div>

        <p className="text-sm text-app-muted">{request.reason}</p>

        <Badge variant="subtle">Request ID: {request.id}</Badge>
      </CardContent>
    </Card>
  )
}
