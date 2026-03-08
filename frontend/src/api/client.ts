import { appEnv } from '@/lib/env'
import type { ApiErrorPayload } from '@/types/api'

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  query?: Record<string, string | number | boolean | undefined | null>
  body?: unknown | FormData
  accessToken?: string | null
  signal?: AbortSignal
  responseType?: 'json' | 'text'
}

export class ApiError extends Error {
  readonly status: number
  readonly code?: string
  readonly details?: ApiErrorPayload['details']

  constructor(status: number, payload: ApiErrorPayload | undefined, fallbackMessage: string) {
    super(payload?.message ?? fallbackMessage)
    this.status = status
    this.code = payload?.code
    this.details = payload?.details
  }
}

function buildUrl(path: string, query: RequestOptions['query']) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const url = new URL(`${appEnv.apiBaseUrl}${normalizedPath}`)

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && String(value).trim().length > 0) {
        url.searchParams.set(key, String(value))
      }
    }
  }

  return url.toString()
}

function maybeJson(text: string): unknown {
  if (!text) {
    return undefined
  }

  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let response: Response
  const isFormDataBody = typeof FormData !== 'undefined' && options.body instanceof FormData
  const headers: Record<string, string> = {
    ...(isFormDataBody ? {} : { 'Content-Type': 'application/json' }),
    ...(options.accessToken ? { Authorization: `Bearer ${options.accessToken}` } : {}),
  }

  try {
    response = await fetch(buildUrl(path, options.query), {
      method: options.method ?? 'GET',
      headers,
      body:
        options.body !== undefined
          ? isFormDataBody
            ? (options.body as FormData)
            : JSON.stringify(options.body)
          : undefined,
      credentials: 'include',
      signal: options.signal,
    })
  } catch {
    throw new ApiError(
      0,
      {
        code: 'NETWORK_UNAVAILABLE',
        message: 'Cannot reach backend service. Please try again shortly.',
      },
      'Network request failed',
    )
  }

  const text = await response.text()
  const payload = maybeJson(text) as ApiErrorPayload | undefined

  if (!response.ok) {
    throw new ApiError(response.status, payload, `Request failed with status ${response.status}`)
  }

  if (options.responseType === 'text') {
    return text as T
  }

  return (payload as T) ?? ({} as T)
}
