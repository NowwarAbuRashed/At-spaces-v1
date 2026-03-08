import { CalendarSearch } from 'lucide-react'
import { Button, Card, CardContent } from '@/components/ui'

export interface CustomerBookingsEmptyStateProps {
  onReset: () => void
}

export function CustomerBookingsEmptyState({ onReset }: CustomerBookingsEmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-app-border bg-app-surface-alt text-app-accent">
          <CalendarSearch className="h-6 w-6" />
        </span>
        <div className="space-y-1">
          <p className="font-heading text-xl font-semibold text-app-text">No bookings to show</p>
          <p className="max-w-md text-sm text-app-muted">
            You do not have any bookings yet. Create one from the booking preview page.
          </p>
        </div>
        <Button type="button" variant="secondary" onClick={onReset}>
          Refresh bookings
        </Button>
      </CardContent>
    </Card>
  )
}
