import { Input } from '@/components/ui/input'
import type { VendorPriceUnit } from '@/features/vendor-management/types'

export interface VendorPriceEditorProps {
  pricePerUnit: number
  priceUnit: VendorPriceUnit
  onPricePerUnitChange: (value: number) => void
  onPriceUnitChange: (value: VendorPriceUnit) => void
}

const priceUnits: VendorPriceUnit[] = ['hour', 'session', 'booking']

export function VendorPriceEditor({
  pricePerUnit,
  priceUnit,
  onPricePerUnitChange,
  onPriceUnitChange,
}: VendorPriceEditorProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
      <label className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-app-muted">Price Per Unit</span>
        <Input
          type="number"
          min={0}
          step={1}
          value={String(pricePerUnit)}
          onChange={(event) => {
            const nextValue = Number(event.target.value)
            onPricePerUnitChange(Number.isNaN(nextValue) ? 0 : nextValue)
          }}
        />
      </label>

      <label className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-app-muted">Price Unit</span>
        <select
          value={priceUnit}
          onChange={(event) => onPriceUnitChange(event.target.value as VendorPriceUnit)}
          className="h-11 rounded-xl border border-app-border bg-app-surface-alt px-3 text-sm font-medium text-app-text outline-none transition-all focus:border-app-accent/60 focus:ring-2 focus:ring-app-accent/30"
        >
          {priceUnits.map((unit) => (
            <option key={unit} value={unit}>
              {unit}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
