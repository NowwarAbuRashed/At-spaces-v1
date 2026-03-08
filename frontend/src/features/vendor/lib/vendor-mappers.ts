import type { NotificationApiItem } from '@/types/api'
import type {
  VendorBookingApiItem,
  VendorBookingApiStatus,
  VendorBranchApiItem,
  VendorBranchDashboardStatus,
  VendorBranchDetailsApiResponse,
  VendorFacilityApiItem,
  VendorPriceUnitApi,
  VendorServiceApiItem,
} from '@/types/vendor-api'
import type {
  VendorBranchDetails,
  VendorFacility,
  VendorPriceUnit,
  VendorService,
} from '@/features/vendor-management/types'
import type { VendorOperationServiceOption, VendorBooking } from '@/features/vendor-operations/types'
import type { VendorRecentBooking } from '@/features/vendor-dashboard/types'
import type { VendorNotification, VendorNotificationCategory } from '@/features/vendor-control/types'
import type { StatusBadgeVariant } from '@/types/ui'

const FALLBACK_MANAGER_NAME = 'Vendor Manager'
const FALLBACK_SUPPORT_PHONE = 'Not available'

const facilityIconMap: Record<string, VendorFacility['iconKey']> = {
  wifi: 'wifi',
  coffee: 'coffee',
  security: 'shield',
  shield: 'shield',
  parking: 'car',
  car: 'car',
  presentation: 'presentation',
  projector: 'presentation',
  gym: 'dumbbell',
  fitness: 'dumbbell',
}

export function mapVendorDashboardStatusToBadge(
  status: VendorBranchDashboardStatus,
): StatusBadgeVariant {
  if (status === 'busy') {
    return 'pending'
  }

  if (status === 'moderate') {
    return 'underReview'
  }

  return 'active'
}

export function mapVendorPriceUnitFromApi(unit: VendorPriceUnitApi): VendorPriceUnit {
  return unit
}

export function mapVendorPriceUnitToApi(unit: VendorPriceUnit): VendorPriceUnitApi {
  return unit
}

function mapAvailabilityStatus(isAvailable: boolean): StatusBadgeVariant {
  return isAvailable ? 'active' : 'paused'
}

function toHHmmLabel(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '--:--'
  }

  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

function toReadableDateTimeWindow(start: string, end: string) {
  const startDate = new Date(start)
  const endDate = new Date(end)

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return 'Unknown time'
  }

  const dateLabel = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(startDate)
  const timeLabel = `${new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(startDate)} - ${new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(endDate)}`

  return `${dateLabel}, ${timeLabel}`
}

function mapBookingStatusToOperations(status: VendorBookingApiStatus): VendorBooking['status'] {
  if (status === 'cancelled') {
    return 'cancelled'
  }

  return status
}

function mapBookingStatusToDashboard(status: VendorBookingApiStatus): VendorRecentBooking['status'] {
  if (status === 'no_show') {
    return 'cancelled'
  }

  return status
}

function mapNotificationCategory(item: NotificationApiItem): VendorNotificationCategory {
  const normalized = `${item.type} ${item.title} ${item.body}`.toLowerCase()

  if (normalized.includes('request') || normalized.includes('capacity') || normalized.includes('approval')) {
    return 'requests'
  }
  if (normalized.includes('security') || normalized.includes('auth') || normalized.includes('login')) {
    return 'security'
  }
  if (normalized.includes('billing') || normalized.includes('payment') || normalized.includes('invoice')) {
    return 'billing'
  }

  return 'operations'
}

function mapFacilityIcon(icon: string | null): VendorFacility['iconKey'] {
  if (!icon) {
    return 'presentation'
  }

  const key = icon.trim().toLowerCase()
  return facilityIconMap[key] ?? 'presentation'
}

