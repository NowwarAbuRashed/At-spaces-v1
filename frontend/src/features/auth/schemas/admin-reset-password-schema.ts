import { z } from 'zod'

export const adminResetPasswordSchema = z
  .object({
    resetToken: z.string().trim().min(1, 'Reset token is required.'),
    newPassword: z.string().min(1, 'New password is required.'),
    confirmPassword: z.string().min(1, 'Confirm password is required.'),
    totpCode: z
      .string()
      .trim()
      .min(4, 'Authenticator code is too short.')
      .max(8, 'Authenticator code is too long.'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Confirm password must match new password.',
  })

export type AdminResetPasswordFormValues = z.infer<typeof adminResetPasswordSchema>
