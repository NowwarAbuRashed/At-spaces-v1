import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import { formatCurrency } from '@/lib/format'
import type { CustomerBookingPriceBreakdown } from '@/types/customer'

export interface CustomerPriceBreakdownProps {
  breakdown: CustomerBookingPriceBreakdown
  currency?: string
}

export function CustomerPriceBreakdown({
  breakdown,
  currency = 'SAR',
}: CustomerPriceBreakdownProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Total Price</CardTitle>
        <CardDescription>Live backend preview based on current form inputs.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-app-muted">
        <p className="flex items-center justify-between">
          <span>Base amount</span>
          <span>{formatCurrency(breakdown.basePrice, currency)}</span>
        </p>
        <p className="flex items-center justify-between">
          <span>Platform fee</span>
          <span>{formatCurrency(breakdown.platformFee, currency)}</span>
        </p>
        <p className="flex items-center justify-between">
          <span>Payment fee</span>
          <span>{formatCurrency(breakdown.paymentFee, currency)}</span>
        </p>
        <p className="flex items-center justify-between">
          <span>Discount</span>
          <span>-{formatCurrency(breakdown.discount, currency)}</span>
        </p>
        <p className="flex items-center justify-between">
          <span>Tax</span>
          <span>{formatCurrency(breakdown.tax, currency)}</span>
        </p>
        <p className="mt-2 flex items-center justify-between border-t border-app-border pt-3 font-semibold text-app-text">
          <span>Total</span>
          <span className="text-app-accent">{formatCurrency(breakdown.total, currency)}</span>
        </p>
      </CardContent>
    </Card>
  )
}
