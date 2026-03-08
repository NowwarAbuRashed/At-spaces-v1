import { describe, expect, it } from 'vitest'
import { mfaVerifySchema } from '@/features/auth/schemas/mfa-verify-schema'

describe('mfaVerifySchema', () => {
  it('accepts 6-digit totp code', () => {
    const result = mfaVerifySchema.safeParse({ totpCode: '123456' })
    expect(result.success).toBe(true)
  })

  it('rejects malformed totp code', () => {
    const result = mfaVerifySchema.safeParse({ totpCode: '12A4' })
    expect(result.success).toBe(false)
  })
})

