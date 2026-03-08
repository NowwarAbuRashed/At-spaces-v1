import type {
  CustomerAvailabilityCheckRequest,
  CustomerBookingDetailsApiResponse,
  CustomerBookingListApiItem,
  CustomerBookingPreviewResponse,
  CustomerBranchDetailsApiResponse,
  CustomerBranchServiceApiItem,
  CustomerBookingApiStatus,
  CustomerProfileApiResponse,
  CustomerPublicBranchApiItem,
  CustomerPublicFacilityApiItem,
  CustomerPublicServiceApiItem,
} from '@/types/customer-api'
import type {
  CustomerBookingListItem,
  CustomerBookingPreviewFormState,
  CustomerBookingPriceBreakdown,
  CustomerBranch,
  CustomerBranchFacility,
  CustomerBranchService,
  CustomerBranchServiceFilterOption,
  CustomerPaymentMethodOption,
  CustomerProfile,
  CustomerServiceUnit,
} from '@/types/customer'

const DEFAULT_PROFILE_PREFERENCES = {
  preferredCity: 'Riyadh',
  workspacePreference: 'quiet',
  notifications: {
    bookingReminders: true,
    scheduleChanges: true,
    specialOffers: false,
  },
} as const

const DEFAULT_CURRENCY = 'JOD'

export const customerPaymentMethodOptions: CustomerPaymentMethodOption[] = [
  {
    id: 'card',
    label: 'Credit / Debit Card',
    description: 'Pay securely with your saved or new card.',
    feeLabel: 'Supported by backend',
    additionalFee: 0,
  },
  {
    id: 'apple_pay',
    label: 'Apple Pay',
    description: 'Fast one-tap checkout on supported devices.',
    feeLabel: 'Supported by backend',
    additionalFee: 0,
  },
  {
    id: 'cash',
    label: 'Cash',
    description: 'Pay during check-in when available.',
    feeLabel: 'Supported by backend',
    additionalFee: 0,
  },
]

function mapBranchServiceUnit(unit: CustomerBranchServiceApiItem['priceUnit']): CustomerServiceUnit {
  if (unit === 'hour') {
    return 'hour'
  }

  if (unit === 'day') {
    return 'day'
  }

  return 'session'
}

function toDurationLabel(unit: CustomerBranchServiceApiItem['priceUnit']) {
  if (unit === 'hour') {
    return 'Hourly'
  }

  if (unit === 'day') {
    return 'Daily'
  }

  if (unit === 'week') {
    return 'Weekly'
  }

  return 'Monthly'
}

function deriveDistrict(address: string, city: string) {
  const [candidate] = address.split(',').map((part) => part.trim())
  if (!candidate || candidate.toLowerCase() === city.toLowerCase()) {
    return city
  }

  return candidate
}

function mapBranchFacilities(
  facilities: CustomerBranchDetailsApiResponse['facilities'],
): CustomerBranchFacility[] {
  return facilities.map((facility) => ({
    id: String(facility.id),
    name: facility.name,
    description: facility.description ?? 'Facility details are currently unavailable.',
  }))
}

function mapBranchServices(
  services: CustomerBranchDetailsApiResponse['services'],
  serviceCatalogById: Map<number, CustomerPublicServiceApiItem>,
): CustomerBranchService[] {
  return services.map((service) => {
    const serviceCatalog = serviceCatalogById.get(service.serviceId)
    const serviceName = serviceCatalog?.name ?? service.name
    return {
      id: String(service.serviceId),
      serviceId: service.serviceId,
      vendorServiceId: service.vendorServiceId,
      name: serviceName,
      description: `${serviceName} at ${service.pricePerUnit.toFixed(0)} per ${service.priceUnit}.`,
      category: serviceCatalog?.unit ? `Unit: ${serviceCatalog.unit}` : 'Workspace Service',
      price: service.pricePerUnit,
      unit: mapBranchServiceUnit(service.priceUnit),
      durationLabel: toDurationLabel(service.priceUnit),
      capacityLabel: `Up to ${service.maxCapacity} ${service.maxCapacity === 1 ? 'person' : 'people'}`,
    }
  })
}

