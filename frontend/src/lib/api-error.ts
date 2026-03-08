import { ApiError } from '@/api/client'

export function isUnauthorizedError(error: unknown) {
  return error instanceof ApiError && error.status === 401
}

export function isBackendUnavailableError(error: unknown) {
  return error instanceof ApiError && error.status === 0
}

export function getInlineApiErrorMessage(error: unknown, fallbackMessage: string) {
  if (isUnauthorizedError(error)) {
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
