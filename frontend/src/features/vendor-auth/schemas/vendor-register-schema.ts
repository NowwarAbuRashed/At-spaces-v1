import { z } from 'zod'

export const vendorRegisterSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required.'),
  email: z.email('Please enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
  branchName: z.string().trim().min(1, 'Branch name is required.'),
  city: z.string().trim().min(1, 'City is required.'),
  address: z.string().trim().min(1, 'Address is required.'),
  latitude: z
    .string()
    .trim()
    .optional(),
  longitude: z
    .string()
    .trim()
    .optional(),
})

export type VendorRegisterFormValues = z.infer<typeof vendorRegisterSchema>
