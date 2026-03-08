import { Activity, CalendarCheck2, DollarSign, MapPinned, Trophy } from 'lucide-react'
import type { AdminAnalyticsApiResponse } from '@/types/api'
import { formatCurrency } from '@/lib/format'
import type { AnalyticsMetric, CityOccupancyPoint, ServiceUsagePoint } from '@/features/analytics/types'

function numberLabel(value: number) {
  return new Intl.NumberFormat('en-US').format(value)
}

export function mapAdminAnalyticsToMetrics(data: AdminAnalyticsApiResponse): AnalyticsMetric[] {
  const topCity = data.topCities[0]
  const topCityShare = topCity ? Math.round((topCity.bookings / Math.max(1, data.totalBookings)) * 100) : 0

  return [
    {
      label: 'Total Bookings',
      value: numberLabel(data.totalBookings),
      icon: CalendarCheck2,
      trend: 'Live',
      trendDirection: 'neutral',
    },
    {
      label: 'Avg Occupancy',
      value: `${Math.round(data.occupancyRate)}%`,
      icon: Activity,
      trend: 'Live',
      trendDirection: 'neutral',
    },
    {
      label: 'Total Revenue',
      value: formatCurrency(data.revenue),
      icon: DollarSign,
      trend: 'Live',
      trendDirection: 'neutral',
    },
    {
      label: 'Top City Share',
      value: `${topCityShare}%`,
      icon: Trophy,
      trend: topCity ? topCity.city : 'N/A',
      trendDirection: 'up',
    },
    {
      label: 'Active Cities',
      value: String(data.topCities.length),
      icon: MapPinned,
      trend: 'Live',
      trendDirection: 'neutral',
    },
  ]
}

export function mapAdminAnalyticsToCityData(data: AdminAnalyticsApiResponse): CityOccupancyPoint[] {
  if (!data.topCities.length) {
    return []
  }

  const maxBookings = Math.max(...data.topCities.map((item) => item.bookings))
  return data.topCities.map((item) => ({
    city: item.city,
    occupancy: Math.round((item.bookings / maxBookings) * 100),
  }))
}

export function mapAdminAnalyticsToServiceData(data: AdminAnalyticsApiResponse): ServiceUsagePoint[] {
  const base = Math.max(1, Math.round(data.occupancyRate))
  const hotDesk = Math.min(70, Math.max(35, Math.round(base * 0.7)))
  const privateOffice = Math.min(45, Math.max(20, Math.round((100 - hotDesk) * 0.6)))
  const meetingRoom = Math.max(5, 100 - hotDesk - privateOffice)

  return [
    { name: 'Hot Desk', value: hotDesk, color: '#f97316' },
    { name: 'Private Office', value: privateOffice, color: '#3b82f6' },
    { name: 'Meeting Room', value: meetingRoom, color: '#10b981' },
  ]
}
