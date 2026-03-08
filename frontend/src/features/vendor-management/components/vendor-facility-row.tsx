import type { LucideIcon } from 'lucide-react'
import { Car, Coffee, Dumbbell, Presentation, ShieldCheck, Wifi } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import type { VendorFacility, VendorFacilityIconKey } from '@/features/vendor-management/types'

const facilityIconMap: Record<VendorFacilityIconKey, LucideIcon> = {
  wifi: Wifi,
  coffee: Coffee,
  shield: ShieldCheck,
  car: Car,
  presentation: Presentation,
  dumbbell: Dumbbell,
}

export interface VendorFacilityRowProps {
  facility: VendorFacility
  onToggleAvailability: (id: string, nextValue: boolean) => void
  onDescriptionChange: (id: string, value: string) => void
  onDetailsChange: (id: string, value: string) => void
}

export function VendorFacilityRow({
  facility,
  onToggleAvailability,
  onDescriptionChange,
  onDetailsChange,
}: VendorFacilityRowProps) {
  const Icon = facilityIconMap[facility.iconKey]

  return (
    <div className="rounded-xl border border-app-border bg-app-surface-alt/45 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-app-surface text-app-accent">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <p className="font-semibold text-app-text">{facility.name}</p>
            <p className="text-xs uppercase tracking-wide text-app-muted">
              {facility.isAvailable ? 'Available' : 'Unavailable'}
            </p>
          </div>
        </div>
        <Switch
          checked={facility.isAvailable}
          onCheckedChange={(checked) => onToggleAvailability(facility.id, checked)}
          label={`${facility.name} availability`}
        />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-app-muted">Description</span>
          <Input
            value={facility.description}
            onChange={(event) => onDescriptionChange(facility.id, event.target.value)}
          />
        </label>
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-app-muted">Details</span>
          <Input value={facility.details} onChange={(event) => onDetailsChange(facility.id, event.target.value)} />
        </label>
      </div>
    </div>
  )
}
