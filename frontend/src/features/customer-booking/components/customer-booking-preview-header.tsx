import { CalendarDays, MapPin, Wrench } from 'lucide-react'
import { Badge, Card, CardContent } from '@/components/ui'
import type { CustomerBookingSelectionSummary } from '@/types/customer'

export interface CustomerBookingPreviewHeaderProps {
  selection: CustomerBookingSelectionSummary
}

export function CustomerBookingPreviewHeader({ selection }: CustomerBookingPreviewHeaderProps) {
  return (
    <Card className="overflow-hidden rounded-[1.75rem] bg-app-surface/85">
      <CardContent className="relative space-y-5 pt-6 sm:pt-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-app-accent/20 blur-3xl" />
        <div className="relative space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-app-accent">Booking Preview</p>
          <h1 className="font-heading text-3xl font-semibold text-app-text sm:text-4xl">
            Review your booking details before confirmation
          </h1>
          <p className="text-base text-app-muted">
            Availability and pricing are fetched from the live backend before confirmation.
          </p>
        </div>

        <div className="relative flex flex-wrap gap-2">
          <Badge variant="subtle" className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-app-accent" />
            {selection.branchName}
          </Badge>
          <Badge variant="subtle" className="inline-flex items-center gap-1.5">
            <Wrench className="h-3.5 w-3.5 text-app-accent" />
            {selection.serviceName}
          </Badge>
          <Badge variant="subtle" className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-app-accent" />
            Live pricing preview
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
