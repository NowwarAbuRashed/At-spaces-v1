import { Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingState } from '@/components/shared/loading-state'
import { PageHeader } from '@/components/shared/page-header'
import { SectionCard } from '@/components/shared/section-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useVendorAuth } from '@/features/auth/store/vendor-auth-context'
import {
  VendorAvailabilityEditor,
  VendorAvailabilitySlotCard,
} from '@/features/vendor-operations/components'
import type { VendorAvailabilitySlot, VendorAvailabilitySlotInput } from '@/features/vendor-operations/types'
import {
  useUpsertVendorAvailabilityMutation,
  useVendorServicesQuery,
} from '@/features/vendor/hooks/use-vendor-queries'
import { mapVendorServiceToOption } from '@/features/vendor/lib/vendor-mappers'
import { getInlineApiErrorMessage } from '@/lib/api-error'

const DEFAULT_SLOT_START = '09:00'
const DEFAULT_SLOT_END = '10:00'

function createSlotId() {
  return `slot-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
}

export function VendorAvailabilityPage() {
  const { accessToken } = useVendorAuth()
  const servicesQuery = useVendorServicesQuery(accessToken)
  const upsertAvailabilityMutation = useUpsertVendorAvailabilityMutation(accessToken)
  const [slots, setSlots] = useState<VendorAvailabilitySlot[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10))
  const [selectedServiceId, setSelectedServiceId] = useState<'all' | string>('all')
  const [editorMode, setEditorMode] = useState<'add' | 'edit'>('add')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null)
  const [mutatingSlotId, setMutatingSlotId] = useState<string | null>(null)

  const serviceOptions = useMemo(
    () => (servicesQuery.data?.items ?? []).map(mapVendorServiceToOption),
    [servicesQuery.data?.items],
  )

  useEffect(() => {
    if (!serviceOptions.length) {
      setSelectedServiceId('all')
      return
    }

    if (selectedServiceId !== 'all' && !serviceOptions.some((service) => service.id === selectedServiceId)) {
      setSelectedServiceId('all')
    }
  }, [selectedServiceId, serviceOptions])

  const serviceMap = useMemo(
    () => new Map(serviceOptions.map((service) => [service.id, service.name])),
    [serviceOptions],
  )

  const filteredSlots = useMemo(
    () =>
      slots.filter((slot) => {
        const matchesDate = slot.date === selectedDate
        const matchesService = selectedServiceId === 'all' || slot.serviceId === selectedServiceId
        return matchesDate && matchesService
      }),
    [selectedDate, selectedServiceId, slots],
  )

  const slotDates = useMemo(() => {
    const dates = new Set(slots.map((slot) => slot.date))
    dates.add(selectedDate)
    return Array.from(dates).sort()
  }, [selectedDate, slots])

  const editorInitialValue = useMemo<VendorAvailabilitySlotInput>(() => {
    if (editorMode === 'edit' && editingSlotId) {
      const existingSlot = slots.find((slot) => slot.id === editingSlotId)
      if (existingSlot) {
        return {
          date: existingSlot.date,
          serviceId: existingSlot.serviceId,
          startTime: existingSlot.startTime,
          endTime: existingSlot.endTime,
          availableUnits: existingSlot.availableUnits,
          state: existingSlot.state,
        }
      }
    }

    return {
      date: selectedDate,
      serviceId: selectedServiceId === 'all' ? serviceOptions[0]?.id ?? '' : selectedServiceId,
      startTime: DEFAULT_SLOT_START,
      endTime: DEFAULT_SLOT_END,
      availableUnits: 1,
      state: 'active',
    }
  }, [editingSlotId, editorMode, selectedDate, selectedServiceId, serviceOptions, slots])

  const persistGroup = async (nextSlots: VendorAvailabilitySlot[], serviceId: string, date: string) => {
    const vendorServiceId = Number(serviceId)
    if (Number.isNaN(vendorServiceId)) {
      throw new Error('Invalid service selected.')
    }

    const dayServiceSlots = nextSlots.filter((slot) => slot.serviceId === serviceId && slot.date === date)
    if (!dayServiceSlots.length) {
      throw new Error('Backend requires at least one slot for this service/date update.')
    }

    await upsertAvailabilityMutation.mutateAsync({
      vendorServiceId,
      date,
      slots: dayServiceSlots.map((slot) => ({
        start: slot.startTime,
        end: slot.endTime,
        availableUnits: slot.state === 'blocked' ? 0 : slot.availableUnits,
      })),
    })
  }

  const applySlotChange = async (
    buildNext: (current: VendorAvailabilitySlot[]) => VendorAvailabilitySlot[],
    context: {
      serviceId: string
      date: string
      successMessage: string
      slotId?: string | null
    },
  ) => {
    const previousSlots = slots
    const nextSlots = buildNext(previousSlots)
    setSlots(nextSlots)
    setMutatingSlotId(context.slotId ?? null)

    try {
      await persistGroup(nextSlots, context.serviceId, context.date)
      toast.success(context.successMessage)
    } catch (error) {
      setSlots(previousSlots)
      toast.error(getInlineApiErrorMessage(error, 'Failed to update availability.', { sessionLabel: 'vendor' }))
    } finally {
      setMutatingSlotId(null)
    }
  }

  const handleOpenAdd = () => {
    setEditorMode('add')
    setEditingSlotId(null)
    setEditorOpen(true)
  }

  const handleOpenEdit = (slotId: string) => {
    setEditorMode('edit')
    setEditingSlotId(slotId)
    setEditorOpen(true)
  }

  const handleSaveSlot = (input: VendorAvailabilitySlotInput) => {
    const slotId = editorMode === 'edit' ? editingSlotId : createSlotId()
    if (!slotId) {
      return
    }

    const nextSlot: VendorAvailabilitySlot = {
      id: slotId,
      date: input.date,
      serviceId: input.serviceId,
      startTime: input.startTime,
      endTime: input.endTime,
      availableUnits: input.availableUnits,
      state: input.state,
    }

    void applySlotChange(
      (current) => {
        if (editorMode === 'edit') {
          return current.map((slot) => (slot.id === slotId ? nextSlot : slot))
        }

        return [...current, nextSlot]
      },
      {
        serviceId: input.serviceId,
        date: input.date,
        successMessage: editorMode === 'edit' ? 'Availability slot updated.' : 'Availability slot created.',
        slotId,
      },
    )

    setEditorOpen(false)
  }

  const handleRemoveSlot = (slotId: string) => {
    const target = slots.find((slot) => slot.id === slotId)
    if (!target) {
      return
    }

    void applySlotChange(
      (current) => current.filter((slot) => slot.id !== slotId),
      {
        serviceId: target.serviceId,
        date: target.date,
        successMessage: 'Availability slot removed.',
        slotId,
      },
    )
  }

  const handleToggleSlotState = (slotId: string) => {
    const target = slots.find((slot) => slot.id === slotId)
    if (!target) {
      return
    }

    void applySlotChange(
      (current) =>
        current.map((slot) =>
          slot.id === slotId
            ? {
                ...slot,
                state: slot.state === 'active' ? 'blocked' : 'active',
                availableUnits: slot.state === 'active' ? 0 : Math.max(1, slot.availableUnits),
              }
            : slot,
        ),
      {
        serviceId: target.serviceId,
        date: target.date,
        successMessage: 'Availability slot state updated.',
        slotId,
      },
    )
  }

  if (servicesQuery.isPending) {
    return <LoadingState label="Loading services..." />
  }

  if (servicesQuery.isError) {
    return (
      <EmptyState
        title="Unable to load availability settings"
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

  if (!serviceOptions.length) {
    return (
      <EmptyState
        title="No services available"
        description="Availability requires at least one vendor service."
      />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Availability Management"
        description="Manage booking slot windows, available units, and active/blocked slot states."
        actions={
          <>
            <Badge variant="neutral">{filteredSlots.length} slots for selected filters</Badge>
            <Badge variant="subtle">Read endpoint unavailable</Badge>
            <Button type="button" className="gap-2" onClick={handleOpenAdd}>
              <Plus className="h-4 w-4" />
              Add Slot
            </Button>
          </>
        }
      />

      <SectionCard
        title="Availability Filters"
        description="Filter by date and service to focus on specific slot windows."
      >
        <div className="grid gap-3 md:grid-cols-3">
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-app-muted">Date</span>
            <Input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-app-muted">Date Presets</span>
            <select
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="h-11 rounded-xl border border-app-border bg-app-surface-alt px-3 text-sm font-medium text-app-text outline-none transition-all focus:border-app-accent/60 focus:ring-2 focus:ring-app-accent/30"
            >
              {slotDates.map((dateValue) => (
                <option key={dateValue} value={dateValue}>
                  {dateValue}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-app-muted">Service</span>
            <select
              value={selectedServiceId}
              onChange={(event) => setSelectedServiceId(event.target.value)}
              className="h-11 rounded-xl border border-app-border bg-app-surface-alt px-3 text-sm font-medium text-app-text outline-none transition-all focus:border-app-accent/60 focus:ring-2 focus:ring-app-accent/30"
            >
              <option value="all">All Services</option>
              {serviceOptions.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </SectionCard>

      {filteredSlots.length ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredSlots.map((slot) => (
            <VendorAvailabilitySlotCard
              key={slot.id}
              slot={slot}
              serviceName={serviceMap.get(slot.serviceId) ?? 'Service'}
              onEdit={handleOpenEdit}
              onRemove={handleRemoveSlot}
              onToggleState={handleToggleSlotState}
              isUpdating={upsertAvailabilityMutation.isPending && mutatingSlotId === slot.id}
            />
          ))}
        </section>
      ) : (
        <EmptyState
          title="No local slots yet"
          description="Backend availability read endpoint is not available. Add slots to upsert new availability."
          action={
            <Button type="button" variant="outline" onClick={handleOpenAdd}>
              Create First Slot
            </Button>
          }
        />
      )}

      <VendorAvailabilityEditor
        open={editorOpen}
        mode={editorMode}
        services={serviceOptions}
        initialValue={editorInitialValue}
        onClose={() => setEditorOpen(false)}
        onSubmit={handleSaveSlot}
        isSubmitting={upsertAvailabilityMutation.isPending}
      />
    </div>
  )
}
