import { describe, expect, it } from 'vitest'
import { customerProfileFormSchema } from '@/features/customer-profile/schemas/customer-profile-form-schema'

describe('customerProfileFormSchema', () => {
  it('accepts valid customer profile values', () => {
    const result = customerProfileFormSchema.safeParse({
      fullName: 'Sara Al-Mutairi',
      email: 'sara@example.com',
      phone: '+966551234567',
      preferredCity: 'Riyadh',
      workspacePreference: 'quiet',
      bookingReminders: true,
      scheduleChanges: true,
      specialOffers: false,
    })

    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = customerProfileFormSchema.safeParse({
      fullName: 'Sara Al-Mutairi',
      email: 'not-email',
      phone: '+966551234567',
      preferredCity: 'Riyadh',
      workspacePreference: 'quiet',
      bookingReminders: true,
      scheduleChanges: true,
      specialOffers: false,
    })

    expect(result.success).toBe(false)
  })
})
