import { describe, expect, it } from 'vitest'
import { customerForgotPasswordSchema } from '@/features/customer-auth/schemas/customer-forgot-password-schema'

describe('customerForgotPasswordSchema', () => {
  it('accepts valid email payload', () => {
    const result = customerForgotPasswordSchema.safeParse({
      email: 'customer@atspaces.com',
    })

    expect(result.success).toBe(true)
  })

  it('rejects invalid email payload', () => {
    const result = customerForgotPasswordSchema.safeParse({
      email: 'not-email',
    })

    expect(result.success).toBe(false)
  })
})
