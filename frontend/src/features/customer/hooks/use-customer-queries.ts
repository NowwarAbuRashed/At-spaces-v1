import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  cancelCustomerBookingRequest,
  getBackendVersionRequest,
  customerBookingPreviewRequest,
  customerCheckAvailabilityRequest,
  customerCreateBookingRequest,
  customerRecommendRequest,
  getCustomerServiceDetailsRequest,
  exportCustomerBookingCalendarRequest,
  getCustomerBookingDetailsRequest,
  getCustomerBranchDetailsRequest,
  getCustomerProfileRequest,
  listCustomerBranchesRequest,
  listCustomerFeaturesRequest,
  listCustomerFacilitiesRequest,
  listCustomerMyBookingsRequest,
  listCustomerServicesRequest,
  searchCustomerBranchesRequest,
  updateCustomerProfileRequest,
} from '@/api/customer-api'
import type {
  CustomerAvailabilityCheckRequest,
  CustomerCreateBookingRequest,
  CustomerBookingPaymentMethodApi,
} from '@/types/customer-api'

const CUSTOMER_DEFAULT_LIMIT = 20

export const customerQueryKeys = {
  version: ['customer', 'backend-version'] as const,
  services: ['customer', 'services'] as const,
  serviceDetails: (serviceId: number) => ['customer', 'service-details', serviceId] as const,
  features: ['customer', 'features'] as const,
  facilities: ['customer', 'facilities'] as const,
  branches: (params: { city?: string; serviceId?: number; query?: string }) =>
    [
      'customer',
      'branches',
      params.city ?? 'all-cities',
      params.serviceId ?? 'all-services',
      params.query?.trim().toLowerCase() ?? '',
    ] as const,
  branchDetails: (branchId: number) => ['customer', 'branch-details', branchId] as const,
  availability: (payload: CustomerAvailabilityCheckRequest | null) =>
    [
      'customer',
      'availability',
      payload?.vendorServiceId ?? null,
      payload?.startTime ?? null,
      payload?.endTime ?? null,
      payload?.quantity ?? null,
    ] as const,
  bookingPreview: (payload: CustomerAvailabilityCheckRequest | null) =>
    [
      'customer',
      'booking-preview',
      payload?.vendorServiceId ?? null,
      payload?.startTime ?? null,
      payload?.endTime ?? null,
      payload?.quantity ?? null,
    ] as const,
  myBookings: (accessToken: string, page: number, limit: number) =>
    ['customer', 'my-bookings', accessToken, page, limit] as const,
  bookingDetails: (accessToken: string, bookingId: number) =>
    ['customer', 'booking-details', accessToken, bookingId] as const,
  profile: (accessToken: string) => ['customer', 'profile', accessToken] as const,
} as const

export function useCustomerServicesQuery() {
  return useQuery({
    queryKey: customerQueryKeys.services,
    queryFn: listCustomerServicesRequest,
    retry: false,
  })
}

export function useCustomerServiceDetailsQuery(serviceId: number | null) {
  return useQuery({
    queryKey: serviceId === null ? ['customer', 'service-details', 'none'] : customerQueryKeys.serviceDetails(serviceId),
    queryFn: () => getCustomerServiceDetailsRequest(serviceId!),
    enabled: typeof serviceId === 'number',
    retry: false,
  })
}

export function useCustomerFeaturesQuery() {
  return useQuery({
    queryKey: customerQueryKeys.features,
    queryFn: listCustomerFeaturesRequest,
    retry: false,
  })
}

export function useBackendVersionQuery() {
  return useQuery({
    queryKey: customerQueryKeys.version,
    queryFn: getBackendVersionRequest,
    retry: false,
  })
}

export function useCustomerFacilitiesQuery() {
  return useQuery({
    queryKey: customerQueryKeys.facilities,
    queryFn: listCustomerFacilitiesRequest,
    retry: false,
  })
}

export function useCustomerBranchesQuery(
  params: { city?: string; serviceId?: number; query?: string },
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: customerQueryKeys.branches(params),
    queryFn: async () => {
      const queryText = params.query?.trim()
      if (queryText) {
        return searchCustomerBranchesRequest({
          q: queryText,
          page: 1,
          limit: CUSTOMER_DEFAULT_LIMIT,
        })
      }

      return listCustomerBranchesRequest({
        city: params.city,
        serviceId: params.serviceId,
        page: 1,
        limit: CUSTOMER_DEFAULT_LIMIT,
      })
    },
    enabled: options?.enabled ?? true,
    retry: false,
  })
}

