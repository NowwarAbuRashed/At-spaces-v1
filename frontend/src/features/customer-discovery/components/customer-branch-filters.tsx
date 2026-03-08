import { Filter } from 'lucide-react'
import { Button } from '@/components/ui'
import type { CustomerBranchServiceFilterOption } from '@/types/customer'

export interface CustomerBranchFiltersProps {
  cityOptions: string[]
  serviceOptions: CustomerBranchServiceFilterOption[]
  selectedCity: string
  selectedServiceId: string
  onCityChange: (city: string) => void
  onServiceChange: (serviceId: string) => void
  onClear: () => void
}

function filterButtonClass(isActive: boolean) {
  return isActive
    ? 'border-app-accent/40 bg-app-accent/15 text-app-accent hover:bg-app-accent/20'
    : 'border-app-border bg-app-surface-alt/70 text-app-muted hover:text-app-text'
}

export function CustomerBranchFilters({
  cityOptions,
  serviceOptions,
  selectedCity,
  selectedServiceId,
  onCityChange,
  onServiceChange,
  onClear,
}: CustomerBranchFiltersProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-app-muted">Filter by city</p>
        <div className="flex flex-wrap gap-2">
          {cityOptions.map((city) => {
            const isActive = selectedCity === city
            return (
              <Button
                key={city}
                type="button"
                variant="outline"
                size="sm"
                className={filterButtonClass(isActive)}
                onClick={() => onCityChange(city)}
              >
                {city}
              </Button>
            )
          })}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-app-muted">Filter by service</p>
        <div className="flex flex-wrap gap-2">
          {serviceOptions.map((service) => {
            const isActive = selectedServiceId === service.id
            return (
              <Button
                key={service.id}
                type="button"
                variant="outline"
                size="sm"
                className={filterButtonClass(isActive)}
                onClick={() => onServiceChange(service.id)}
              >
                {service.label}
              </Button>
            )
          })}
        </div>
      </div>

      <Button type="button" variant="ghost" size="sm" className="inline-flex" onClick={onClear}>
        <Filter className="h-4 w-4" />
        Clear filters
      </Button>
    </div>
  )
}
