import type { ForgotPasswordFormValues } from '@/features/auth/schemas/forgot-password-schema'
import type { LoginFormValues } from '@/features/auth/schemas/login-schema'

const DEMO_PASSWORD = 'admin123'
const AUTH_SIMULATION_DELAY_MS = 750

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })
}

export interface LoginResponse {
  user: {
    name: string
    email: string
    role: 'admin'
  }
}

export async function mockAdminLogin(payload: LoginFormValues): Promise<LoginResponse> {
  await wait(AUTH_SIMULATION_DELAY_MS)

  if (payload.password !== DEMO_PASSWORD) {
    throw new Error('Invalid credentials. Use password admin123 for this demo.')
  }

  return {
    user: {
      name: 'Admin User',
      email: payload.email,
      role: 'admin',
    },
  }
}

export async function mockRequestPasswordReset(payload: ForgotPasswordFormValues) {
  await wait(AUTH_SIMULATION_DELAY_MS)

  return {
    message: `Reset link sent to ${payload.email}.`,
  }
}

