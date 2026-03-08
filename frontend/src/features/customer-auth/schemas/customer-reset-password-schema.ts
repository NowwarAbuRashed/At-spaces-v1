import { z } from 'zod'

export const customerResetPasswordSchema = z
  .object({
    resetToken: z.string().trim().min(1, 'Reset token is required.'),
    newPassword: z.string().min(1, 'New password is required.'),
    confirmPassword: z.string().min(1, 'Confirm password is required.'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Confirm password must match new password.',
  })

export type CustomerResetPasswordFormValues = z.infer<typeof customerResetPasswordSchema>
