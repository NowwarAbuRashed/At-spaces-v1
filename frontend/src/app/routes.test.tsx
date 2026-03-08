import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { AppRoutes } from '@/app/routes'
import { AppProviders } from '@/app/providers'

function createStorageMock(): Storage {
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

function setStoredSession(value: string) {
  window.localStorage.setItem('atspaces.admin.session', value)
}

function clearStoredSession() {
  window.localStorage.removeItem('atspaces.admin.session')
  window.sessionStorage.removeItem('atspaces.admin.session.runtime')
  window.sessionStorage.removeItem('atspaces.vendor.session.runtime')
}

function setVendorSession() {
  window.sessionStorage.setItem(
    'atspaces.vendor.session.runtime',
    JSON.stringify({
      accessToken: 'vendor-token',
      user: {
        id: 2,
        role: 'vendor',
        fullName: 'Vendor User',
      },
    }),
  )
}

function renderRoutes(path: string) {
  return render(
    <AppProviders>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </AppProviders>,
  )
}

describe('AppRoutes', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: createStorageMock(),
      configurable: true,
    })
    Object.defineProperty(window, 'sessionStorage', {
      value: createStorageMock(),
      configurable: true,
    })
    clearStoredSession()
  })

  it('renders dashboard layout routes when authenticated', () => {
    setStoredSession(
      JSON.stringify({
        accessToken: 'test-token',
        user: { id: 1, role: 'admin', fullName: 'Admin User' },
      }),
    )

    renderRoutes('/dashboard')

    expect(screen.getByText('Good evening, Admin')).toBeInTheDocument()
    expect(screen.getByText('Secure Admin Session')).toBeInTheDocument()
  })

  it('redirects unauthenticated users to login for protected routes', () => {
    clearStoredSession()

    renderRoutes('/dashboard')

    expect(screen.getByText('Welcome back')).toBeInTheDocument()
  })

  it('renders auth route', () => {
    renderRoutes('/login')

    expect(screen.getByText('Welcome back')).toBeInTheDocument()
  })

  it('renders vendor login for unauthenticated vendor routes', () => {
    renderRoutes('/vendor/login')

    expect(screen.getByText('Sign in to Vendor Workspace')).toBeInTheDocument()
  })

  it('redirects vendor protected routes to vendor login when no session exists', () => {
    renderRoutes('/vendor/dashboard')

    expect(screen.getByText('Sign in to Vendor Workspace')).toBeInTheDocument()
  })

  it('redirects vendor login route to dashboard when vendor session exists', async () => {
    setVendorSession()
    renderRoutes('/vendor/login')

    expect(screen.queryByText('Sign in to Vendor Workspace')).not.toBeInTheDocument()
    expect(
      await screen.findByText(/Loading vendor dashboard|Unable to load vendor dashboard|Vendor Dashboard/i),
    ).toBeInTheDocument()
  })
})
