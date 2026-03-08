import { apiRequest } from '@/api/client'
import type { AuthUser } from '@/types/api'

export interface AdminPreAuthResponse {
  preAuthToken: string
  mfaRequired: boolean
}

export interface AuthLoginResponse {
  accessToken: string
  user: AuthUser
}

export async function adminLoginRequest(payload: {
  email: string
  password: string
  captchaToken: string
}) {
  return apiRequest<AdminPreAuthResponse>('/admin/auth/login', {
    method: 'POST',
    body: payload,
  })
}

export async function adminVerifyMfaRequest(payload: {
  preAuthToken: string
  totpCode: string
}) {
  return apiRequest<AuthLoginResponse>('/admin/auth/mfa/verify', {
    method: 'POST',
    body: payload,
  })
}

export async function adminRefreshRequest() {
  return apiRequest<{ accessToken: string }>('/admin/auth/refresh', {
    method: 'POST',
  })
}

export async function adminLogoutRequest(accessToken: string | null) {
  return apiRequest<{ message: string }>('/admin/auth/logout', {
    method: 'POST',
    accessToken,
  })
}

export async function adminForgotPasswordRequest(payload: { email: string }) {
  return apiRequest<{ message: string }>('/admin/auth/forgot-password', {
    method: 'POST',
    body: payload,
  })
}

