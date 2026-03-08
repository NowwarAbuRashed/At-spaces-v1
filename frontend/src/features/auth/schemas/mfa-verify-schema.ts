import { z } from 'zod'

export const mfaVerifySchema = z.object({
  totpCode: z
    .string()
    .length(6, 'MFA code must be exactly 6 digits.')
    .regex(/^\d+$/, 'MFA code must contain only numbers.'),
})

export type MfaVerifyValues = z.infer<typeof mfaVerifySchema>

