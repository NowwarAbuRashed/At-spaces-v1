import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { CustomerPageShell } from '@/components/customer'
import { LoadingState } from '@/components/shared/loading-state'
import { Badge, Button, Card, CardContent } from '@/components/ui'
import {
  CustomerBookingForm,
  CustomerBookingPreviewHeader,
  CustomerBookingSummaryCard,
  CustomerPriceBreakdown,
} from '@/features/customer-booking/components'
import {
  customerPaymentMethodOptions,
  mapBookingFormToPreviewDefaults,
  mapBookingPreviewToPriceBreakdown,
  mapBranchDetailsToCustomerBranch,
  toAvailabilityPayload,
} from '@/features/customer/lib/customer-mappers'
import {
  customerBookingFormSchema,
  type CustomerBookingFormValues,
} from '@/features/customer-booking/schemas'
import { useCustomerAuth } from '@/features/customer-auth/store/customer-auth-context'
import {
  mapPaymentMethodToApi,
  useCreateCustomerBookingMutation,
  useCustomerAvailabilityCheckQuery,
  useCustomerBookingPreviewQuery,
  useCustomerBranchDetailsQuery,
  useCustomerBranchesQuery,
  useCustomerServicesQuery,
} from '@/features/customer/hooks/use-customer-queries'
import { getInlineApiErrorMessage } from '@/lib/api-error'
import { CUSTOMER_ROUTES } from '@/lib/routes'
import type { CustomerBookingPreviewFormState } from '@/types/customer'

