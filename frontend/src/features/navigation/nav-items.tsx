import {
  Bell,
  ChartNoAxesCombined,
  CheckSquare,
  ClipboardCheck,
  DollarSign,
  FileSpreadsheet,
  LayoutDashboard,
  LogOut,
  Settings,
  Store,
  Users,
} from 'lucide-react'
import { ADMIN_ROUTES } from '@/lib/routes'
import type { NavItem } from '@/types/navigation'

export const primaryNavItems: NavItem[] = [
  {
    label: 'Dashboard',
    path: ADMIN_ROUTES.DASHBOARD,
    icon: LayoutDashboard,
    requiresAuth: true,
    exact: true,
  },
  {
    label: 'Analytics',
    path: ADMIN_ROUTES.ANALYTICS,
    icon: ChartNoAxesCombined,
    requiresAuth: true,
  },
  {
    label: 'Branches',
    path: ADMIN_ROUTES.BRANCHES,
    icon: Store,
    requiresAuth: true,
  },
  {
    label: 'Vendors',
    path: ADMIN_ROUTES.VENDORS,
    icon: Users,
    requiresAuth: true,
  },
  {
    label: 'Pricing',
    path: ADMIN_ROUTES.PRICING,
    icon: DollarSign,
    requiresAuth: true,
  },
  {
    label: 'Approvals',
    path: ADMIN_ROUTES.APPROVALS,
    icon: CheckSquare,
    requiresAuth: true,
  },
  {
    label: 'Applications',
    path: ADMIN_ROUTES.APPLICATIONS,
    icon: FileSpreadsheet,
    requiresAuth: true,
  },
  {
    label: 'Settings',
    path: ADMIN_ROUTES.SETTINGS,
    icon: Settings,
    requiresAuth: true,
  },
  {
    label: 'Notifications',
    path: ADMIN_ROUTES.NOTIFICATIONS,
    icon: Bell,
    requiresAuth: true,
  },
]

export const secondaryNavItems: NavItem[] = [
  {
    label: 'Sign Out',
    icon: LogOut,
    requiresAuth: true,
    action: 'signOut',
  },
]

export const appLogoItem: NavItem = {
  label: 'AtSpaces',
  icon: ClipboardCheck,
  requiresAuth: true,
}
