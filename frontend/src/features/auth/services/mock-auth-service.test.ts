import { describe, expect, it } from 'vitest'
import { mockAdminLogin, mockRequestPasswordReset } from '@/features/auth/services/mock-auth-service'

describe('mock-auth-service', () => {
  it('logs in with demo password', async () => {
    const result = await mockAdminLogin({
      email: 'admin@atspaces.com',
      password: 'admin123',
      remember: true,
      captchaToken: 'test-pass',
    })

    expect(result.user.role).toBe('admin')
  })

  it('throws for incorrect demo password', async () => {
    await expect(
      mockAdminLogin({
        email: 'admin@atspaces.com',
        password: 'wrong-password',
        remember: true,
        captchaToken: 'test-pass',
      }),
    ).rejects.toThrowError(/invalid credentials/i)
  })

  it('returns a reset message', async () => {
    const result = await mockRequestPasswordReset({
      email: 'admin@atspaces.com',
    })

    expect(result.message).toContain('admin@atspaces.com')
  })
})
