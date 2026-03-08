import { CalendarClock, MapPin, StickyNote, UsersRound, Wrench } from 'lucide-react'
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import { formatShortDate } from '@/lib/format'
import type {
  CustomerBookingPreviewFormState,
  CustomerBookingSelectionSummary,
  CustomerPaymentMethodOption,
} from '@/types/customer'

export interface CustomerBookingSummaryCardProps {
  selection: CustomerBookingSelectionSummary
  values: CustomerBookingPreviewFormState
  paymentMethods: CustomerPaymentMethodOption[]
}

export function CustomerBookingSummaryCard({
  selection,
  values,
  paymentMethods,
}: CustomerBookingSummaryCardProps) {
  const selectedPaymentMethod =
    paymentMethods.find((method) => method.id === values.paymentMethodId) ??
    paymentMethods[0]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking Summary</CardTitle>
        <CardDescription>Current selection snapshot before booking confirmation.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="inline-flex items-center gap-2 rounded-xl border border-app-border bg-app-surface-alt/70 px-3 py-2 text-sm text-app-text">
          <MapPin className="h-4 w-4 text-app-accent" />
          {selection.branchName}, {selection.city}
        </p>
        <p className="inline-flex items-center gap-2 rounded-xl border border-app-border bg-app-surface-alt/70 px-3 py-2 text-sm text-app-text">
          <Wrench className="h-4 w-4 text-app-accent" />
          {selection.serviceName}
        </p>
        <p className="inline-flex items-center gap-2 rounded-xl border border-app-border bg-app-surface-alt/70 px-3 py-2 text-sm text-app-text">
          <CalendarClock className="h-4 w-4 text-app-accent" />
          {values.bookingDate ? formatShortDate(values.bookingDate) : 'No date selected'} | {values.startTime} -{' '}
          {values.endTime}
        </p>
        <p className="inline-flex items-center gap-2 rounded-xl border border-app-border bg-app-surface-alt/70 px-3 py-2 text-sm text-app-text">
          <UsersRound className="h-4 w-4 text-app-accent" />
          Quantity: {values.quantity}
        </p>
        <Badge variant="subtle">{selectedPaymentMethod?.label ?? 'Payment method'}</Badge>
        {values.notes ? (
          <p className="inline-flex w-full items-start gap-2 rounded-xl border border-app-border bg-app-surface-alt/70 px-3 py-2 text-sm text-app-muted">
            <StickyNote className="mt-0.5 h-4 w-4 shrink-0 text-app-accent" />
            {values.notes}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
