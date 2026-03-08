import type { LucideIcon } from 'lucide-react'

export interface DashboardMetric {
  label: string
  value: string
  icon: LucideIcon
  trend?: string
  trendDirection?: 'up' | 'down' | 'neutral'
}

export interface DashboardAlert {
  id: string
  label: string
  tone: 'default' | 'warning' | 'danger'
}

export interface TopBranch {
  rank: number
  name: string
  city: string
  occupancy: number
}

export interface RecentActivityItem {
  id: string
  event: string
  detail: string
  when: string
}

export interface DashboardQuickAction {
  id: string
  label: string
  badge?: string
  icon: LucideIcon
}

