import { apiRequest } from '@/api/client'
import type { MeApiResponse } from '@/types/api'

export async function getMe(options: { accessToken: string }) {
  return apiRequest<MeApiResponse>('/users/me', {
    accessToken: options.accessToken,
  })
}

export async function updateMe(options: {
  accessToken: string
  fullName?: string
  email?: string
}) {
  return apiRequest<MeApiResponse>('/users/me', {
    method: 'PUT',
    accessToken: options.accessToken,
    body: {
      fullName: options.fullName,
      email: options.email,
    },
  })
}

