import { vi } from 'vitest'

const CUSTOMER_SESSION_STORAGE_KEY = 'atspaces.customer.session.runtime'

export function createStorageMock(): Storage {
  const store = new Map<string, string>()

  return {
    get length() {
      return store.size
    },
    clear() {
      store.clear()
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null
    },
    removeItem(key: string) {
      store.delete(key)
    },
    setItem(key: string, value: string) {
      store.set(key, value)
    },
  }
}

export function setupBrowserStorageMocks() {
  Object.defineProperty(window, 'localStorage', {
    value: createStorageMock(),
    configurable: true,
  })
  Object.defineProperty(window, 'sessionStorage', {
    value: createStorageMock(),
    configurable: true,
  })
}

export function setCustomerSession() {
  window.sessionStorage.setItem(
    CUSTOMER_SESSION_STORAGE_KEY,
    JSON.stringify({
      accessToken: 'customer-token',
      user: {
        id: 100,
        role: 'customer',
        fullName: 'Customer User',
      },
    }),
  )
}

export function clearCustomerSession() {
  window.sessionStorage.removeItem(CUSTOMER_SESSION_STORAGE_KEY)
}

export function createJsonResponse(payload: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(payload),
  } as Response
}

export function createTextResponse(payload: string, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => payload,
  } as Response
}

export type FetchHandler = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

export function mockFetch(handler: FetchHandler) {
  const fetchMock = vi.fn(handler)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}
