import { z } from 'zod'

export const vendorForgotPasswordSchema = z.object({
  email: z.email('Please enter a valid email address.'),
})

export type VendorForgotPasswordFormValues = z.infer<typeof vendorForgotPasswordSchema>
