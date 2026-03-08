import { describe, expect, it } from 'vitest'
import { loginSchema } from '@/features/auth/schemas/login-schema'

describe('loginSchema', () => {
  it('validates correct login values', () => {
    const result = loginSchema.safeParse({
      email: 'admin@atspaces.com',
      password: 'admin123',
      remember: true,
      captchaToken: 'test-pass',
    })

    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'admin123',
      remember: true,
      captchaToken: 'test-pass',
    })

    expect(result.success).toBe(false)
  })
})
