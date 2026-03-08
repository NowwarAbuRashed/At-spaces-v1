/* eslint-disable react-refresh/only-export-components */
import type { PropsWithChildren } from 'react'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { customerLogoutRequest, customerRefreshRequest } from '@/api/customer-api'
import { isBackendUnavailableError, isUnauthorizedError } from '@/lib/api-error'
import type { AuthUser } from '@/types/api'

const CUSTOMER_SESSION_STORAGE_KEY = 'atspaces.customer.session.runtime'

interface PersistedCustomerAuthState {
  accessToken: string
  user: AuthUser | null
}

interface CustomerAuthContextValue {
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

const defaultCustomerAuthContext: CustomerAuthContextValue = {
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

const CustomerAuthContext = createContext<CustomerAuthContextValue>(defaultCustomerAuthContext)

function readPersistedCustomerState(): PersistedCustomerAuthState | null {
  if (typeof window === 'undefined') {
    return null
  }

  const rawState = window.sessionStorage.getItem(CUSTOMER_SESSION_STORAGE_KEY)
  if (!rawState) {
    return null
  }

  try {
    const parsed = JSON.parse(rawState) as PersistedCustomerAuthState
    if (!parsed.accessToken) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

function clearPersistedCustomerState() {
  if (typeof window === 'undefined') {
    return
  }

  window.sessionStorage.removeItem(CUSTOMER_SESSION_STORAGE_KEY)
}

function persistCustomerState(state: PersistedCustomerAuthState) {
  if (typeof window === 'undefined') {
    return
  }

  window.sessionStorage.setItem(CUSTOMER_SESSION_STORAGE_KEY, JSON.stringify(state))
}

export function CustomerAuthProvider({ children }: PropsWithChildren) {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isHydrating, setIsHydrating] = useState(true)
  const [hasAttemptedRefresh, setHasAttemptedRefresh] = useState(false)
  const [hadPersistedSession, setHadPersistedSession] = useState(false)
  const [isBackendUnavailable, setIsBackendUnavailable] = useState(false)
  const [hasRefreshAuthFailure, setHasRefreshAuthFailure] = useState(false)

  useEffect(() => {
    const persisted = readPersistedCustomerState()
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

    if (accessToken) {
      setHasAttemptedRefresh(true)
      setIsBackendUnavailable(false)
      return
    }

    // Only attempt refresh when we actually restored a persisted customer session.
    if (!hadPersistedSession) {
      setHasAttemptedRefresh(true)
      setIsBackendUnavailable(false)
      return
    }

    setHasAttemptedRefresh(true)

    void (async () => {
      try {
        const response = await customerRefreshRequest()
        setAccessToken(response.accessToken)
        setIsBackendUnavailable(false)
        setHasRefreshAuthFailure(false)
      } catch (error) {
        clearPersistedCustomerState()
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

  const value = useMemo<CustomerAuthContextValue>(
    () => ({
      accessToken,
      user,
      isAuthenticated: Boolean(accessToken),
      isHydrating,
      isBackendUnavailable,
      hasRefreshAuthFailure,
      setAuthenticatedSession: (payload) => {
        const nextState: PersistedCustomerAuthState = {
          accessToken: payload.accessToken,
          user: payload.user,
        }

        setAccessToken(payload.accessToken)
        setUser(payload.user)
        setIsBackendUnavailable(false)
        setHasAttemptedRefresh(true)
        setHasRefreshAuthFailure(false)
        persistCustomerState(nextState)
      },
      clearSession: () => {
        setAccessToken(null)
        setUser(null)
        setHasAttemptedRefresh(true)
        setHasRefreshAuthFailure(false)
        clearPersistedCustomerState()
      },
      consumeRefreshAuthFailure: () => {
        setHasRefreshAuthFailure(false)
      },
      signOut: async () => {
        try {
          await customerLogoutRequest()
        } catch {
          // Keep local sign-out resilient if backend logout fails.
        } finally {
          setAccessToken(null)
          setUser(null)
          setHasAttemptedRefresh(true)
          setHasRefreshAuthFailure(false)
          clearPersistedCustomerState()
        }
      },
    }),
    [accessToken, hasRefreshAuthFailure, isBackendUnavailable, isHydrating, user],
  )

  return <CustomerAuthContext.Provider value={value}>{children}</CustomerAuthContext.Provider>
}

export function useCustomerAuth() {
  return useContext(CustomerAuthContext)
}
