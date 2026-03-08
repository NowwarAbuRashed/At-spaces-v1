import { z } from 'zod'

export const loginSchema = z.object({
  email: z.email('Please enter a valid email address.'),
  password: z
    .string()
    .min(1, 'Password is required.')
    .min(8, 'Password must be at least 8 characters.'),
  remember: z.boolean(),
  captchaToken: z.string().min(1, 'Captcha token is required.'),
})

export type LoginFormValues = z.infer<typeof loginSchema>
