import type { LucideIcon } from 'lucide-react'
import type { AppRoutePath } from '@/lib/routes'

export type NavAction = 'signOut'

export interface NavItem {
  label: string
  path?: AppRoutePath
  icon: LucideIcon
  requiresAuth: boolean
  exact?: boolean
  action?: NavAction
}

