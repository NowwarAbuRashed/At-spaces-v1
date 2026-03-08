import { z } from 'zod'

export const customerRegisterPhoneSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required.'),
  phoneNumber: z
    .string()
    .trim()
    .min(7, 'Phone number is too short.')
    .max(20, 'Phone number is too long.'),
})

export type CustomerRegisterPhoneFormValues = z.infer<typeof customerRegisterPhoneSchema>
