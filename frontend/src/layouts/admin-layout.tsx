import { Menu, ShieldCheck, X } from 'lucide-react'
import { useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/store/auth-context'
import { useSidebar } from '@/hooks/use-sidebar'
import { cn } from '@/lib/cn'
import { ADMIN_ROUTES } from '@/lib/routes'
import { Sidebar } from '@/layouts/sidebar'

const PAGE_TITLES: Record<string, string> = {
  [ADMIN_ROUTES.DASHBOARD]: 'Dashboard',
  [ADMIN_ROUTES.ANALYTICS]: 'Analytics',
  [ADMIN_ROUTES.BRANCHES]: 'Branches',
  [ADMIN_ROUTES.VENDORS]: 'Vendors',
  [ADMIN_ROUTES.PRICING]: 'Pricing',
  [ADMIN_ROUTES.APPROVALS]: 'Approvals',
  [ADMIN_ROUTES.APPLICATIONS]: 'Applications',
  [ADMIN_ROUTES.NOTIFICATIONS]: 'Notifications',
  [ADMIN_ROUTES.SETTINGS]: 'Settings',
}

export function AdminLayout() {
  const navigate = useNavigate()
  const {
    hasRefreshAuthFailure,
    consumeRefreshAuthFailure,
    isBackendUnavailable,
  } = useAuth()
  const { collapsed, mobileOpen, openMobile, closeMobile, toggleCollapse } = useSidebar()
  const location = useLocation()
  const currentPageTitle = PAGE_TITLES[location.pathname] ?? 'Admin'

  useEffect(() => {
    if (!hasRefreshAuthFailure) {
      return
    }

    toast.error('Session expired. Please sign in again.')
    consumeRefreshAuthFailure()
    navigate(ADMIN_ROUTES.LOGIN, { replace: true })
  }, [consumeRefreshAuthFailure, hasRefreshAuthFailure, navigate])

  return (
    <div className="min-h-screen bg-app-bg text-app-text">
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-40 hidden transition-[width] duration-300 lg:block',
          collapsed ? 'w-24' : 'w-72',
        )}
      >
        <Sidebar collapsed={collapsed} onToggleCollapse={toggleCollapse} showCollapseControl />
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm lg:hidden">
          <div className="absolute left-0 top-0 h-full w-72">
            <Sidebar collapsed={false} onNavigate={closeMobile} />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-4 top-4 h-9 w-9 rounded-full p-0 text-white"
            onClick={closeMobile}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      ) : null}

      <div className={cn('min-h-screen transition-[padding] duration-300', collapsed ? 'lg:pl-24' : 'lg:pl-72')}>
        <header className="sticky top-0 z-30 border-b border-app-border bg-app-bg/90 backdrop-blur-sm">
          <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-9 w-9 rounded-full p-0 lg:hidden"
                onClick={openMobile}
                aria-label="Open sidebar"
              >
                <Menu className="h-4 w-4" />
              </Button>
              <p className="font-heading text-lg font-semibold text-app-text">{currentPageTitle}</p>
            </div>

            <div className="flex items-center gap-2">
              {isBackendUnavailable ? (
                <span className="hidden items-center rounded-full border border-app-warning/40 bg-app-warning/10 px-3 py-1.5 text-xs font-semibold text-app-warning sm:inline-flex">
                  Offline Preview
                </span>
              ) : null}
              <span className="inline-flex items-center gap-2 rounded-full border border-app-border bg-app-surface-alt px-3 py-1.5 text-xs font-semibold text-app-muted">
                <ShieldCheck className="h-3.5 w-3.5 text-app-success" />
                Secure Admin Session
              </span>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
