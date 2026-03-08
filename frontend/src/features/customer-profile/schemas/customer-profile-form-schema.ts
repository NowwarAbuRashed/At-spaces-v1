import { z } from 'zod'

export const customerProfileFormSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters.')
    .max(80, 'Full name is too long.'),
  email: z.email('Please enter a valid email address.'),
  phone: z
    .string()
    .trim()
    .max(20, 'Phone number is too long.'),
  preferredCity: z.string().min(1, 'Preferred city is required.'),
  workspacePreference: z.enum(['quiet', 'collaborative', 'private-office']),
  bookingReminders: z.boolean(),
  scheduleChanges: z.boolean(),
  specialOffers: z.boolean(),
})

export type CustomerProfileFormSchemaValues = z.infer<typeof customerProfileFormSchema>
