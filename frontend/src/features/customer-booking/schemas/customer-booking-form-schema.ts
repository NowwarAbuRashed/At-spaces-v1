import { z } from 'zod'

function parseTimeToMinutes(value: string) {
  const [hours, minutes] = value.split(':').map((part) => Number(part))
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return Number.NaN
  }

  return hours * 60 + minutes
}

export const customerBookingFormSchema = z
  .object({
    bookingDate: z.string().min(1, 'Booking date is required.'),
    startTime: z.string().min(1, 'Start time is required.'),
    endTime: z.string().min(1, 'End time is required.'),
    quantity: z.number().int().min(1, 'Quantity must be at least 1.'),
    paymentMethodId: z.string().min(1, 'Payment method is required.'),
    notes: z.string().max(400, 'Notes must be 400 characters or fewer.'),
  })
  .refine(
    (values) => {
      const start = parseTimeToMinutes(values.startTime)
      const end = parseTimeToMinutes(values.endTime)
      if (Number.isNaN(start) || Number.isNaN(end)) {
        return false
      }

      return start < end
    },
    {
      path: ['endTime'],
      message: 'End time must be later than start time.',
    },
  )

export type CustomerBookingFormValues = z.infer<typeof customerBookingFormSchema>
