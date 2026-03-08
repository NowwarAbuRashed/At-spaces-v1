import { Pencil, Trash2 } from 'lucide-react'
import { StatusBadge } from '@/components/shared/status-badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { VendorAvailabilitySlot } from '@/features/vendor-operations/types'

export interface VendorAvailabilitySlotCardProps {
  slot: VendorAvailabilitySlot
  serviceName: string
  onEdit: (slotId: string) => void
  onRemove: (slotId: string) => void
  onToggleState: (slotId: string) => void
}

export function VendorAvailabilitySlotCard({
  slot,
  serviceName,
  onEdit,
  onRemove,
  onToggleState,
}: VendorAvailabilitySlotCardProps) {
  return (
    <Card className="h-full">
      <CardContent className="space-y-4 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-app-text">{serviceName}</p>
            <p className="mt-1 text-sm text-app-muted">
              {slot.startTime} - {slot.endTime}
            </p>
          </div>
          <StatusBadge status={slot.state === 'active' ? 'active' : 'paused'} />
        </div>

        <div className="inline-flex items-center gap-2">
          <Badge variant="neutral">Units: {slot.availableUnits}</Badge>
          <Badge variant={slot.state === 'active' ? 'success' : 'warning'}>{slot.state}</Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="secondary" className="gap-1.5" onClick={() => onEdit(slot.id)}>
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onToggleState(slot.id)}
          >
            {slot.state === 'active' ? 'Block Slot' : 'Activate Slot'}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="gap-1.5 text-app-danger hover:text-app-danger"
            onClick={() => onRemove(slot.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
