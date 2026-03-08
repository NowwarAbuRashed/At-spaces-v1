import { describe, expect, it } from 'vitest'
import { customerLoginSchema } from '@/features/customer-auth/schemas/customer-login-schema'

describe('customerLoginSchema', () => {
  it('accepts valid login payload', () => {
    const result = customerLoginSchema.safeParse({
      email: 'customer@atspaces.com',
      password: 'secret',
    })

    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = customerLoginSchema.safeParse({
      email: 'not-email',
      password: 'secret',
    })

    expect(result.success).toBe(false)
  })
})
