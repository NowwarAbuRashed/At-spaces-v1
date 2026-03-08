import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/status-badge'
import { VendorPriceEditor } from '@/features/vendor-management/components/vendor-price-editor'
import { VendorServiceFeaturesEditor } from '@/features/vendor-management/components/vendor-service-features-editor'
import type {
  VendorNewServiceFeatureInput,
  VendorPriceUnit,
  VendorService,
} from '@/features/vendor-management/types'

export interface VendorServiceCardProps {
  service: VendorService
  onPricePerUnitChange: (serviceId: string, pricePerUnit: number) => void
  onPriceUnitChange: (serviceId: string, priceUnit: VendorPriceUnit) => void
  onUpdateFeatureQuantity: (serviceId: string, featureId: string, quantity: number) => void
  onRemoveFeature: (serviceId: string, featureId: string) => void
  onAddFeature: (serviceId: string, input: VendorNewServiceFeatureInput) => void
}

export function VendorServiceCard({
  service,
  onPricePerUnitChange,
  onPriceUnitChange,
  onUpdateFeatureQuantity,
  onRemoveFeature,
  onAddFeature,
}: VendorServiceCardProps) {
  const availabilityPercent = Math.round((service.activeCapacity / service.totalCapacity) * 100)

  return (
    <Card className="h-full">
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{service.name}</CardTitle>
            <p className="mt-1 text-sm text-app-muted">{service.description}</p>
          </div>
          <StatusBadge status={service.status} />
        </div>

        <div className="inline-flex items-center gap-2">
          <Badge variant="neutral">
            Capacity: {service.activeCapacity}/{service.totalCapacity}
          </Badge>
          <Badge variant="subtle">{availabilityPercent}% available</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <VendorPriceEditor
          pricePerUnit={service.pricePerUnit}
          priceUnit={service.priceUnit}
          onPricePerUnitChange={(value) => onPricePerUnitChange(service.id, value)}
          onPriceUnitChange={(value) => onPriceUnitChange(service.id, value)}
        />

        <div className="rounded-xl border border-app-border bg-app-surface-alt/30 p-3">
          <p className="mb-2 text-sm font-semibold text-app-text">Service Features</p>
          <VendorServiceFeaturesEditor
            features={service.features}
            onUpdateQuantity={(featureId, quantity) => onUpdateFeatureQuantity(service.id, featureId, quantity)}
            onRemoveFeature={(featureId) => onRemoveFeature(service.id, featureId)}
            onAddFeature={(input) => onAddFeature(service.id, input)}
          />
        </div>
      </CardContent>
    </Card>
  )
}
