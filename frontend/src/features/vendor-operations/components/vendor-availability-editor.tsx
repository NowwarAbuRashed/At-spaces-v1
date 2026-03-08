import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import type {
  VendorAvailabilitySlotInput,
  VendorOperationServiceOption,
} from '@/features/vendor-operations/types'

export interface VendorAvailabilityEditorProps {
  open: boolean
  mode: 'add' | 'edit'
  services: VendorOperationServiceOption[]
  initialValue: VendorAvailabilitySlotInput
  onClose: () => void
  onSubmit: (value: VendorAvailabilitySlotInput) => void
}

function hasInvalidTimeRange(startTime: string, endTime: string) {
  return startTime >= endTime
}

function hasInvalidUnits(value: number) {
  return Number.isNaN(value) || value < 0
}

export function VendorAvailabilityEditor({
  open,
  mode,
  services,
  initialValue,
  onClose,
  onSubmit,
}: VendorAvailabilityEditorProps) {
  const [formState, setFormState] = useState<VendorAvailabilitySlotInput>(initialValue)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    setFormState(initialValue)
    setError(null)
  }, [initialValue, open])

  const handleSave = () => {
    if (hasInvalidTimeRange(formState.startTime, formState.endTime)) {
      setError('Start time must be earlier than end time.')
      return
    }

    if (hasInvalidUnits(formState.availableUnits)) {
      setError('Available units must be 0 or more.')
      return
    }

    setError(null)
    onSubmit(formState)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'add' ? 'Add Availability Slot' : 'Edit Availability Slot'}
      description="Configure slot timing, service scope, and available units. Changes are local in this phase."
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            {mode === 'add' ? 'Add Slot' : 'Save Slot'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-app-text">Date</span>
            <Input
              type="date"
              value={formState.date}
              onChange={(event) => setFormState((prev) => ({ ...prev, date: event.target.value }))}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-app-text">Service</span>
            <select
              value={formState.serviceId}
              onChange={(event) => setFormState((prev) => ({ ...prev, serviceId: event.target.value }))}
              className="h-11 rounded-xl border border-app-border bg-app-surface-alt px-3 text-sm font-medium text-app-text outline-none transition-all focus:border-app-accent/60 focus:ring-2 focus:ring-app-accent/30"
            >
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-app-text">Start Time</span>
            <Input
              type="time"
              value={formState.startTime}
              onChange={(event) => setFormState((prev) => ({ ...prev, startTime: event.target.value }))}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-app-text">End Time</span>
            <Input
              type="time"
              value={formState.endTime}
              onChange={(event) => setFormState((prev) => ({ ...prev, endTime: event.target.value }))}
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-app-text">Available Units</span>
            <Input
              type="number"
              min={0}
              value={String(formState.availableUnits)}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  availableUnits: Number(event.target.value),
                }))
              }
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-app-text">Slot State</span>
            <select
              value={formState.state}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  state: event.target.value as VendorAvailabilitySlotInput['state'],
                }))
              }
              className="h-11 rounded-xl border border-app-border bg-app-surface-alt px-3 text-sm font-medium text-app-text outline-none transition-all focus:border-app-accent/60 focus:ring-2 focus:ring-app-accent/30"
            >
              <option value="active">Active</option>
              <option value="blocked">Blocked</option>
            </select>
          </label>
        </div>

        {error ? <p className="text-sm font-semibold text-app-danger">{error}</p> : null}
      </div>
    </Modal>
  )
}
