import { Cell, Pie, PieChart, Tooltip } from 'recharts'
import { ChartContainer } from '@/components/shared/chart-container'
import type { ServiceUsagePoint } from '@/features/analytics/types'

export interface ServiceUsageChartProps {
  data: ServiceUsagePoint[]
}

export function ServiceUsageChart({ data }: ServiceUsageChartProps) {
  return (
    <ChartContainer>
      {({ width, height }) => (
        <PieChart width={width} height={height}>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="48%"
            innerRadius={70}
            outerRadius={110}
            strokeWidth={2}
            stroke="rgba(11,23,48,1)"
            paddingAngle={1}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'rgba(8,20,42,0.98)',
              border: '1px solid rgba(30,45,74,1)',
              borderRadius: '12px',
              color: 'rgba(248,250,252,1)',
            }}
          />
        </PieChart>
      )}
    </ChartContainer>
  )
}
