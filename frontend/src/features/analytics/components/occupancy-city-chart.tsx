import {
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartContainer } from '@/components/shared/chart-container'
import type { CityOccupancyPoint } from '@/features/analytics/types'

export interface OccupancyCityChartProps {
  data: CityOccupancyPoint[]
}

export function OccupancyCityChart({ data }: OccupancyCityChartProps) {
  return (
    <ChartContainer>
      {({ width, height }) => (
        <BarChart width={width} height={height} data={data} barSize={58} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(32,45,72,0.8)" />
          <XAxis
            dataKey="city"
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'rgba(154,168,194,1)', fontSize: 13 }}
          />
          <YAxis
            tickFormatter={(value: number) => `${value}%`}
            domain={[0, 80]}
            ticks={[0, 20, 40, 60, 80]}
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'rgba(154,168,194,1)', fontSize: 13 }}
          />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.02)' }}
            contentStyle={{
              background: 'rgba(8,20,42,0.98)',
              border: '1px solid rgba(30,45,74,1)',
              borderRadius: '12px',
              color: 'rgba(248,250,252,1)',
            }}
          />
          <Bar dataKey="occupancy" fill="#f97316" radius={[8, 8, 0, 0]} />
        </BarChart>
      )}
    </ChartContainer>
  )
}
