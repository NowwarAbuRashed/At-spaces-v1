import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { EmptyState } from '@/components/shared/empty-state'
import { PageHeader } from '@/components/shared/page-header'
import { SectionCard } from '@/components/shared/section-card'
import { Badge } from '@/components/ui/badge'
import { VendorRequestCard, VendorRequestForm } from '@/features/vendor-control/components'
import {
  vendorCapacityRequestsMock,
  vendorCapacityServiceOptionsMock,
} from '@/features/vendor-control/data/vendor-control-mock-data'
import type { VendorCapacityRequest } from '@/features/vendor-control/types'

export function VendorRequestsPage() {
  const [requests, setRequests] = useState<VendorCapacityRequest[]>(vendorCapacityRequestsMock)

  const serviceMap = useMemo(
    () => new Map(vendorCapacityServiceOptionsMock.map((service) => [service.id, service.name])),
    [],
  )

  const openRequestsCount = useMemo(
    () =>
      requests.filter((request) => request.status === 'pending' || request.status === 'underReview')
        .length,
    [requests],
  )

  const handleCreateRequest = ({
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
    const newRequest: VendorCapacityRequest = {
      id: `request-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      serviceId,
      currentCapacity,
      requestedCapacity,
      reason,
      requestDate: new Date().toISOString().slice(0, 10),
      status: 'pending',
    }

    setRequests((prev) => [newRequest, ...prev])
    toast.success('Capacity request submitted to local mock history.')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Capacity Requests"
        description="Submit service capacity changes and track approval history in a mock operational flow."
        actions={
          <Badge variant="neutral">{openRequestsCount} open requests</Badge>
        }
      />

      <section className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <SectionCard
          title="Create Capacity Request"
          description="Select a service, enter the requested capacity, and provide an operational reason."
        >
          <VendorRequestForm
            services={vendorCapacityServiceOptionsMock}
            onSubmit={handleCreateRequest}
          />
        </SectionCard>

        <SectionCard
          title="Request History"
          description="Recent request submissions with current and requested capacity context."
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
              title="No requests yet"
              description="Create a capacity request to start building request history."
            />
          )}
        </SectionCard>
      </section>
    </div>
  )
}
