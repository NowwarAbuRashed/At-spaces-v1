import { describe, expect, it } from 'vitest'
import { vendorForgotPasswordSchema } from '@/features/vendor-auth/schemas/vendor-forgot-password-schema'

describe('vendorForgotPasswordSchema', () => {
  it('accepts a valid email', () => {
    const result = vendorForgotPasswordSchema.safeParse({
      email: 'vendor@atspaces.com',
    })

    expect(result.success).toBe(true)
  })

  it('rejects malformed email input', () => {
    const result = vendorForgotPasswordSchema.safeParse({
      email: 'vendor-atspaces',
    })

    expect(result.success).toBe(false)
  })
})
