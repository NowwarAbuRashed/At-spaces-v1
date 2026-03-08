import { z } from 'zod'

export const customerVerifyOtpSchema = z.object({
  phoneNumber: z
    .string()
    .trim()
    .min(7, 'Phone number is too short.')
    .max(20, 'Phone number is too long.'),
  otpCode: z
    .string()
    .trim()
    .min(4, 'OTP code is too short.')
    .max(8, 'OTP code is too long.'),
})

export type CustomerVerifyOtpFormValues = z.infer<typeof customerVerifyOtpSchema>
