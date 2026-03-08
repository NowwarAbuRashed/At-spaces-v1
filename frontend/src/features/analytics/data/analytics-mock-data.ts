import { Activity, CalendarCheck2, DollarSign, ReceiptText, UserRoundX } from 'lucide-react'
import type {
  AnalyticsMetric,
  AnalyticsTimeRange,
  CityOccupancyPoint,
  ServiceUsagePoint,
} from '@/features/analytics/types'

export const analyticsRangeTabs: Array<{ label: string; value: AnalyticsTimeRange }> = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'Custom', value: 'custom' },
]

export const analyticsMetricsByRange: Record<AnalyticsTimeRange, AnalyticsMetric[]> = {
  today: [
    {
      label: 'Total Bookings',
      value: '1,247',
      icon: CalendarCheck2,
      trend: '+18%',
      trendDirection: 'up',
    },
    {
      label: 'Avg Occupancy',
      value: '73%',
      icon: Activity,
      trend: '+5%',
      trendDirection: 'up',
    },
    {
      label: 'Total Revenue',
      value: '28,450 JOD',
      icon: DollarSign,
      trend: '+12%',
      trendDirection: 'up',
    },
    {
      label: 'No-Show Rate',
      value: '4.2%',
      icon: UserRoundX,
      trend: '-1.3%',
      trendDirection: 'down',
    },
    {
      label: 'Avg Booking Value',
      value: '22.8 JOD',
      icon: ReceiptText,
      trend: '+2%',
      trendDirection: 'up',
    },
  ],
  week: [
    {
      label: 'Total Bookings',
      value: '6,932',
      icon: CalendarCheck2,
      trend: '+9%',
      trendDirection: 'up',
    },
    {
      label: 'Avg Occupancy',
      value: '69%',
      icon: Activity,
      trend: '+3%',
      trendDirection: 'up',
    },
    {
      label: 'Total Revenue',
      value: '147,120 JOD',
      icon: DollarSign,
      trend: '+10%',
      trendDirection: 'up',
    },
    {
      label: 'No-Show Rate',
      value: '5.1%',
      icon: UserRoundX,
      trend: '-0.6%',
      trendDirection: 'down',
    },
    {
      label: 'Avg Booking Value',
      value: '21.2 JOD',
      icon: ReceiptText,
      trend: '+1.4%',
      trendDirection: 'up',
    },
  ],
  month: [
    {
      label: 'Total Bookings',
      value: '28,410',
      icon: CalendarCheck2,
      trend: '+11%',
      trendDirection: 'up',
    },
    {
      label: 'Avg Occupancy',
      value: '71%',
      icon: Activity,
      trend: '+4%',
      trendDirection: 'up',
    },
    {
      label: 'Total Revenue',
      value: '598,320 JOD',
      icon: DollarSign,
      trend: '+14%',
      trendDirection: 'up',
    },
    {
      label: 'No-Show Rate',
      value: '4.7%',
      icon: UserRoundX,
      trend: '-0.9%',
      trendDirection: 'down',
    },
    {
      label: 'Avg Booking Value',
      value: '22.1 JOD',
      icon: ReceiptText,
      trend: '+1.7%',
      trendDirection: 'up',
    },
  ],
  custom: [
    {
      label: 'Total Bookings',
      value: '3,482',
      icon: CalendarCheck2,
      trend: '+7%',
      trendDirection: 'up',
    },
    {
      label: 'Avg Occupancy',
      value: '67%',
      icon: Activity,
      trend: '+2%',
      trendDirection: 'up',
    },
    {
      label: 'Total Revenue',
      value: '82,900 JOD',
      icon: DollarSign,
      trend: '+6%',
      trendDirection: 'up',
    },
    {
      label: 'No-Show Rate',
      value: '5.5%',
      icon: UserRoundX,
      trend: '-0.2%',
      trendDirection: 'down',
    },
    {
      label: 'Avg Booking Value',
      value: '23.6 JOD',
      icon: ReceiptText,
      trend: '+2.8%',
      trendDirection: 'up',
    },
  ],
}

export const occupancyByCityByRange: Record<AnalyticsTimeRange, CityOccupancyPoint[]> = {
  today: [
    { city: 'Amman', occupancy: 78 },
    { city: 'Irbid', occupancy: 65 },
    { city: 'Zarqa', occupancy: 58 },
    { city: 'Aqaba', occupancy: 71 },
    { city: 'Salt', occupancy: 45 },
    { city: 'Madaba', occupancy: 52 },
  ],
  week: [
    { city: 'Amman', occupancy: 74 },
    { city: 'Irbid', occupancy: 62 },
    { city: 'Zarqa', occupancy: 56 },
    { city: 'Aqaba', occupancy: 67 },
    { city: 'Salt', occupancy: 42 },
    { city: 'Madaba', occupancy: 49 },
  ],
  month: [
    { city: 'Amman', occupancy: 76 },
    { city: 'Irbid', occupancy: 64 },
    { city: 'Zarqa', occupancy: 57 },
    { city: 'Aqaba', occupancy: 69 },
    { city: 'Salt', occupancy: 44 },
    { city: 'Madaba', occupancy: 50 },
  ],
  custom: [
    { city: 'Amman', occupancy: 68 },
    { city: 'Irbid', occupancy: 59 },
    { city: 'Zarqa', occupancy: 53 },
    { city: 'Aqaba', occupancy: 61 },
    { city: 'Salt', occupancy: 40 },
    { city: 'Madaba', occupancy: 47 },
  ],
}

export const serviceUsageByRange: Record<AnalyticsTimeRange, ServiceUsagePoint[]> = {
  today: [
    { name: 'Hot Desk', value: 55, color: '#f97316' },
    { name: 'Private Office', value: 28, color: '#3b82f6' },
    { name: 'Meeting Room', value: 17, color: '#10b981' },
  ],
  week: [
    { name: 'Hot Desk', value: 53, color: '#f97316' },
    { name: 'Private Office', value: 29, color: '#3b82f6' },
    { name: 'Meeting Room', value: 18, color: '#10b981' },
  ],
  month: [
    { name: 'Hot Desk', value: 57, color: '#f97316' },
    { name: 'Private Office', value: 27, color: '#3b82f6' },
    { name: 'Meeting Room', value: 16, color: '#10b981' },
  ],
  custom: [
    { name: 'Hot Desk', value: 51, color: '#f97316' },
    { name: 'Private Office', value: 31, color: '#3b82f6' },
    { name: 'Meeting Room', value: 18, color: '#10b981' },
  ],
}

