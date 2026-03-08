import { z } from 'zod'

export const profileSettingsSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters.')
    .max(80, 'Full name is too long.'),
  email: z.email('Please enter a valid email address.'),
  phone: z
    .string()
    .min(7, 'Phone number is too short.')
    .max(20, 'Phone number is too long.'),
})

export type ProfileSettingsValues = z.infer<typeof profileSettingsSchema>

