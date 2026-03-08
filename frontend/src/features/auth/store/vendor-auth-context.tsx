/* eslint-disable react-refresh/only-export-components */
import type { PropsWithChildren } from 'react'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { vendorLogoutRequest, vendorRefreshRequest } from '@/api/vendor-api'
import { isBackendUnavailableError, isUnauthorizedError } from '@/lib/api-error'
import type { AuthUser } from '@/types/api'

const VENDOR_SESSION_STORAGE_KEY = 'atspaces.vendor.session.runtime'

interface PersistedVendorAuthState {
  accessToken: string
  user: AuthUser | null
}

interface VendorAuthContextValue {
  accessToken: string | null
  user: AuthUser | null
  isAuthenticated: boolean
  isHydrating: boolean
  isBackendUnavailable: boolean
  hasRefreshAuthFailure: boolean
  setAuthenticatedSession: (payload: { accessToken: string; user: AuthUser }) => void
  clearSession: () => void
  consumeRefreshAuthFailure: () => void
  signOut: () => Promise<void>
}

const defaultVendorAuthContext: VendorAuthContextValue = {
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

const VendorAuthContext = createContext<VendorAuthContextValue>(defaultVendorAuthContext)

function isVendorRouteScope() {
  if (typeof window === 'undefined') {
    return false
  }

  return window.location.pathname.startsWith('/vendor')
}

function readPersistedVendorState(): PersistedVendorAuthState | null {
  if (typeof window === 'undefined') {
    return null
  }

  const rawState = window.sessionStorage.getItem(VENDOR_SESSION_STORAGE_KEY)
  if (!rawState) {
    return null
  }

  try {
    const parsed = JSON.parse(rawState) as PersistedVendorAuthState
    if (!parsed.accessToken) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

function clearPersistedVendorState() {
  if (typeof window === 'undefined') {
    return
  }

  window.sessionStorage.removeItem(VENDOR_SESSION_STORAGE_KEY)
}

function persistVendorState(state: PersistedVendorAuthState) {
  if (typeof window === 'undefined') {
    return
  }

  window.sessionStorage.setItem(VENDOR_SESSION_STORAGE_KEY, JSON.stringify(state))
}

export function VendorAuthProvider({ children }: PropsWithChildren) {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isHydrating, setIsHydrating] = useState(true)
  const [hasAttemptedRefresh, setHasAttemptedRefresh] = useState(false)
  const [hadPersistedSession, setHadPersistedSession] = useState(false)
  const [isBackendUnavailable, setIsBackendUnavailable] = useState(false)
  const [hasRefreshAuthFailure, setHasRefreshAuthFailure] = useState(false)

  useEffect(() => {
    const persisted = readPersistedVendorState()
    if (persisted) {
      setAccessToken(persisted.accessToken)
      setUser(persisted.user)
    }

    setHadPersistedSession(Boolean(persisted))
    setIsHydrating(false)
  }, [])

  useEffect(() => {
    if (isHydrating || hasAttemptedRefresh || typeof window === 'undefined') {
      return
    }

    if (import.meta.env.MODE === 'test') {
      setHasAttemptedRefresh(true)
      return
    }

    // Prevent vendor refresh traffic when the user is in the customer app.
    if (!isVendorRouteScope()) {
      setIsBackendUnavailable(false)
      return
    }

    if (accessToken) {
      setHasAttemptedRefresh(true)
      setIsBackendUnavailable(false)
      return
    }

    if (!hadPersistedSession) {
      setHasAttemptedRefresh(true)
      setIsBackendUnavailable(false)
      return
    }

    setHasAttemptedRefresh(true)

    void (async () => {
      try {
        const response = await vendorRefreshRequest()
        setAccessToken(response.accessToken)
        setIsBackendUnavailable(false)
        setHasRefreshAuthFailure(false)
      } catch (error) {
        clearPersistedVendorState()
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

  const value = useMemo<VendorAuthContextValue>(
    () => ({
      accessToken,
      user,
      isAuthenticated: Boolean(accessToken),
      isHydrating,
      isBackendUnavailable,
      hasRefreshAuthFailure,
      setAuthenticatedSession: (payload) => {
        const nextState: PersistedVendorAuthState = {
          accessToken: payload.accessToken,
          user: payload.user,
        }

        setAccessToken(payload.accessToken)
        setUser(payload.user)
        setIsBackendUnavailable(false)
        setHasAttemptedRefresh(true)
        setHasRefreshAuthFailure(false)
        persistVendorState(nextState)
      },
      clearSession: () => {
        setAccessToken(null)
        setUser(null)
        setHasAttemptedRefresh(true)
        setHasRefreshAuthFailure(false)
        clearPersistedVendorState()
      },
      consumeRefreshAuthFailure: () => {
        setHasRefreshAuthFailure(false)
      },
      signOut: async () => {
        try {
          await vendorLogoutRequest()
        } catch {
          // Keep local sign-out resilient if backend logout fails.
        } finally {
          setAccessToken(null)
          setUser(null)
          setHasAttemptedRefresh(true)
          setHasRefreshAuthFailure(false)
          clearPersistedVendorState()
        }
      },
    }),
    [accessToken, hasRefreshAuthFailure, isBackendUnavailable, isHydrating, user],
  )

  return <VendorAuthContext.Provider value={value}>{children}</VendorAuthContext.Provider>
}

export function useVendorAuth() {
  return useContext(VendorAuthContext)
}
