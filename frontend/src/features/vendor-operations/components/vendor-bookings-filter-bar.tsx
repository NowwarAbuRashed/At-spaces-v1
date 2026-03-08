import { CalendarDays, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import type {
  VendorBookingStatus,
  VendorBookingStatusOption,
  VendorOperationServiceOption,
} from '@/features/vendor-operations/types'

export interface VendorBookingsFilterBarProps {
  date: string
  onDateChange: (value: string) => void
  status: 'all' | VendorBookingStatus
  onStatusChange: (value: 'all' | VendorBookingStatus) => void
  serviceId: 'all' | string
  onServiceIdChange: (value: 'all' | string) => void
  statusOptions: VendorBookingStatusOption[]
  serviceOptions: VendorOperationServiceOption[]
}

export function VendorBookingsFilterBar({
  date,
  onDateChange,
  status,
  onStatusChange,
  serviceId,
  onServiceIdChange,
  statusOptions,
  serviceOptions,
}: VendorBookingsFilterBarProps) {
  return (
    <div className="grid gap-3 rounded-2xl border border-app-border bg-app-surface/70 p-4 md:grid-cols-[1fr_1fr_1fr]">
      <label className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-app-muted">Date</span>
        <Input
          type="date"
          value={date}
          leftIcon={<CalendarDays className="h-4 w-4" />}
          onChange={(event) => onDateChange(event.target.value)}
        />
      </label>

      <label className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-app-muted">Status</span>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-app-muted">
            <Filter className="h-4 w-4" />
          </span>
          <select
            value={status}
            onChange={(event) => onStatusChange(event.target.value as 'all' | VendorBookingStatus)}
            className="h-11 w-full rounded-xl border border-app-border bg-app-surface-alt pl-10 pr-3 text-sm font-medium text-app-text outline-none transition-all focus:border-app-accent/60 focus:ring-2 focus:ring-app-accent/30"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </label>

      <label className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-app-muted">Service</span>
        <select
          value={serviceId}
          onChange={(event) => onServiceIdChange(event.target.value)}
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
  )
}
