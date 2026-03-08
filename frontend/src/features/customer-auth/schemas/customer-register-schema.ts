import { z } from 'zod'

export const customerRegisterSchema = z
  .object({
    fullName: z.string().trim().min(1, 'Full name is required.'),
    email: z.email('Please enter a valid email address.'),
    password: z.string().min(1, 'Password is required.'),
    confirmPassword: z.string().min(1, 'Confirm password is required.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Confirm password must match password.',
  })

export type CustomerRegisterFormValues = z.infer<typeof customerRegisterSchema>
