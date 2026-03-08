import { z } from 'zod'

export const customerForgotPasswordSchema = z.object({
  email: z.email('Please enter a valid email address.'),
})

export type CustomerForgotPasswordFormValues = z.infer<typeof customerForgotPasswordSchema>
