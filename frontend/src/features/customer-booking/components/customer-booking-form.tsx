import type { FormEventHandler } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { Button, Input } from '@/components/ui'
import { CustomerPaymentMethodSelector } from '@/features/customer-booking/components/customer-payment-method-selector'
import type { CustomerBookingFormValues } from '@/features/customer-booking/schemas/customer-booking-form-schema'
import type { CustomerPaymentMethodOption } from '@/types/customer'

export interface CustomerBookingFormProps {
  form: UseFormReturn<CustomerBookingFormValues>
  paymentMethods: CustomerPaymentMethodOption[]
  onSubmit: FormEventHandler<HTMLFormElement>
  submitLabel?: string
  submitDisabled?: boolean
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null
  }

  return <p className="text-xs text-app-danger">{message}</p>
}

export function CustomerBookingForm({
  form,
  paymentMethods,
  onSubmit,
  submitLabel = 'Create booking',
  submitDisabled = false,
}: CustomerBookingFormProps) {
  return (
    <form className="space-y-4" onSubmit={onSubmit} noValidate>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-app-text">Booking Date</span>
          <Input
            type="date"
            aria-invalid={Boolean(form.formState.errors.bookingDate)}
            {...form.register('bookingDate')}
          />
          <FieldError message={form.formState.errors.bookingDate?.message} />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-app-text">Quantity</span>
          <Input
            type="number"
            min={1}
            step={1}
            aria-invalid={Boolean(form.formState.errors.quantity)}
            {...form.register('quantity', { valueAsNumber: true })}
          />
          <FieldError message={form.formState.errors.quantity?.message} />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-app-text">Start Time</span>
          <Input
            type="time"
            aria-invalid={Boolean(form.formState.errors.startTime)}
            {...form.register('startTime')}
          />
          <FieldError message={form.formState.errors.startTime?.message} />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-app-text">End Time</span>
          <Input
            type="time"
            aria-invalid={Boolean(form.formState.errors.endTime)}
            {...form.register('endTime')}
          />
          <FieldError message={form.formState.errors.endTime?.message} />
        </label>
      </div>

      <CustomerPaymentMethodSelector
        options={paymentMethods}
        selectedMethodId={form.watch('paymentMethodId')}
        onChange={(methodId) => {
          form.setValue('paymentMethodId', methodId, {
            shouldDirty: true,
            shouldTouch: true,
            shouldValidate: true,
          })
        }}
      />
      <FieldError message={form.formState.errors.paymentMethodId?.message} />

      <label className="space-y-2">
        <span className="text-sm font-semibold text-app-text">Notes (optional)</span>
        <textarea
          className="min-h-24 w-full resize-y rounded-xl border border-app-border bg-app-surface-alt px-3 py-2 text-sm text-app-text outline-none transition-all placeholder:text-app-muted/90 focus:border-app-accent/60 focus:ring-2 focus:ring-app-accent/30"
          placeholder="Any setup preferences or notes for this booking..."
          aria-invalid={Boolean(form.formState.errors.notes)}
          {...form.register('notes')}
        />
        <FieldError message={form.formState.errors.notes?.message} />
      </label>

      <Button type="submit" fullWidth isLoading={form.formState.isSubmitting} disabled={submitDisabled}>
        {submitLabel}
      </Button>
    </form>
  )
}
