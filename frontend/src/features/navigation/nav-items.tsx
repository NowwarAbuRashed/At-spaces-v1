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
import { ROUTES } from '@/lib/routes'
import type { NavItem } from '@/types/navigation'

export const primaryNavItems: NavItem[] = [
  {
    label: 'Dashboard',
    path: ROUTES.DASHBOARD,
    icon: LayoutDashboard,
    requiresAuth: true,
    exact: true,
  },
  {
    label: 'Analytics',
    path: ROUTES.ANALYTICS,
    icon: ChartNoAxesCombined,
    requiresAuth: true,
  },
  {
    label: 'Branches',
    path: ROUTES.BRANCHES,
    icon: Store,
    requiresAuth: true,
  },
  {
    label: 'Vendors',
    path: ROUTES.VENDORS,
    icon: Users,
    requiresAuth: true,
  },
  {
    label: 'Pricing',
    path: ROUTES.PRICING,
    icon: DollarSign,
    requiresAuth: true,
  },
  {
    label: 'Approvals',
    path: ROUTES.APPROVALS,
    icon: CheckSquare,
    requiresAuth: true,
  },
  {
    label: 'Applications',
    path: ROUTES.APPLICATIONS,
    icon: FileSpreadsheet,
    requiresAuth: true,
  },
  {
    label: 'Settings',
    path: ROUTES.SETTINGS,
    icon: Settings,
    requiresAuth: true,
  },
  {
    label: 'Notifications',
    path: ROUTES.NOTIFICATIONS,
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

