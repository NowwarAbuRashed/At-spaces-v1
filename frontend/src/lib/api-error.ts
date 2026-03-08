import { ApiError } from '@/api/client'

export function isUnauthorizedError(error: unknown) {
  return error instanceof ApiError && error.status === 401
}

export function isBackendUnavailableError(error: unknown) {
  return error instanceof ApiError && error.status === 0
}

export function getInlineApiErrorMessage(
  error: unknown,
  fallbackMessage: string,
  options?: { sessionLabel?: 'admin' | 'vendor' | 'user' },
) {
  if (isUnauthorizedError(error)) {
    if (options?.sessionLabel === 'vendor') {
      return 'Your vendor session expired. Please sign in again.'
    }

    if (options?.sessionLabel === 'user') {
      return 'Your session expired. Please sign in again.'
    }

    return 'Your admin session expired. Please sign in again.'
  }

  if (isBackendUnavailableError(error)) {
    return 'Backend service is currently unavailable. Please retry in a moment.'
  }

  if (error instanceof ApiError && error.message) {
    return error.message
  }

  return fallbackMessage
}
