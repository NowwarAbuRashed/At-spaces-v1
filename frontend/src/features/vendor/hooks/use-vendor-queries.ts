import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createVendorCapacityRequest,
  getVendorDashboard,
  getVendorService,
  listVendorBookings,
  listVendorBranches,
  listVendorServices,
  updateVendorBookingStatus,
  updateVendorBranch,
  updateVendorServicePrice,
  upsertVendorAvailability,
} from '@/api/vendor-api'
import { listNotifications, markNotificationRead } from '@/api/notifications-api'
import { getMe, updateMe } from '@/api/users-api'
import type {
  VendorAvailabilityUpsertRequest,
  VendorServicePriceUpdateRequest,
} from '@/types/vendor-api'

const VENDOR_DEFAULT_LIMIT = 50

export const vendorQueryKeys = {
  dashboard: (accessToken: string) => ['vendor', 'dashboard', accessToken] as const,
  branches: (accessToken: string) => ['vendor', 'branches', accessToken] as const,
  services: (accessToken: string, branchId?: number) =>
    ['vendor', 'services', accessToken, branchId ?? 'all'] as const,
  service: (accessToken: string, vendorServiceId: number) =>
    ['vendor', 'service', accessToken, vendorServiceId] as const,
  bookings: (accessToken: string, date?: string) =>
    ['vendor', 'bookings', accessToken, date ?? 'all'] as const,
  notifications: (accessToken: string) => ['vendor', 'notifications', accessToken] as const,
  profile: (accessToken: string) => ['vendor', 'profile', accessToken] as const,
} as const

export function useVendorDashboardQuery(accessToken: string | null) {
  return useQuery({
    queryKey: ['vendor', 'dashboard', accessToken],
    queryFn: () => getVendorDashboard({ accessToken: accessToken! }),
    enabled: Boolean(accessToken),
    retry: false,
  })
}

export function useVendorBranchesQuery(accessToken: string | null) {
  return useQuery({
    queryKey: ['vendor', 'branches', accessToken],
    queryFn: () => listVendorBranches({ accessToken: accessToken! }),
    enabled: Boolean(accessToken),
    retry: false,
  })
}

export function useVendorServicesQuery(accessToken: string | null, branchId?: number) {
  return useQuery({
    queryKey: ['vendor', 'services', accessToken, branchId ?? 'all'],
    queryFn: () => listVendorServices({ accessToken: accessToken!, branchId, limit: VENDOR_DEFAULT_LIMIT }),
    enabled: Boolean(accessToken),
    retry: false,
  })
}

export function useVendorServiceDetailsQuery(
  accessToken: string | null,
  vendorServiceId: number | null,
) {
  return useQuery({
    queryKey: ['vendor', 'service', accessToken, vendorServiceId],
    queryFn: () => getVendorService({ accessToken: accessToken!, vendorServiceId: vendorServiceId! }),
    enabled: Boolean(accessToken) && typeof vendorServiceId === 'number',
    retry: false,
  })
}

export function useVendorBookingsQuery(accessToken: string | null, date?: string) {
  return useQuery({
    queryKey: ['vendor', 'bookings', accessToken, date ?? 'all'],
    queryFn: () => listVendorBookings({ accessToken: accessToken!, date, limit: VENDOR_DEFAULT_LIMIT }),
    enabled: Boolean(accessToken),
    retry: false,
  })
}

export function useVendorNotificationsQuery(accessToken: string | null) {
  return useQuery({
    queryKey: ['vendor', 'notifications', accessToken],
    queryFn: () => listNotifications({ accessToken: accessToken!, limit: VENDOR_DEFAULT_LIMIT }),
    enabled: Boolean(accessToken),
    retry: false,
  })
}

export function useVendorProfileQuery(accessToken: string | null) {
  return useQuery({
    queryKey: ['vendor', 'profile', accessToken],
    queryFn: () => getMe({ accessToken: accessToken! }),
    enabled: Boolean(accessToken),
    retry: false,
  })
}

export function useUpdateVendorBranchMutation(accessToken: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: {
      branchId: number
      body: {
        name: string
        description?: string | null
        city: string
        address: string
        latitude?: number | null
        longitude?: number | null
      }
    }) =>
      updateVendorBranch({
        accessToken: accessToken!,
        branchId: payload.branchId,
        payload: payload.body,
      }),
    onSuccess: () => {
      if (!accessToken) {
        return
      }

      void queryClient.invalidateQueries({ queryKey: vendorQueryKeys.branches(accessToken) })
    },
  })
}

export function useUpdateVendorServicePriceMutation(accessToken: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: {
      vendorServiceId: number
      body: VendorServicePriceUpdateRequest
      branchId?: number
    }) =>
      updateVendorServicePrice({
        accessToken: accessToken!,
        vendorServiceId: payload.vendorServiceId,
        payload: payload.body,
      }),
    onSuccess: (_result, variables) => {
      if (!accessToken) {
        return
      }

      void queryClient.invalidateQueries({
        queryKey: vendorQueryKeys.services(accessToken, variables.branchId),
      })
      void queryClient.invalidateQueries({
        queryKey: vendorQueryKeys.service(accessToken, variables.vendorServiceId),
      })
    },
  })
}

export function useCreateVendorCapacityRequestMutation(accessToken: string | null) {
  return useMutation({
    mutationFn: (payload: {
      vendorServiceId: number
      body: {
        newCapacity: number
        reason: string
      }
    }) =>
      createVendorCapacityRequest({
        accessToken: accessToken!,
        vendorServiceId: payload.vendorServiceId,
        payload: payload.body,
      }),
  })
}

export function useUpsertVendorAvailabilityMutation(accessToken: string | null) {
  return useMutation({
    mutationFn: (payload: VendorAvailabilityUpsertRequest) =>
      upsertVendorAvailability({
        accessToken: accessToken!,
        payload,
      }),
  })
}

export function useUpdateVendorBookingStatusMutation(accessToken: string | null, date?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: { bookingId: number; status: 'completed' | 'no_show' }) =>
      updateVendorBookingStatus({
        accessToken: accessToken!,
        bookingId: payload.bookingId,
        status: payload.status,
      }),
    onSuccess: () => {
      if (!accessToken) {
        return
      }

      void queryClient.invalidateQueries({
        queryKey: vendorQueryKeys.bookings(accessToken, date),
      })
      void queryClient.invalidateQueries({
        queryKey: vendorQueryKeys.dashboard(accessToken),
      })
    },
  })
}

export function useMarkVendorNotificationReadMutation(accessToken: string | null) {
  return useMutation({
    mutationFn: (notificationId: number) =>
      markNotificationRead({ accessToken: accessToken!, id: notificationId }),
  })
}

export function useUpdateVendorProfileMutation(accessToken: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: { fullName: string; email: string }) =>
      updateMe({
        accessToken: accessToken!,
        fullName: payload.fullName,
        email: payload.email,
      }),
    onSuccess: () => {
      if (!accessToken) {
        return
      }

      void queryClient.invalidateQueries({
        queryKey: vendorQueryKeys.profile(accessToken),
      })
    },
  })
}
