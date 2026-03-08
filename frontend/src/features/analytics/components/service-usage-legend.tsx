import type { ServiceUsagePoint } from '@/features/analytics/types'

export interface ServiceUsageLegendProps {
  data: ServiceUsagePoint[]
}

export function ServiceUsageLegend({ data }: ServiceUsageLegendProps) {
  return (
    <div className="mt-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
      {data.map((item) => (
        <div key={item.name} className="inline-flex items-center gap-2 text-sm text-app-muted">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
          <span>
            {item.name} ({item.value}%)
          </span>
        </div>
      ))}
    </div>
  )
}

