import { describe, expect, it } from 'vitest'
import { customerRegisterSchema } from '@/features/customer-auth/schemas/customer-register-schema'

describe('customerRegisterSchema', () => {
  it('accepts valid register payload', () => {
    const result = customerRegisterSchema.safeParse({
      fullName: 'Sara Al Mutairi',
      email: 'sara@atspaces.com',
      password: 'secret123',
      confirmPassword: 'secret123',
    })

    expect(result.success).toBe(true)
  })

  it('rejects password mismatch', () => {
    const result = customerRegisterSchema.safeParse({
      fullName: 'Sara Al Mutairi',
      email: 'sara@atspaces.com',
      password: 'secret123',
      confirmPassword: 'secret321',
    })

    expect(result.success).toBe(false)
  })
})
