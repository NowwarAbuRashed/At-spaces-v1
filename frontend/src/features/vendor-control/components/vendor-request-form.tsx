import { type FormEvent, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type {
  VendorCapacityRequestInput,
  VendorCapacityServiceOption,
} from '@/features/vendor-control/types'

export interface VendorRequestFormProps {
  services: VendorCapacityServiceOption[]
  onSubmit: (payload: VendorCapacityRequestInput & { currentCapacity: number }) => void | Promise<void>
  isSubmitting?: boolean
  externalError?: string | null
}

export function VendorRequestForm({
  services,
  onSubmit,
  isSubmitting = false,
  externalError = null,
}: VendorRequestFormProps) {
  const [serviceId, setServiceId] = useState(services[0]?.id ?? '')
  const [requestedCapacity, setRequestedCapacity] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  const selectedService = useMemo(
    () => services.find((service) => service.id === serviceId) ?? services[0] ?? null,
    [serviceId, services],
  )

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!selectedService) {
      setError('Select a valid service.')
      return
    }

    const parsedCapacity = Number(requestedCapacity)
    if (Number.isNaN(parsedCapacity) || parsedCapacity < 0) {
      setError('Requested capacity must be 0 or more.')
      return
    }

    if (!reason.trim()) {
      setError('Reason is required.')
      return
    }

    setError(null)
    try {
      await onSubmit({
        serviceId: selectedService.id,
        requestedCapacity: parsedCapacity,
        reason: reason.trim(),
        currentCapacity: selectedService.currentCapacity,
      })

      setRequestedCapacity('')
      setReason('')
    } catch {
      // Parent handles error messaging from backend failures.
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      <label className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-app-muted">Service</span>
        <select
          value={serviceId}
          onChange={(event) => setServiceId(event.target.value)}
          disabled={isSubmitting}
          className="h-11 w-full rounded-xl border border-app-border bg-app-surface-alt px-3 text-sm font-medium text-app-text outline-none transition-all focus:border-app-accent/60 focus:ring-2 focus:ring-app-accent/30"
        >
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name}
            </option>
          ))}
        </select>
      </label>

      <div className="rounded-xl border border-app-border bg-app-surface-alt/50 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-app-muted">Current Capacity</p>
        <p className="mt-1 text-sm font-semibold text-app-text">
          {selectedService?.currentCapacity ?? 0} units
        </p>
      </div>

      <label className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-app-muted">Requested Capacity</span>
        <Input
          type="number"
          min={0}
          placeholder="Enter requested capacity"
          value={requestedCapacity}
          onChange={(event) => setRequestedCapacity(event.target.value)}
          disabled={isSubmitting}
        />
      </label>

      <label className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-app-muted">Reason</span>
        <textarea
          rows={4}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          disabled={isSubmitting}
          className="w-full rounded-xl border border-app-border bg-app-surface-alt px-3 py-2.5 text-sm text-app-text outline-none transition-all placeholder:text-app-muted/90 focus:border-app-accent/60 focus:ring-2 focus:ring-app-accent/30"
          placeholder="Explain why this capacity change is required..."
        />
      </label>

      {error ? <p className="text-sm font-semibold text-app-danger">{error}</p> : null}
      {!error && externalError ? <p className="text-sm font-semibold text-app-danger">{externalError}</p> : null}

      <Button type="submit" className="w-full sm:w-auto" isLoading={isSubmitting}>
        Submit Capacity Request
      </Button>
    </form>
  )
}