export function mapBranchDetailsToCustomerBranch(
  details: CustomerBranchDetailsApiResponse,
  options?: {
    serviceCatalogById?: Map<number, CustomerPublicServiceApiItem>
    fallbackFacilities?: CustomerPublicFacilityApiItem[]
  },
): CustomerBranch {
  const serviceCatalogById = options?.serviceCatalogById ?? new Map<number, CustomerPublicServiceApiItem>()
  const facilities =
    details.facilities.length > 0
      ? mapBranchFacilities(details.facilities)
      : (options?.fallbackFacilities ?? []).slice(0, 2).map((facility) => ({
          id: String(facility.id),
          name: facility.name,
          description: 'Facility availability details are available per branch soon.',
        }))

  const services = mapBranchServices(details.services, serviceCatalogById)

  return {
    id: String(details.id),
    name: details.name,
    city: details.city,
    district: deriveDistrict(details.address, details.city),
    addressLine: details.address,
    locationSummary: details.address,
    heroHighlight:
      details.description ??
      `${details.name} offers workspace services in ${details.city}.`,
    rating: 0,
    reviewsCount: 0,
    description:
      details.description ??
      'Branch profile is available. Extended marketing details are not provided by the backend.',
    facilities,
    services,
  }
}

export function mapBranchListItemToCustomerBranchFallback(
  item: CustomerPublicBranchApiItem,
  fallbackService?: CustomerPublicServiceApiItem,
  fallbackFacility?: CustomerPublicFacilityApiItem,
): CustomerBranch {
  const serviceName = fallbackService?.name ?? 'Workspace Service'
  const facilityName = fallbackFacility?.name ?? 'Facility'

  return {
    id: String(item.id),
    name: item.name,
    city: item.city,
    district: deriveDistrict(item.address, item.city),
    addressLine: item.address,
    locationSummary: item.address,
    heroHighlight: `${item.name} is now available for booking.`,
    rating: 0,
    reviewsCount: 0,
    description: 'Branch details are loading.',
    facilities: [
      {
        id: `fallback-facility-${item.id}`,
        name: facilityName,
        description: 'Facility details are loading from the backend.',
      },
    ],
    services: [
      {
        id: String(fallbackService?.id ?? item.id),
        serviceId: fallbackService?.id,
        name: serviceName,
        description: 'Service details are loading from the backend.',
        category: fallbackService?.unit ? `Unit: ${fallbackService.unit}` : 'Workspace Service',
        price: 0,
        unit: 'hour',
        durationLabel: 'TBD',
        capacityLabel: 'Capacity unavailable',
      },
    ],
  }
}

export function buildBranchCityOptions(branches: CustomerBranch[]) {
  return ['All Cities', ...new Set(branches.map((branch) => branch.city))]
}

