import { CalendarClock, Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { LogoMark } from '@/components/shared/logo-mark'
import { Button } from '@/components/ui/button'
import { useCustomerAuth } from '@/features/customer-auth/store/customer-auth-context'
import { customerPrimaryNavItems } from '@/features/navigation/customer-nav-items'
import { cn } from '@/lib/cn'
import { CUSTOMER_ROUTES } from '@/lib/routes'

export function CustomerLayout() {
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const {
    isAuthenticated,
    hasRefreshAuthFailure,
    consumeRefreshAuthFailure,
    isBackendUnavailable,
    signOut,
  } = useCustomerAuth()
  const closeMobileMenu = () => setMobileOpen(false)

  useEffect(() => {
    if (!hasRefreshAuthFailure) {
      return
    }

    toast.error('Customer session expired. Please sign in again.')
    consumeRefreshAuthFailure()
    navigate(CUSTOMER_ROUTES.LOGIN, { replace: true })
  }, [consumeRefreshAuthFailure, hasRefreshAuthFailure, navigate])

  const handleSignOut = async () => {
    await signOut()
    toast.success('Signed out successfully.')
    navigate(CUSTOMER_ROUTES.LOGIN, { replace: true })
    closeMobileMenu()
  }

  return (
    <div className="min-h-screen bg-app-bg text-app-text">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-app-accent/10 blur-3xl" />
        <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-app-info/10 blur-3xl" />
      </div>

      <header className="sticky top-0 z-40 border-b border-app-border bg-app-bg/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 w-full max-w-[1240px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to={CUSTOMER_ROUTES.HOME} className="shrink-0" onClick={closeMobileMenu}>
            <LogoMark subtitle="Customer" className="scale-90 sm:scale-100" />
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {customerPrimaryNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                className={({ isActive }) =>
                  cn(
                    'inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition-colors',
                    isActive
                      ? 'border-app-accent/40 bg-app-accent/15 text-app-accent'
                      : 'border-transparent text-app-muted hover:border-app-border hover:bg-app-surface-alt hover:text-app-text',
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            {isBackendUnavailable ? (
              <span className="hidden items-center rounded-full border border-app-warning/40 bg-app-warning/10 px-3 py-1.5 text-xs font-semibold text-app-warning lg:inline-flex">
                Backend Offline
              </span>
            ) : null}

            {isAuthenticated ? (
              <>
                <Link to={CUSTOMER_ROUTES.PROFILE}>
                  <Button type="button" variant="secondary" size="sm">
                    Profile
                  </Button>
                </Link>
                <Button type="button" variant="ghost" size="sm" onClick={handleSignOut}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to={CUSTOMER_ROUTES.LOGIN}>
                  <Button type="button" variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                <Link to={CUSTOMER_ROUTES.REGISTER}>
                  <Button type="button" size="sm">
                    Register
                  </Button>
                </Link>
              </>
            )}
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-9 w-9 rounded-full p-0 md:hidden"
            onClick={() => setMobileOpen((value) => !value)}
            aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>

        {mobileOpen ? (
          <div className="border-t border-app-border px-4 py-4 md:hidden sm:px-6">
            <nav className="flex flex-col gap-2">
              {customerPrimaryNavItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.exact}
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    cn(
                      'inline-flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors',
                      isActive
                        ? 'border-app-accent/40 bg-app-accent/15 text-app-accent'
                        : 'border-app-border text-app-muted hover:text-app-text',
                    )
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              ))}
              <div className="mt-2 grid grid-cols-2 gap-2">
                {isAuthenticated ? (
                  <>
                    <Link to={CUSTOMER_ROUTES.PROFILE} onClick={closeMobileMenu}>
                      <Button type="button" variant="secondary" fullWidth>
                        Profile
                      </Button>
                    </Link>
                    <Button type="button" variant="ghost" fullWidth onClick={handleSignOut}>
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to={CUSTOMER_ROUTES.LOGIN} onClick={closeMobileMenu}>
                      <Button type="button" variant="secondary" fullWidth>
                        Login
                      </Button>
                    </Link>
                    <Link to={CUSTOMER_ROUTES.REGISTER} onClick={closeMobileMenu}>
                      <Button type="button" fullWidth>
                        Register
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        ) : null}
      </header>

      <main className="mx-auto w-full max-w-[1240px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Outlet />
      </main>

      <footer className="border-t border-app-border bg-app-bg/70 py-5">
        <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-2 px-4 text-sm text-app-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>AtSpaces Customer Portal</p>
          <p className="inline-flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-app-accent" />
            Real backend integration enabled
          </p>
        </div>
      </footer>
    </div>
  )
}
