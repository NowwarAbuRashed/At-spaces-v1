import { describe, expect, it } from 'vitest'
import { forgotPasswordSchema } from '@/features/auth/schemas/forgot-password-schema'

describe('forgotPasswordSchema', () => {
  it('accepts a valid email address', () => {
    const result = forgotPasswordSchema.safeParse({
      email: 'admin@atspaces.com',
    })

    expect(result.success).toBe(true)
  })

  it('rejects malformed email input', () => {
    const result = forgotPasswordSchema.safeParse({
      email: 'admin',
    })

    expect(result.success).toBe(false)
  })
})

