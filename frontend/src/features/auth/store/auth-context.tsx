/* eslint-disable react-refresh/only-export-components */
import type { PropsWithChildren } from 'react'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { adminLogoutRequest, adminRefreshRequest } from '@/api/auth-api'
import { isBackendUnavailableError, isUnauthorizedError } from '@/lib/api-error'
import type { AuthUser } from '@/types/api'

const LOCAL_STORAGE_KEY = 'atspaces.admin.session'
const SESSION_STORAGE_KEY = 'atspaces.admin.session.runtime'
const ADMIN_LEGACY_PREFIXES = [
  '/dashboard',
  '/analytics',
  '/vendors',
  '/pricing',
  '/approvals',
  '/applications',
  '/notifications',
  '/settings',
]

interface PersistedAuthState {
  accessToken: string
  user: AuthUser | null
}

interface AuthContextValue {
  accessToken: string | null
  user: AuthUser | null
  isAuthenticated: boolean
  isHydrating: boolean
  isBackendUnavailable: boolean
  hasRefreshAuthFailure: boolean
  setAuthenticatedSession: (payload: { accessToken: string; user: AuthUser }, remember: boolean) => void
  clearSession: () => void
  consumeRefreshAuthFailure: () => void
  signOut: () => Promise<void>
}

const defaultAuthContext: AuthContextValue = {
  accessToken: null,
  user: null,
  isAuthenticated: false,
  isHydrating: false,
  isBackendUnavailable: false,
  hasRefreshAuthFailure: false,
  setAuthenticatedSession: () => undefined,
  clearSession: () => undefined,
  consumeRefreshAuthFailure: () => undefined,
  signOut: async () => undefined,
}

const AuthContext = createContext<AuthContextValue>(defaultAuthContext)

function readPersistedState(): PersistedAuthState | null {
  if (typeof window === 'undefined') {
    return null
  }

  const local = window.localStorage
  const session = window.sessionStorage
  const getSessionItem = typeof session?.getItem === 'function' ? session.getItem.bind(session) : null
  const getLocalItem = typeof local?.getItem === 'function' ? local.getItem.bind(local) : null

  const rawSession =
    getSessionItem?.(SESSION_STORAGE_KEY) ??
    getLocalItem?.(LOCAL_STORAGE_KEY)
  if (!rawSession) {
    return null
  }

  try {
    const parsed = JSON.parse(rawSession) as PersistedAuthState
    if (!parsed.accessToken) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

function clearPersistedState() {
  if (typeof window === 'undefined') {
    return
  }

  if (typeof window.localStorage?.removeItem === 'function') {
    window.localStorage.removeItem(LOCAL_STORAGE_KEY)
  }

  if (typeof window.sessionStorage?.removeItem === 'function') {
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY)
  }
}

function persistState(state: PersistedAuthState, remember: boolean) {
  if (typeof window === 'undefined') {
    return
  }

  const serialized = JSON.stringify(state)

  if (remember && typeof window.localStorage?.setItem === 'function') {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, serialized)
    if (typeof window.sessionStorage?.removeItem === 'function') {
      window.sessionStorage.removeItem(SESSION_STORAGE_KEY)
    }
  } else {
    if (typeof window.sessionStorage?.setItem === 'function') {
      window.sessionStorage.setItem(SESSION_STORAGE_KEY, serialized)
    }

    if (typeof window.localStorage?.removeItem === 'function') {
      window.localStorage.removeItem(LOCAL_STORAGE_KEY)
    }
  }
}

function isAdminRouteScope() {
  if (typeof window === 'undefined') {
    return false
  }

  const path = window.location.pathname
  if (path.startsWith('/admin')) {
    return true
  }

  return ADMIN_LEGACY_PREFIXES.some((prefix) => path.startsWith(prefix))
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isHydrating, setIsHydrating] = useState(true)
  const [hadPersistedSession, setHadPersistedSession] = useState(false)
  const [hasAttemptedRefresh, setHasAttemptedRefresh] = useState(false)
  const [isBackendUnavailable, setIsBackendUnavailable] = useState(false)
  const [hasRefreshAuthFailure, setHasRefreshAuthFailure] = useState(false)

  useEffect(() => {
    const persisted = readPersistedState()
    if (persisted) {
      setAccessToken(persisted.accessToken)
      setUser(persisted.user)
    }
    setHadPersistedSession(Boolean(persisted))
    setIsHydrating(false)
  }, [])

  useEffect(() => {
    if (isHydrating || typeof window === 'undefined') {
      return
    }

    if (import.meta.env.MODE === 'test') {
      return
    }

    if (!isAdminRouteScope()) {
      setIsBackendUnavailable(false)
      return
    }

    if (accessToken) {
      setIsBackendUnavailable(false)
      return
    }

    if (hasAttemptedRefresh) {
      return
    }

    if (!hadPersistedSession) {
      setHasAttemptedRefresh(true)
      return
    }

    setHasAttemptedRefresh(true)

    void (async () => {
      try {
        const result = await adminRefreshRequest()
        setAccessToken(result.accessToken)
        setIsBackendUnavailable(false)
        setHasRefreshAuthFailure(false)
      } catch (error) {
        clearPersistedState()
        setAccessToken(null)
        setUser(null)

        if (isUnauthorizedError(error) && hadPersistedSession) {
          setHasRefreshAuthFailure(true)
        }

        if (isBackendUnavailableError(error)) {
          setIsBackendUnavailable(true)
        }
      }
    })()
  }, [accessToken, hadPersistedSession, hasAttemptedRefresh, isHydrating])

  const value = useMemo<AuthContextValue>(
    () => ({
      accessToken,
      user,
      isAuthenticated: Boolean(accessToken),
      isHydrating,
      isBackendUnavailable,
      hasRefreshAuthFailure,
      setAuthenticatedSession: (payload, remember) => {
        const state: PersistedAuthState = {
          accessToken: payload.accessToken,
          user: payload.user,
        }

        setAccessToken(payload.accessToken)
        setUser(payload.user)
        setHasAttemptedRefresh(true)
        setIsBackendUnavailable(false)
        setHasRefreshAuthFailure(false)
        persistState(state, remember)
      },
      clearSession: () => {
        setAccessToken(null)
        setUser(null)
        setHasAttemptedRefresh(true)
        setHasRefreshAuthFailure(false)
        clearPersistedState()
      },
      consumeRefreshAuthFailure: () => {
        setHasRefreshAuthFailure(false)
      },
      signOut: async () => {
        try {
          if (accessToken) {
            await adminLogoutRequest(accessToken)
          }
        } catch {
          // Keep UX resilient even when logout request fails.
        } finally {
          setAccessToken(null)
          setUser(null)
          setHasAttemptedRefresh(true)
          setHasRefreshAuthFailure(false)
          clearPersistedState()
        }
      },
    }),
    [accessToken, hasRefreshAuthFailure, isBackendUnavailable, isHydrating, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
