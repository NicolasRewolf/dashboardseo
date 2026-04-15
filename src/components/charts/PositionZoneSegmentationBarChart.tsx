import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { useChartPalette } from '@/hooks/use-chart-palette'
import { formatCompact, formatNumber } from '@/lib/format'
import type { SeoAdvancedZoneSegment } from '@/types/bi'

export function PositionZoneSegmentationBarChart({ data }: { data: SeoAdvancedZoneSegment[] }) {
  const p = useChartPalette()
  const chartData = data.map((z) => ({
    name: z.label,
    impressions: z.impressions,
    clicks: z.clicks,
    gainIfTop3: z.gainIfTop3,
  }))

  return (
    <div className="h-[min(40vh,320px)] w-full min-h-[240px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
          barGap={4}
          barCategoryGap="18%"
        >
          <CartesianGrid stroke={p.grid} strokeOpacity={0.45} strokeDasharray="3 6" />
          <XAxis
            dataKey="name"
            tick={{ fill: p.tick, fontSize: 10 }}
            tickLine={{ stroke: p.grid }}
            axisLine={{ stroke: p.grid }}
          />
          <YAxis
            tick={{ fill: p.tick, fontSize: 10 }}
            tickLine={{ stroke: p.grid }}
            axisLine={{ stroke: p.grid }}
            tickFormatter={(v: number) => formatCompact(v)}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const row = payload[0]!.payload as (typeof chartData)[0]
              return (
                <div
                  className="rounded-[var(--radius-md)] border px-3 py-2 text-xs shadow-md"
                  style={{
                    background: 'var(--color-surface)',
                    borderColor: 'var(--color-border)',
                  }}
                >
                  <p className="font-medium text-foreground">{row.name}</p>
                  <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                    Impr. {formatCompact(row.impressions)} · Clics {formatCompact(row.clicks)}
                  </p>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    Gain si top 3 (est.) {formatNumber(Math.round(row.gainIfTop3))}
                  </p>
                </div>
              )
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'var(--font-sans)' }} />
          <Bar dataKey="impressions" name="Σ impressions" fill="var(--color-info)" radius={[2, 2, 0, 0]} />
          <Bar dataKey="clicks" name="Σ clics" fill="var(--color-success)" radius={[2, 2, 0, 0]} />
          <Bar dataKey="gainIfTop3" name="Σ gain si top 3" fill="var(--color-warning)" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
