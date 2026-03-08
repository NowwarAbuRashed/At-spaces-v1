import type { LucideIcon } from 'lucide-react'

export type AnalyticsTimeRange = 'today' | 'week' | 'month' | 'custom'

export interface AnalyticsMetric {
  label: string
  value: string
  icon: LucideIcon
  trend: string
  trendDirection: 'up' | 'down' | 'neutral'
}

export interface CityOccupancyPoint {
  city: string
  occupancy: number
}

export interface ServiceUsagePoint {
  name: string
  value: number
  color: string
}