export function useCustomerBranchDetailsQuery(branchId: number | null) {
  return useQuery({
    queryKey: ['customer', 'branch-details', branchId],
    queryFn: () => getCustomerBranchDetailsRequest(branchId!),
    enabled: typeof branchId === 'number',
    retry: false,
  })
}

export function useCustomerAvailabilityCheckQuery(payload: CustomerAvailabilityCheckRequest | null) {
  return useQuery({
    queryKey: customerQueryKeys.availability(payload),
    queryFn: () => customerCheckAvailabilityRequest(payload!),
    enabled: Boolean(payload),
    retry: false,
  })
}

export function useCustomerBookingPreviewQuery(payload: CustomerAvailabilityCheckRequest | null) {
  return useQuery({
    queryKey: customerQueryKeys.bookingPreview(payload),
    queryFn: () => customerBookingPreviewRequest(payload!),
    enabled: Boolean(payload),
    retry: false,
  })
}

export function useCreateCustomerBookingMutation(accessToken: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CustomerCreateBookingRequest) =>
      customerCreateBookingRequest({
        accessToken: accessToken!,
        payload,
      }),
    onSuccess: () => {
      if (!accessToken) {
        return
      }

      void queryClient.invalidateQueries({
        queryKey: ['customer', 'my-bookings', accessToken],
      })
    },
  })
}

export function useCustomerMyBookingsQuery(
  accessToken: string | null,
  options?: { page?: number; limit?: number },
) {
  const page = options?.page ?? 1
  const limit = options?.limit ?? CUSTOMER_DEFAULT_LIMIT

  return useQuery({
    queryKey: ['customer', 'my-bookings', accessToken, page, limit],
    queryFn: () =>
      listCustomerMyBookingsRequest({
        accessToken: accessToken!,
        page,
        limit,
      }),
    enabled: Boolean(accessToken),
    retry: false,
  })
}

export function useCustomerBookingDetailsQuery(accessToken: string | null, bookingId: number | null) {
  return useQuery({
    queryKey: ['customer', 'booking-details', accessToken, bookingId],
    queryFn: () =>
      getCustomerBookingDetailsRequest({
        accessToken: accessToken!,
        bookingId: bookingId!,
      }),
    enabled: Boolean(accessToken) && typeof bookingId === 'number',
    retry: false,
  })
}

export function useCancelCustomerBookingMutation(accessToken: string | null, page = 1, limit = CUSTOMER_DEFAULT_LIMIT) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (bookingId: number) =>
      cancelCustomerBookingRequest({
        accessToken: accessToken!,
        bookingId,
      }),
    onSuccess: () => {
      if (!accessToken) {
        return
      }

      void queryClient.invalidateQueries({
        queryKey: ['customer', 'my-bookings', accessToken, page, limit],
      })
    },
  })
}

export function useExportCustomerBookingCalendarMutation(accessToken: string | null) {
  return useMutation({
    mutationFn: (bookingId: number) =>
      exportCustomerBookingCalendarRequest({
        accessToken: accessToken!,
        bookingId,
      }),
  })
}

export function useCustomerProfileQuery(accessToken: string | null) {
  return useQuery({
    queryKey: ['customer', 'profile', accessToken],
    queryFn: () =>
      getCustomerProfileRequest({
        accessToken: accessToken!,
      }),
    enabled: Boolean(accessToken),
    retry: false,
  })
}

export function useUpdateCustomerProfileMutation(accessToken: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: { fullName?: string; email?: string }) =>
      updateCustomerProfileRequest({
        accessToken: accessToken!,
        fullName: payload.fullName,
        email: payload.email,
      }),
    onSuccess: () => {
      if (!accessToken) {
        return
      }

      void queryClient.invalidateQueries({
        queryKey: customerQueryKeys.profile(accessToken),
      })
    },
  })
}

export function useCustomerRecommendationMutation() {
  return useMutation({
    mutationFn: (payload: {
      query: string
      location: string
      time: string
      durationMinutes: number
    }) => customerRecommendRequest(payload),
  })
}

export function mapPaymentMethodToApi(methodId: string): CustomerBookingPaymentMethodApi {
  if (methodId === 'apple_pay') {
    return 'apple_pay'
  }

  if (methodId === 'cash') {
    return 'cash'
  }

  return 'card'
}
