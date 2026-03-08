import { describe, expect, it } from 'vitest'
import { customerBookingFormSchema } from '@/features/customer-booking/schemas/customer-booking-form-schema'

describe('customerBookingFormSchema', () => {
  it('accepts valid booking form values', () => {
    const result = customerBookingFormSchema.safeParse({
      bookingDate: '2026-03-21',
      startTime: '09:00',
      endTime: '11:00',
      quantity: 2,
      paymentMethodId: 'card',
      notes: 'Need a whiteboard setup.',
    })

    expect(result.success).toBe(true)
  })

  it('rejects quantity smaller than one', () => {
    const result = customerBookingFormSchema.safeParse({
      bookingDate: '2026-03-21',
      startTime: '09:00',
      endTime: '11:00',
      quantity: 0,
      paymentMethodId: 'card',
      notes: '',
    })

    expect(result.success).toBe(false)
  })

  it('rejects end time earlier than start time', () => {
    const result = customerBookingFormSchema.safeParse({
      bookingDate: '2026-03-21',
      startTime: '14:00',
      endTime: '13:00',
      quantity: 1,
      paymentMethodId: 'card',
      notes: '',
    })

    expect(result.success).toBe(false)
  })
})
