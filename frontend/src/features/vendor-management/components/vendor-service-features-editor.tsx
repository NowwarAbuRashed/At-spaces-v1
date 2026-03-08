import { Minus, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type {
  VendorNewServiceFeatureInput,
  VendorServiceFeature,
} from '@/features/vendor-management/types'

export interface VendorServiceFeaturesEditorProps {
  features: VendorServiceFeature[]
  onUpdateQuantity: (featureId: string, quantity: number) => void
  onRemoveFeature: (featureId: string) => void
  onAddFeature: (input: VendorNewServiceFeatureInput) => void
  disabled?: boolean
  disabledMessage?: string
}

export function VendorServiceFeaturesEditor({
  features,
  onUpdateQuantity,
  onRemoveFeature,
  onAddFeature,
  disabled = false,
  disabledMessage,
}: VendorServiceFeaturesEditorProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [unitLabel, setUnitLabel] = useState('unit')

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {features.map((feature) => (
          <div
            key={feature.id}
            className="rounded-xl border border-app-border bg-app-surface-alt/55 px-3 py-3"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-app-text">{feature.name}</p>
                <p className="text-sm text-app-muted">{feature.description}</p>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-1 text-xs font-semibold text-app-danger transition-colors hover:text-red-300"
                onClick={() => onRemoveFeature(feature.id)}
                disabled={disabled}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </button>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-app-border text-app-text transition-colors hover:border-app-accent/50"
                onClick={() => onUpdateQuantity(feature.id, Math.max(0, feature.quantity - 1))}
                aria-label={`Decrease quantity for ${feature.name}`}
                disabled={disabled}
              >
                <Minus className="h-4 w-4" />
              </button>
              <p className="min-w-16 text-center text-sm font-semibold text-app-text">
                {feature.quantity} {feature.unitLabel}
              </p>
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-app-border text-app-text transition-colors hover:border-app-accent/50"
                onClick={() => onUpdateQuantity(feature.id, feature.quantity + 1)}
                aria-label={`Increase quantity for ${feature.name}`}
                disabled={disabled}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-dashed border-app-border p-3">
        <p className="text-sm font-semibold text-app-text">Add Mock Feature</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Feature name"
            disabled={disabled}
          />
          <Input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Short description"
            disabled={disabled}
          />
          <Input
            type="number"
            min={1}
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            placeholder="Quantity"
            disabled={disabled}
          />
          <Input
            value={unitLabel}
            onChange={(event) => setUnitLabel(event.target.value)}
            placeholder="Unit label"
            disabled={disabled}
          />
        </div>
        {disabledMessage ? <p className="mt-3 text-xs font-semibold text-app-muted">{disabledMessage}</p> : null}
        <Button
          type="button"
          variant="outline"
          className="mt-3"
          disabled={disabled}
          onClick={() => {
            const parsedQuantity = Number(quantity)
            const nextQuantity = Number.isNaN(parsedQuantity) || parsedQuantity < 1 ? 1 : parsedQuantity

            onAddFeature({
              name: name.trim() || 'New Feature',
              description: description.trim() || 'Mock feature detail',
              quantity: nextQuantity,
              unitLabel: unitLabel.trim() || 'unit',
            })

            setName('')
            setDescription('')
            setQuantity('1')
            setUnitLabel('unit')
          }}
        >
          Add Feature
        </Button>
      </div>
    </div>
  )
}
