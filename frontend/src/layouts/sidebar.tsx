import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { LogoMark } from '@/components/shared/logo-mark'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/store/auth-context'
import { appLogoItem, primaryNavItems, secondaryNavItems } from '@/features/navigation/nav-items'
import { ROUTES } from '@/lib/routes'
import { cn } from '@/lib/cn'

export interface SidebarProps {
  collapsed: boolean
  onToggleCollapse?: () => void
  onNavigate?: () => void
  className?: string
  showCollapseControl?: boolean
}

export function Sidebar({
  collapsed,
  onToggleCollapse,
  onNavigate,
  className,
  showCollapseControl = false,
}: SidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    navigate(ROUTES.LOGIN)
    onNavigate?.()
  }

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-app-border bg-app-surface/90 px-3 py-4 shadow-soft backdrop-blur-sm',
        className,
      )}
    >
      <div className="mb-6 flex items-center justify-between px-2">
        <LogoMark compact={collapsed} />
        {showCollapseControl ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="hidden h-8 w-8 rounded-full p-0 lg:inline-flex"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={onToggleCollapse}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
        ) : null}
      </div>

      <nav aria-label={appLogoItem.label} className="scrollbar-thin flex-1 overflow-y-auto pr-1">
        <ul className="space-y-1">
          {primaryNavItems.map((item) => (
            <li key={item.label}>
              <NavLink
                to={item.path ?? ROUTES.DASHBOARD}
                end={item.exact}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'flex h-11 items-center rounded-xl px-3 text-sm font-semibold transition-all',
                    collapsed ? 'justify-center' : 'justify-start gap-3',
                    isActive
                      ? 'bg-app-accent text-white shadow-glow'
                      : 'text-app-muted hover:bg-app-surface-alt hover:text-app-text',
                  )
                }
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed ? <span>{item.label}</span> : null}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-4 border-t border-app-border pt-4">
        {secondaryNavItems.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => {
              void handleSignOut()
            }}
            className={cn(
              'flex h-11 w-full items-center rounded-xl px-3 text-sm font-semibold transition-all',
              collapsed ? 'justify-center' : 'justify-start gap-3',
              location.pathname === ROUTES.LOGIN
                ? 'bg-app-accent text-white shadow-glow'
                : 'text-app-muted hover:bg-app-surface-alt hover:text-app-text',
            )}
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!collapsed ? <span>{item.label}</span> : null}
          </button>
        ))}
      </div>
    </aside>
  )
}
