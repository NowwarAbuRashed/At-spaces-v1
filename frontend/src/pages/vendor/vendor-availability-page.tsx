import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { EmptyState } from '@/components/shared/empty-state'
import { PageHeader } from '@/components/shared/page-header'
import { SectionCard } from '@/components/shared/section-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  VendorAvailabilityEditor,
  VendorAvailabilitySlotCard,
} from '@/features/vendor-operations/components'
import {
  vendorAvailabilitySlotsMock,
  vendorOperationServicesMock,
} from '@/features/vendor-operations/data/vendor-operations-mock-data'
import type {
  VendorAvailabilitySlot,
  VendorAvailabilitySlotInput,
} from '@/features/vendor-operations/types'

const DEFAULT_SLOT_START = '09:00'
const DEFAULT_SLOT_END = '10:00'

export function VendorAvailabilityPage() {
  const [slots, setSlots] = useState<VendorAvailabilitySlot[]>(vendorAvailabilitySlotsMock)
  const [selectedDate, setSelectedDate] = useState(vendorAvailabilitySlotsMock[0]?.date ?? '2026-03-08')
  const [selectedServiceId, setSelectedServiceId] = useState<'all' | string>('all')
  const [editorMode, setEditorMode] = useState<'add' | 'edit'>('add')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null)

  const serviceMap = useMemo(
    () => new Map(vendorOperationServicesMock.map((service) => [service.id, service.name])),
    [],
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

  const slotDates = useMemo(() => Array.from(new Set(slots.map((slot) => slot.date))), [slots])

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
      serviceId: selectedServiceId === 'all' ? vendorOperationServicesMock[0]?.id ?? '' : selectedServiceId,
      startTime: DEFAULT_SLOT_START,
      endTime: DEFAULT_SLOT_END,
      availableUnits: 1,
      state: 'active',
    }
  }, [editingSlotId, editorMode, selectedDate, selectedServiceId, slots])

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
    if (editorMode === 'edit' && editingSlotId) {
      setSlots((prev) =>
        prev.map((slot) =>
          slot.id === editingSlotId
            ? {
                ...slot,
                ...input,
              }
            : slot,
        ),
      )
      toast.success('Availability slot updated in local state.')
    } else {
      const newSlot: VendorAvailabilitySlot = {
        id: `slot-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
        ...input,
      }
      setSlots((prev) => [...prev, newSlot])
      toast.success('Availability slot added in local state.')
    }

    setEditorOpen(false)
  }

  const handleRemoveSlot = (slotId: string) => {
    setSlots((prev) => prev.filter((slot) => slot.id !== slotId))
    toast.success('Availability slot removed in local state.')
  }

  const handleToggleSlotState = (slotId: string) => {
    setSlots((prev) =>
      prev.map((slot) =>
        slot.id === slotId
          ? {
              ...slot,
              state: slot.state === 'active' ? 'blocked' : 'active',
            }
          : slot,
      ),
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
              {vendorOperationServicesMock.map((service) => (
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
            />
          ))}
        </section>
      ) : (
        <EmptyState
          title="No slots for selected filters"
          description="Adjust date/service filters or add a new availability slot."
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
        services={vendorOperationServicesMock}
        initialValue={editorInitialValue}
        onClose={() => setEditorOpen(false)}
        onSubmit={handleSaveSlot}
      />
    </div>
  )
}
