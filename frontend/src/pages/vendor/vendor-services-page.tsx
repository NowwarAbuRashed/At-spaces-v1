import { Save } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/page-header'
import { SectionCard } from '@/components/shared/section-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { VendorServiceCard } from '@/features/vendor-management/components'
import { vendorServicesMock } from '@/features/vendor-management/data/vendor-management-mock-data'
import type {
  VendorNewServiceFeatureInput,
  VendorPriceUnit,
  VendorService,
} from '@/features/vendor-management/types'

export function VendorServicesPage() {
  const [services, setServices] = useState<VendorService[]>(vendorServicesMock)

  const updateService = (serviceId: string, update: (service: VendorService) => VendorService) => {
    setServices((prev) => prev.map((service) => (service.id === serviceId ? update(service) : service)))
  }

  const activeServicesCount = useMemo(
    () => services.filter((service) => service.status === 'active').length,
    [services],
  )

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

  const handleUpdateFeatureQuantity = (serviceId: string, featureId: string, quantity: number) => {
    const safeQuantity = Math.max(0, quantity)
    updateService(serviceId, (service) => ({
      ...service,
      features: service.features.map((feature) =>
        feature.id === featureId ? { ...feature, quantity: safeQuantity } : feature,
      ),
    }))
  }

  const handleRemoveFeature = (serviceId: string, featureId: string) => {
    updateService(serviceId, (service) => ({
      ...service,
      features: service.features.filter((feature) => feature.id !== featureId),
    }))
  }

  const handleAddFeature = (serviceId: string, input: VendorNewServiceFeatureInput) => {
    const featureId = `feature-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`
    updateService(serviceId, (service) => ({
      ...service,
      features: [
        ...service.features,
        {
          id: featureId,
          name: input.name,
          description: input.description,
          quantity: input.quantity,
          unitLabel: input.unitLabel,
        },
      ],
    }))
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Services Management"
        description="Manage service pricing, capacity posture, and attached features with mock-ready controls."
        actions={
          <>
            <Badge variant="neutral">{activeServicesCount} active services</Badge>
            <Button
              type="button"
              className="gap-2"
              onClick={() => toast.success('Service updates saved locally (mock-only in Phase 4).')}
            >
              <Save className="h-4 w-4" />
              Save Pricing & Features
            </Button>
          </>
        }
      />

      <SectionCard
        title="Vendor Services"
        description="Edit price per unit, price unit, and attached feature quantities. No backend calls in this phase."
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
            />
          ))}
        </div>
      </SectionCard>
    </div>
  )
}
