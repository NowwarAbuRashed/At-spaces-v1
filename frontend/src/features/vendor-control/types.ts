import type { StatusBadgeVariant, TabItem } from '@/types/ui'

export interface VendorCapacityServiceOption {
  id: string
  name: string
  currentCapacity: number
}

export interface VendorCapacityRequest {
  id: string
  serviceId: string
  currentCapacity: number
  requestedCapacity: number
  reason: string
  requestDate: string
  status: Extract<StatusBadgeVariant, 'pending' | 'approved' | 'rejected' | 'underReview'>
}

export interface VendorCapacityRequestInput {
  serviceId: string
  requestedCapacity: number
  reason: string
}

export type VendorNotificationCategory = 'operations' | 'requests' | 'security' | 'billing'

export interface VendorNotification {
  id: string
  title: string
  message: string
  category: VendorNotificationCategory
  createdAt: string
  isRead: boolean
}

export type VendorNotificationFilterValue = 'all' | 'unread' | VendorNotificationCategory

export type VendorNotificationFilterTab = TabItem<VendorNotificationFilterValue>

export interface VendorProfileSettings {
  fullName: string
  email: string
  phoneNumber: string
}

export interface VendorPreferenceSettings {
  emailAlerts: boolean
  smsAlerts: boolean
  weeklyDigest: boolean
}
