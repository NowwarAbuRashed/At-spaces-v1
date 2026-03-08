import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingState } from '@/components/shared/loading-state'
import { PageHeader } from '@/components/shared/page-header'
import { SectionCard } from '@/components/shared/section-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useVendorAuth } from '@/features/auth/store/vendor-auth-context'
import { VendorRequestCard, VendorRequestForm } from '@/features/vendor-control/components'
import type { VendorCapacityRequest } from '@/features/vendor-control/types'
import {
  useCreateVendorCapacityRequestMutation,
  useVendorServicesQuery,
} from '@/features/vendor/hooks/use-vendor-queries'
import { getInlineApiErrorMessage } from '@/lib/api-error'

function mapCapacityRequestStatus(status: string): VendorCapacityRequest['status'] {
  if (status === 'approved') {
    return 'approved'
  }

  if (status === 'rejected') {
    return 'rejected'
  }

  return 'pending'
}

export function VendorRequestsPage() {
  const { accessToken } = useVendorAuth()
  const servicesQuery = useVendorServicesQuery(accessToken)
  const createRequestMutation = useCreateVendorCapacityRequestMutation(accessToken)
  const [requests, setRequests] = useState<VendorCapacityRequest[]>([])
  const [submissionError, setSubmissionError] = useState<string | null>(null)

  const serviceOptions = useMemo(
    () =>
      (servicesQuery.data?.items ?? []).map((service) => ({
        id: String(service.vendorServiceId),
        name: service.name,
        currentCapacity: service.maxCapacity,
      })),
    [servicesQuery.data?.items],
  )

  const serviceMap = useMemo(
    () => new Map(serviceOptions.map((service) => [service.id, service.name])),
    [serviceOptions],
  )

  const openRequestsCount = useMemo(
    () =>
      requests.filter((request) => request.status === 'pending' || request.status === 'underReview')
        .length,
    [requests],
  )

  const handleCreateRequest = async ({
    serviceId,
    requestedCapacity,
    reason,
    currentCapacity,
  }: {
    serviceId: string
    requestedCapacity: number
    reason: string
    currentCapacity: number
  }) => {
    const vendorServiceId = Number(serviceId)
    if (Number.isNaN(vendorServiceId)) {
      setSubmissionError('Invalid service selected.')
      throw new Error('Invalid service selected.')
    }

    try {
      setSubmissionError(null)
      const response = await createRequestMutation.mutateAsync({
        vendorServiceId,
        body: {
          newCapacity: requestedCapacity,
          reason,
        },
      })

      const request: VendorCapacityRequest = {
        id: String(response.requestId),
        serviceId,
        currentCapacity,
        requestedCapacity,
        reason,
        requestDate: new Date().toISOString().slice(0, 10),
        status: mapCapacityRequestStatus(response.status),
      }

      setRequests((prev) => [request, ...prev])
      toast.success('Capacity request submitted.')
    } catch (error) {
      const message = getInlineApiErrorMessage(error, 'Failed to submit capacity request.', {
        sessionLabel: 'vendor',
      })
      setSubmissionError(message)
      toast.error(message)
      throw error
    }
  }

  if (servicesQuery.isPending) {
    return <LoadingState label="Loading request form..." />
  }

  if (servicesQuery.isError) {
    return (
      <EmptyState
        title="Unable to load request form"
        description={getInlineApiErrorMessage(servicesQuery.error, 'Please retry in a moment.', {
          sessionLabel: 'vendor',
        })}
        action={
          <Button variant="outline" onClick={() => void servicesQuery.refetch()}>
            Retry
          </Button>
        }
      />
    )
  }

  if (!serviceOptions.length) {
    return (
      <EmptyState
        title="No services available for requests"
        description="Capacity requests require at least one active vendor service."
      />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Capacity Requests"
        description="Submit service capacity changes and track responses for requests submitted from this workspace session."
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="neutral">{openRequestsCount} open requests</Badge>
            <Badge variant="subtle">History endpoint unavailable</Badge>
          </div>
        }
      />

      <section className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <SectionCard
          title="Create Capacity Request"
          description="Select a service, enter the requested capacity, and provide an operational reason."
        >
          <VendorRequestForm
            services={serviceOptions}
            onSubmit={handleCreateRequest}
            isSubmitting={createRequestMutation.isPending}
            externalError={submissionError}
          />
        </SectionCard>

        <SectionCard
          title="Request History"
          description="Backend request-history endpoint is not yet available. Showing requests submitted in this session."
        >
          {requests.length ? (
            <div className="space-y-3">
              {requests.map((request) => (
                <VendorRequestCard
                  key={request.id}
                  request={request}
                  serviceName={serviceMap.get(request.serviceId) ?? 'Service'}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No submitted requests in this session"
              description="Submit a capacity request to populate this list."
            />
          )}
        </SectionCard>
      </section>
    </div>
  )
}