function toDateInputValue(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function CustomerBookingPreviewPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { accessToken, isAuthenticated } = useCustomerAuth()
  const requestedBranchId = Number(searchParams.get('branchId'))
  const hasRequestedBranchId = Number.isFinite(requestedBranchId)
  const requestedServiceId = Number(searchParams.get('serviceId'))
  const requestedVendorServiceId = Number(searchParams.get('vendorServiceId'))

  const servicesQuery = useCustomerServicesQuery()
  const branchesQuery = useCustomerBranchesQuery({}, { enabled: !hasRequestedBranchId })
  const fallbackBranchId = hasRequestedBranchId ? null : branchesQuery.data?.items[0]?.id ?? null
  const activeBranchId = Number.isFinite(requestedBranchId) ? requestedBranchId : fallbackBranchId
  const branchDetailsQuery = useCustomerBranchDetailsQuery(activeBranchId)

  const branch = useMemo(() => {
    if (!branchDetailsQuery.data) {
      return null
    }

    return mapBranchDetailsToCustomerBranch(branchDetailsQuery.data, {
      serviceCatalogById: new Map((servicesQuery.data ?? []).map((service) => [service.id, service] as const)),
    })
  }, [branchDetailsQuery.data, servicesQuery.data])

  const selectedService = useMemo(() => {
    if (!branch) {
      return null
    }

    if (Number.isFinite(requestedVendorServiceId)) {
      const byVendorService = branch.services.find(
        (service) => service.vendorServiceId === requestedVendorServiceId,
      )
      if (byVendorService) {
        return byVendorService
      }
    }

    if (Number.isFinite(requestedServiceId)) {
      const byServiceId = branch.services.find((service) => service.serviceId === requestedServiceId)
      if (byServiceId) {
        return byServiceId
      }
    }

    return branch.services[0] ?? null
  }, [branch, requestedServiceId, requestedVendorServiceId])

  const defaultBookingDate = useMemo(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return toDateInputValue(tomorrow)
  }, [])

  const form = useForm<CustomerBookingFormValues>({
    resolver: zodResolver(customerBookingFormSchema),
    defaultValues: {
      bookingDate: defaultBookingDate,
      startTime: '09:00',
      endTime: '10:00',
      quantity: 1,
      paymentMethodId: customerPaymentMethodOptions[0].id,
      notes: '',
    },
  })

  const watchedValues = useWatch({
    control: form.control,
  })
  const normalizedValues = useMemo(
    () => mapBookingFormToPreviewDefaults(watchedValues) as CustomerBookingPreviewFormState,
    [watchedValues],
  )

  const [debouncedValues, setDebouncedValues] = useState(normalizedValues)
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedValues((current) => {
        if (
          current.bookingDate === normalizedValues.bookingDate &&
          current.startTime === normalizedValues.startTime &&
          current.endTime === normalizedValues.endTime &&
          current.quantity === normalizedValues.quantity &&
          current.paymentMethodId === normalizedValues.paymentMethodId &&
          current.notes === normalizedValues.notes
        ) {
          return current
        }

        return normalizedValues
      })
    }, 350)

    return () => {
      window.clearTimeout(timer)
    }
  }, [normalizedValues])

  const availabilityPayload = useMemo(() => {
    if (!selectedService?.vendorServiceId) {
      return null
    }

    return toAvailabilityPayload({
      vendorServiceId: selectedService.vendorServiceId,
      bookingDate: debouncedValues.bookingDate,
      startTime: debouncedValues.startTime,
      endTime: debouncedValues.endTime,
      quantity: debouncedValues.quantity,
    })
  }, [debouncedValues, selectedService])

  const availabilityQuery = useCustomerAvailabilityCheckQuery(availabilityPayload)
  const bookingPreviewQuery = useCustomerBookingPreviewQuery(availabilityPayload)
  const createBookingMutation = useCreateCustomerBookingMutation(accessToken)

  const priceBreakdown = useMemo(
    () => mapBookingPreviewToPriceBreakdown(bookingPreviewQuery.data, normalizedValues.quantity),
    [bookingPreviewQuery.data, normalizedValues.quantity],
  )

  const selection = useMemo(() => {
    if (!branch || !selectedService) {
      return null
    }

    return {
      branchId: branch.id,
      branchName: branch.name,
      city: branch.city,
      district: branch.district,
      addressLine: branch.addressLine,
      serviceId: String(selectedService.vendorServiceId ?? selectedService.id),
      serviceName: selectedService.name,
      serviceCategory: selectedService.category,
      serviceUnit: selectedService.unit,
      serviceUnitPrice: selectedService.price,
    }
  }, [branch, selectedService])

  const isPageLoading =
    (!hasRequestedBranchId && branchesQuery.isLoading) || branchDetailsQuery.isLoading || servicesQuery.isLoading
  const pageError =
    (!hasRequestedBranchId ? branchesQuery.error : null) ??
    branchDetailsQuery.error ??
    servicesQuery.error

  const isSlotUnavailable = availabilityQuery.data?.available === false
  const createDisabled = !availabilityPayload || isSlotUnavailable || !selectedService

  const handleSubmit = form.handleSubmit(async (values) => {
    if (!isAuthenticated || !accessToken) {
      navigate(CUSTOMER_ROUTES.LOGIN, {
        replace: true,
        state: { from: `${location.pathname}${location.search}` },
      })
      return
    }

    if (!selectedService?.vendorServiceId) {
      toast.error('No service is selected for booking.')
      return
    }

    const payload = toAvailabilityPayload({
      vendorServiceId: selectedService.vendorServiceId,
      bookingDate: values.bookingDate,
      startTime: values.startTime,
      endTime: values.endTime,
      quantity: values.quantity,
    })

    if (!payload) {
      form.setError('endTime', {
        type: 'manual',
        message: 'Please provide a valid booking window.',
      })
      return
    }

    try {
      const response = await createBookingMutation.mutateAsync({
        ...payload,
        paymentMethod: mapPaymentMethodToApi(values.paymentMethodId),
      })
      toast.success(`Booking ${response.bookingNumber} created successfully.`)
      navigate(CUSTOMER_ROUTES.MY_BOOKINGS)
    } catch (error) {
      toast.error(getInlineApiErrorMessage(error, 'Booking creation failed.', { sessionLabel: 'user' }))
    }
  })

  if (isPageLoading) {
    return (
      <CustomerPageShell
        eyebrow="Booking Preview"
        title="Loading booking preview"
        description="Fetching branch services and availability context."
        badges={['Live availability']}
      >
        <LoadingState label="Loading booking context..." />
      </CustomerPageShell>
    )
  }

  if (pageError) {
    return (
      <CustomerPageShell
        eyebrow="Booking Preview"
        title="Unable to load booking context"
        description={getInlineApiErrorMessage(pageError, 'Booking preview is currently unavailable.')}
        badges={['Backend response']}
        actions={
          <Link to={CUSTOMER_ROUTES.BRANCHES}>
            <Button type="button" variant="secondary">
              Back to branches
            </Button>
          </Link>
        }
      >
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-app-muted">Please retry after the backend becomes available.</p>
          </CardContent>
        </Card>
      </CustomerPageShell>
    )
  }

  if (!branch || !selection || !selectedService) {
    return (
      <CustomerPageShell
        eyebrow="Booking Preview"
        title="No service available"
        description="Select another branch to continue with booking."
        badges={['Branch service data']}
        actions={
          <Link to={CUSTOMER_ROUTES.BRANCHES}>
            <Button type="button" variant="secondary">
              Back to branches
            </Button>
          </Link>
        }
      >
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-app-muted">
              This branch currently has no bookable services in the backend.
            </p>
          </CardContent>
        </Card>
      </CustomerPageShell>
    )
  }

  const availabilityMessage = (() => {
    if (!availabilityPayload) {
      return 'Set booking date, time, and quantity to run live availability checks.'
    }

    if (availabilityQuery.isLoading || bookingPreviewQuery.isLoading) {
      return 'Checking availability and preview price...'
    }

    if (availabilityQuery.error || bookingPreviewQuery.error) {
      return getInlineApiErrorMessage(
        availabilityQuery.error ?? bookingPreviewQuery.error,
        'Availability preview failed.',
      )
    }

    if (availabilityQuery.data?.available === false) {
      return 'Selected window is unavailable. Adjust the time or quantity.'
    }

    if (availabilityQuery.data?.available) {
      return 'Selected window is available and ready for booking.'
    }

    return 'Availability status is pending.'
  })()

  return (
    <CustomerPageShell
      eyebrow="Booking Preview"
      title="Preview and create your booking"
      description="Review branch and service details, validate inputs, and create a real booking."
      badges={['Live availability check', 'Real booking creation']}
      actions={
        <Link to={CUSTOMER_ROUTES.BRANCHES}>
          <Button type="button" variant="secondary">
            Back to branches
          </Button>
        </Link>
      }
    >
      <CustomerBookingPreviewHeader selection={selection} />

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <Card>
          <CardContent className="space-y-5 pt-6">
            <CustomerBookingForm
              form={form}
              paymentMethods={customerPaymentMethodOptions}
              onSubmit={handleSubmit}
              submitLabel={isAuthenticated ? 'Create booking' : 'Sign in to book'}
              submitDisabled={createDisabled || createBookingMutation.isPending}
            />
            <p className="text-xs text-app-muted">Validation enforces required fields and valid booking windows.</p>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <CustomerBookingSummaryCard
            selection={selection}
            values={normalizedValues}
            paymentMethods={customerPaymentMethodOptions}
          />
          <CustomerPriceBreakdown
            breakdown={priceBreakdown}
            currency={bookingPreviewQuery.data?.currency ?? 'JOD'}
          />
          <Card>
            <CardContent className="flex flex-wrap items-center gap-2 pt-6">
              <Badge variant={isSlotUnavailable ? 'danger' : 'accent'}>
                {isSlotUnavailable ? 'Unavailable' : 'Availability status'}
              </Badge>
              <span className="text-sm text-app-muted">
                {availabilityMessage}
              </span>
            </CardContent>
          </Card>
        </div>
      </div>
    </CustomerPageShell>
  )
}
