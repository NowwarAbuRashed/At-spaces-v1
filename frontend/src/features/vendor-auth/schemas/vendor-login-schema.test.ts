import { describe, expect, it } from 'vitest'
import { vendorLoginSchema } from '@/features/vendor-auth/schemas/vendor-login-schema'

describe('vendorLoginSchema', () => {
  it('accepts valid login input', () => {
    const result = vendorLoginSchema.safeParse({
      email: 'vendor@atspaces.com',
      password: 'vendor-password',
    })

    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = vendorLoginSchema.safeParse({
      email: 'invalid-email',
      password: 'vendor-password',
    })

    expect(result.success).toBe(false)
  })

  it('requires password', () => {
    const result = vendorLoginSchema.safeParse({
      email: 'vendor@atspaces.com',
      password: '',
    })

    expect(result.success).toBe(false)
  })
})
