import { Save } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingState } from '@/components/shared/loading-state'
import { PageHeader } from '@/components/shared/page-header'
import { SectionCard } from '@/components/shared/section-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useVendorAuth } from '@/features/auth/store/vendor-auth-context'
import { VendorServiceCard } from '@/features/vendor-management/components'
import type {
  VendorNewServiceFeatureInput,
  VendorPriceUnit,
  VendorService,
} from '@/features/vendor-management/types'
import {
  useUpdateVendorServicePriceMutation,
  useVendorServicesQuery,
} from '@/features/vendor/hooks/use-vendor-queries'
import {
  mapVendorPriceUnitToApi,
  mapVendorServiceToManagementService,
} from '@/features/vendor/lib/vendor-mappers'
import { getInlineApiErrorMessage } from '@/lib/api-error'

const FEATURE_UPDATE_UNAVAILABLE_MESSAGE =
  'Service feature update endpoint is not available yet. Features are currently read-only.'

export function VendorServicesPage() {
  const { accessToken } = useVendorAuth()
  const servicesQuery = useVendorServicesQuery(accessToken)
  const updatePriceMutation = useUpdateVendorServicePriceMutation(accessToken)
  const [services, setServices] = useState<VendorService[]>([])
  const [dirtyServiceIds, setDirtyServiceIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!servicesQuery.data) {
      return
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setServices(servicesQuery.data.items.map(mapVendorServiceToManagementService))
    setDirtyServiceIds(new Set())
  }, [servicesQuery.data])

  const activeServicesCount = useMemo(
    () => services.filter((service) => service.status === 'active').length,
    [services],
  )

  const updateService = (serviceId: string, update: (service: VendorService) => VendorService) => {
    setServices((prev) => prev.map((service) => (service.id === serviceId ? update(service) : service)))
    setDirtyServiceIds((prev) => new Set(prev).add(serviceId))
  }

  const handlePricePerUnitChange = (serviceId: string, pricePerUnit: number) => {
    updateService(serviceId, (service) => ({
      ...service,
      pricePerUnit,
    }))
  }

  const handlePriceUnitChange = (serviceId: string, priceUnit: VendorPriceUnit) => {
    updateService(serviceId, (service) => ({
      ...service,
      priceUnit,
    }))
  }

  const handleUpdateFeatureQuantity = (
    _serviceId: string,
    _featureId: string,
    _quantity: number,
  ) => {
    void _serviceId
    void _featureId
    void _quantity
    toast.info('Feature updates are not supported by backend yet.')
  }

  const handleRemoveFeature = (_serviceId: string, _featureId: string) => {
    void _serviceId
    void _featureId
    toast.info('Feature updates are not supported by backend yet.')
  }

  const handleAddFeature = (_serviceId: string, _input: VendorNewServiceFeatureInput) => {
    void _serviceId
    void _input
    toast.info('Feature updates are not supported by backend yet.')
  }

  const handleSave = async () => {
    if (!dirtyServiceIds.size) {
      toast.info('No pricing changes to save.')
      return
    }

    const changedServices = services.filter((service) => dirtyServiceIds.has(service.id))

    try {
      for (const service of changedServices) {
        const vendorServiceId = Number(service.id)
        if (Number.isNaN(vendorServiceId)) {
          continue
        }

        await updatePriceMutation.mutateAsync({
          vendorServiceId,
          body: {
            pricePerUnit: service.pricePerUnit,
            priceUnit: mapVendorPriceUnitToApi(service.priceUnit),
          },
        })
      }

      setDirtyServiceIds(new Set())
      toast.success(`Updated pricing for ${changedServices.length} service(s).`)
      void servicesQuery.refetch()
    } catch (error) {
      toast.error(getInlineApiErrorMessage(error, 'Failed to update service pricing.', { sessionLabel: 'vendor' }))
    }
  }

  if (servicesQuery.isPending) {
    return <LoadingState label="Loading services..." />
  }

  if (servicesQuery.isError) {
    return (
      <EmptyState
        title="Unable to load vendor services"
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

  if (!services.length) {
    return (
      <EmptyState
        title="No vendor services found"
        description="No services are currently assigned to this vendor account."
      />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Services Management"
        description="Manage service pricing using live vendor APIs. Feature editing remains unavailable until backend support is added."
        actions={
          <>
            <Badge variant="neutral">{activeServicesCount} active services</Badge>
            <Button
              type="button"
              className="gap-2"
              isLoading={updatePriceMutation.isPending}
              onClick={() => {
                void handleSave()
              }}
            >
              <Save className="h-4 w-4" />
              Save Pricing
            </Button>
          </>
        }
      />

      <SectionCard
        title="Vendor Services"
        description="Update price per unit and price unit from backend-connected service records."
      >
        <div className="grid gap-4 xl:grid-cols-2">
          {services.map((service) => (
            <VendorServiceCard
              key={service.id}
              service={service}
              onPricePerUnitChange={handlePricePerUnitChange}
              onPriceUnitChange={handlePriceUnitChange}
              onUpdateFeatureQuantity={handleUpdateFeatureQuantity}
              onRemoveFeature={handleRemoveFeature}
              onAddFeature={handleAddFeature}
              featureControlsDisabled
              featureUnavailableMessage={FEATURE_UPDATE_UNAVAILABLE_MESSAGE}
            />
          ))}
        </div>
      </SectionCard>
    </div>
  )
}
