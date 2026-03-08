import {
  Bell,
  CalendarCheck,
  CalendarClock,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Settings,
  Store,
  Wrench,
} from 'lucide-react'
import { ROUTES } from '@/lib/routes'
import type { NavItem } from '@/types/navigation'

export const vendorPrimaryNavItems: NavItem[] = [
  {
    label: 'Dashboard',
    path: ROUTES.VENDOR_DASHBOARD,
    icon: LayoutDashboard,
    requiresAuth: true,
    exact: true,
  },
  {
    label: 'Branches',
    path: ROUTES.VENDOR_BRANCHES,
    icon: Store,
    requiresAuth: true,
  },
  {
    label: 'Services',
    path: ROUTES.VENDOR_SERVICES,
    icon: Wrench,
    requiresAuth: true,
  },
  {
    label: 'Availability',
    path: ROUTES.VENDOR_AVAILABILITY,
    icon: CalendarClock,
    requiresAuth: true,
  },
  {
    label: 'Bookings',
    path: ROUTES.VENDOR_BOOKINGS,
    icon: CalendarCheck,
    requiresAuth: true,
  },
  {
    label: 'Requests',
    path: ROUTES.VENDOR_REQUESTS,
    icon: ClipboardList,
    requiresAuth: true,
  },
  {
    label: 'Notifications',
    path: ROUTES.VENDOR_NOTIFICATIONS,
    icon: Bell,
    requiresAuth: true,
  },
  {
    label: 'Settings',
    path: ROUTES.VENDOR_SETTINGS,
    icon: Settings,
    requiresAuth: true,
  },
]

export const vendorSecondaryNavItems: NavItem[] = [
  {
    label: 'Sign Out',
    icon: LogOut,
    requiresAuth: true,
    action: 'signOut',
  },
]
