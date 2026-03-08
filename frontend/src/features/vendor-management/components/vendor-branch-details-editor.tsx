import { SectionCard } from '@/components/shared/section-card'
import { Input } from '@/components/ui/input'
import type {
  VendorBranchDetails,
  VendorBranchEditableField,
} from '@/features/vendor-management/types'

export interface VendorBranchDetailsEditorProps {
  details: VendorBranchDetails
  onFieldChange: (field: VendorBranchEditableField, value: string) => void
}

export function VendorBranchDetailsEditor({ details, onFieldChange }: VendorBranchDetailsEditorProps) {
  return (
    <SectionCard
      title="Editable Branch Details"
      description="This section is mock-only in Phase 4 and is designed for future API integration."
      className="h-full"
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-app-text">Name</span>
            <Input value={details.name} onChange={(event) => onFieldChange('name', event.target.value)} />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-app-text">City</span>
            <Input value={details.city} onChange={(event) => onFieldChange('city', event.target.value)} />
          </label>
        </div>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-app-text">Description</span>
          <textarea
            value={details.description}
            onChange={(event) => onFieldChange('description', event.target.value)}
            rows={3}
            className="w-full rounded-xl border border-app-border bg-app-surface-alt px-3 py-2.5 text-sm text-app-text outline-none transition-all placeholder:text-app-muted/90 focus:border-app-accent/60 focus:ring-2 focus:ring-app-accent/30"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-app-text">Address</span>
          <Input value={details.address} onChange={(event) => onFieldChange('address', event.target.value)} />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-app-text">Latitude</span>
            <Input
              value={details.latitude}
              onChange={(event) => onFieldChange('latitude', event.target.value)}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-app-text">Longitude</span>
            <Input
              value={details.longitude}
              onChange={(event) => onFieldChange('longitude', event.target.value)}
            />
          </label>
        </div>
      </div>
    </SectionCard>
  )
}