export function mapVendorServiceToManagementService(item: VendorServiceApiItem): VendorService {
  return {
    id: String(item.vendorServiceId),
    name: item.name,
    description: `Service ID ${item.serviceId}`,
    status: mapAvailabilityStatus(item.isAvailable),
    pricePerUnit: item.pricePerUnit,
    priceUnit: mapVendorPriceUnitFromApi(item.priceUnit),
    activeCapacity: item.isAvailable ? item.maxCapacity : 0,
    totalCapacity: item.maxCapacity,
    features: [],
  }
}

export function mapVendorServiceToOption(item: VendorServiceApiItem): VendorOperationServiceOption {
  return {
    id: String(item.vendorServiceId),
    name: item.name,
  }
}

export function mapVendorBranchToDetails(
  branch: VendorBranchApiItem,
  options?: {
    occupancyPercent?: number
    todayBookings?: number
    managerName?: string
    supportPhone?: string
  },
): VendorBranchDetails {
  return {
    id: String(branch.id),
    name: branch.name,
    description: '',
    city: branch.city,
    address: branch.address,
    latitude: '',
    longitude: '',
    status: 'active',
    managerName: options?.managerName ?? FALLBACK_MANAGER_NAME,
    supportPhone: options?.supportPhone ?? FALLBACK_SUPPORT_PHONE,
    occupancyPercent: options?.occupancyPercent ?? 0,
    todayBookings: options?.todayBookings ?? 0,
  }
}

export function mapVendorBranchDetailsFromUpdate(
  current: VendorBranchDetails,
  response: VendorBranchDetailsApiResponse,
  options?: {
    occupancyPercent?: number
    todayBookings?: number
    managerName?: string
    supportPhone?: string
  },
): VendorBranchDetails {
  return {
    ...current,
    id: String(response.id),
    name: response.name,
    description: response.description ?? '',
    city: response.city,
    address: response.address,
    latitude: response.latitude === null ? '' : String(response.latitude),
    longitude: response.longitude === null ? '' : String(response.longitude),
    managerName: options?.managerName ?? current.managerName,
    supportPhone: options?.supportPhone ?? current.supportPhone,
    occupancyPercent: options?.occupancyPercent ?? current.occupancyPercent,
    todayBookings: options?.todayBookings ?? current.todayBookings,
  }
}

export function mapVendorFacilityToView(item: VendorFacilityApiItem): VendorFacility {
  return {
    id: String(item.id),
    name: item.name,
    iconKey: mapFacilityIcon(item.icon),
    isAvailable: item.isAvailable,
    description: item.description ?? '',
    details: item.icon ?? 'N/A',
  }
}

export function mapVendorBookingToView(item: VendorBookingApiItem): VendorBooking {
  const startDate = new Date(item.startTime)
  const date = Number.isNaN(startDate.getTime()) ? '' : startDate.toISOString().slice(0, 10)

  return {
    id: String(item.id),
    customerName: item.bookingNumber,
    serviceId: String(item.vendorServiceId),
    date,
    timeRange: `${toHHmmLabel(item.startTime)} - ${toHHmmLabel(item.endTime)}`,
    quantity: item.quantity,
    status: mapBookingStatusToOperations(item.status),
  }
}

export function mapVendorBookingToRecent(
  item: VendorBookingApiItem,
  serviceNameById: Map<number, string>,
): VendorRecentBooking {
  return {
    id: String(item.id),
    customerName: item.bookingNumber,
    serviceName: serviceNameById.get(item.vendorServiceId) ?? `Service #${item.vendorServiceId}`,
    dateTimeLabel: toReadableDateTimeWindow(item.startTime, item.endTime),
    status: mapBookingStatusToDashboard(item.status),
  }
}

export function mapNotificationToVendorView(item: NotificationApiItem): VendorNotification {
  return {
    id: String(item.id),
    title: item.title,
    message: item.body,
    category: mapNotificationCategory(item),
    createdAt: item.createdAt,
    isRead: item.isRead,
  }
}
