import type { LucideIcon } from 'lucide-react'
import { Building2, CalendarClock, Home, UserRound } from 'lucide-react'
import type { CustomerRoutePath } from '@/lib/routes'
import { CUSTOMER_ROUTES } from '@/lib/routes'

export interface CustomerNavItem {
  label: string
  path: CustomerRoutePath
  icon: LucideIcon
  exact?: boolean
}

export const customerPrimaryNavItems: CustomerNavItem[] = [
  {
    label: 'Home',
    path: CUSTOMER_ROUTES.HOME,
    icon: Home,
    exact: true,
  },
  {
    label: 'Branches',
    path: CUSTOMER_ROUTES.BRANCHES,
    icon: Building2,
  },
  {
    label: 'My Bookings',
    path: CUSTOMER_ROUTES.MY_BOOKINGS,
    icon: CalendarClock,
  },
  {
    label: 'Profile',
    path: CUSTOMER_ROUTES.PROFILE,
    icon: UserRound,
  },
]