export function buildBranchServiceOptions(
  branches: CustomerBranch[],
  servicesCatalog: CustomerPublicServiceApiItem[],
): CustomerBranchServiceFilterOption[] {
  const branchCountByService = new Map<string, number>()

  for (const branch of branches) {
    const uniqueServiceIds = new Set(branch.services.map((service) => service.id))
    for (const serviceId of uniqueServiceIds) {
      branchCountByService.set(serviceId, (branchCountByService.get(serviceId) ?? 0) + 1)
    }
  }

  const options = servicesCatalog
    .map((service) => ({
      id: String(service.id),
      label: service.name,
      count: branchCountByService.get(String(service.id)) ?? 0,
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => a.label.localeCompare(b.label))

  return [
    {
      id: 'all',
      label: 'All Services',
      count: branches.length,
    },
    ...options,
  ]
}

function mapApiStatusToUiStatus(status: CustomerBookingApiStatus): CustomerBookingListItem['status'] {
  if (status === 'pending') {
    return 'pending'
  }

  if (status === 'cancelled' || status === 'no_show') {
    return 'cancelled'
  }

  return 'confirmed'
}

export function mapBookingRecordToCustomerBooking(
  listItem: CustomerBookingListApiItem,
  details?: CustomerBookingDetailsApiResponse,
  options?: {
    serviceNameById?: Map<number, string>
    calendarExportedAtByBookingId?: Map<number, string>
  },
): CustomerBookingListItem {
  const rawStatus = listItem.status
  const mappedStatus = mapApiStatusToUiStatus(rawStatus)
  const isCancelled = mappedStatus === 'cancelled'
  const canCancel = !isCancelled && rawStatus !== 'completed'

  return {
    id: String(listItem.id),
    bookingNumber: listItem.bookingNumber,
    branchName: listItem.branchName,
    serviceName:
      details?.vendorServiceId && options?.serviceNameById?.has(details.vendorServiceId)
        ? options.serviceNameById.get(details.vendorServiceId)!
        : details?.vendorServiceId
          ? `Service #${details.vendorServiceId}`
          : 'Service details unavailable',
    startAt: listItem.startTime,
    endAt: listItem.endTime,
    quantity: details?.quantity ?? 1,
    totalPrice: details?.totalPrice ?? 0,
    currency: DEFAULT_CURRENCY,
    status: mappedStatus,
    canCancel,
    canExportCalendar: !isCancelled,
    calendarExportedAt: options?.calendarExportedAtByBookingId?.get(listItem.id) ?? null,
  }
}

export function mapBookingPreviewToPriceBreakdown(
  preview: CustomerBookingPreviewResponse | undefined,
  fallbackQuantity: number,
): CustomerBookingPriceBreakdown {
  const total = preview?.totalPrice ?? 0
  return {
    durationUnits: Math.max(1, fallbackQuantity),
    basePrice: total,
    platformFee: 0,
    paymentFee: 0,
    discount: 0,
    tax: 0,
    total,
  }
}

export function toAvailabilityPayload(
  input: {
    vendorServiceId: number
    bookingDate: string
    startTime: string
    endTime: string
    quantity: number
  },
): CustomerAvailabilityCheckRequest | null {
  const startTime = new Date(`${input.bookingDate}T${input.startTime}:00`)
  const endTime = new Date(`${input.bookingDate}T${input.endTime}:00`)

  if (
    Number.isNaN(startTime.getTime()) ||
    Number.isNaN(endTime.getTime()) ||
    endTime.getTime() <= startTime.getTime()
  ) {
    return null
  }

  return {
    vendorServiceId: input.vendorServiceId,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    quantity: input.quantity,
  }
}

export function getServiceSelection(
  branch: CustomerBranch | null | undefined,
  serviceId: number | null | undefined,
) {
  if (!branch) {
    return null
  }

  if (serviceId !== null && serviceId !== undefined) {
    const matched = branch.services.find((service) => Number(service.id) === serviceId)
    if (matched) {
      return matched
    }
  }

  return branch.services[0] ?? null
}

export function mapProfileApiToCustomerProfile(profile: CustomerProfileApiResponse): CustomerProfile {
  return {
    id: String(profile.id),
    fullName: profile.fullName,
    email: profile.email ?? 'Not provided',
    phone: profile.phoneNumber ?? 'Not provided',
    memberSince: '',
    loyaltyTier: 'Customer Account',
    preferences: {
      preferredCity: DEFAULT_PROFILE_PREFERENCES.preferredCity,
      workspacePreference: DEFAULT_PROFILE_PREFERENCES.workspacePreference,
      notifications: {
        bookingReminders: DEFAULT_PROFILE_PREFERENCES.notifications.bookingReminders,
        scheduleChanges: DEFAULT_PROFILE_PREFERENCES.notifications.scheduleChanges,
        specialOffers: DEFAULT_PROFILE_PREFERENCES.notifications.specialOffers,
      },
    },
  }
}

export function mapBookingFormToPreviewDefaults(values: Partial<CustomerBookingPreviewFormState>) {
  return {
    bookingDate: values.bookingDate ?? '',
    startTime: values.startTime ?? '',
    endTime: values.endTime ?? '',
    quantity:
      typeof values.quantity === 'number' && Number.isFinite(values.quantity)
        ? values.quantity
        : 1,
    paymentMethodId: values.paymentMethodId ?? customerPaymentMethodOptions[0].id,
    notes: values.notes ?? '',
  }
}
