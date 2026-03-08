import { z } from 'zod'

export const vendorLoginSchema = z.object({
  email: z.email('Please enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
})

export type VendorLoginFormValues = z.infer<typeof vendorLoginSchema>
