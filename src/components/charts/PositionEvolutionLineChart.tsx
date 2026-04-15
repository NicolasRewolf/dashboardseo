import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { useChartPalette } from '@/hooks/use-chart-palette'
import type { DailyTrendPoint } from '@/types/bi'

export interface PositionEvolutionSeries {
  id: string
  label: string
  points: DailyTrendPoint[]
  /** Couleur optionnelle (token CSS). */
  color?: string
}

function mergeSeriesForChart(series: PositionEvolutionSeries[]): Record<string, string | number>[] {
  const dates = new Set<string>()
  for (const s of series) {
    for (const p of s.points) dates.add(p.date)
  }
  const sorted = [...dates].sort((a, b) => a.localeCompare(b))
  return sorted.map((date) => {
    const row: Record<string, string | number> = { date }
    for (const s of series) {
      const pt = s.points.find((x) => x.date === date)
      row[s.id] = pt ? pt.position : Number.NaN
    }
    return row
  })
}

export function PositionEvolutionLineChart({
  series,
  xLabel,
}: {
  series: PositionEvolutionSeries[]
  xLabel: string
}) {
  const p = useChartPalette()
  const data = mergeSeriesForChart(series)
  const palette = [
    'var(--color-accent)',
    'var(--color-info)',
    'var(--color-success)',
    'var(--color-warning)',
    'var(--color-danger)',
  ]

  if (data.length === 0) {
    return <p className="text-xs text-muted-foreground">Pas de série temporelle.</p>
  }

  return (
    <div className="h-[min(40vh,320px)] w-full min-h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 8, left: 8 }}>
          <CartesianGrid stroke={p.grid} strokeOpacity={0.45} strokeDasharray="3 6" />
          <XAxis
            dataKey="date"
            tick={{ fill: p.tick, fontSize: 9 }}
            tickLine={{ stroke: p.grid }}
            axisLine={{ stroke: p.grid }}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis
            domain={['auto', 'auto']}
            reversed
            tick={{ fill: p.tick, fontSize: 10 }}
            tickLine={{ stroke: p.grid }}
            axisLine={{ stroke: p.grid }}
            tickFormatter={(v: number) => (Number.isFinite(v) ? String(Math.round(v * 10) / 10) : '')}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null
              return (
                <div
                  className="rounded-[var(--radius-md)] border px-3 py-2 text-xs shadow-md"
                  style={{
                    background: 'var(--color-surface)',
                    borderColor: 'var(--color-border)',
                  }}
                >
                  <p className="mb-1 font-mono text-[10px] text-muted-foreground">{label}</p>
                  {payload.map((item) => (
                    <p key={String(item.name)} className="font-mono text-[11px] text-foreground">
                      {item.name}: {typeof item.value === 'number' && Number.isFinite(item.value) ? item.value.toFixed(2) : '—'}
                    </p>
                  ))}
                </div>
              )
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {series.map((s, i) => (
            <Line
              key={s.id}
              type="monotone"
              dataKey={s.id}
              name={s.label}
              stroke={s.color ?? palette[i % palette.length]}
              strokeWidth={2}
              dot={false}
              connectNulls
              isAnimationActive
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <p className="mt-1 text-center text-[9px] text-muted-foreground">{xLabel}</p>
    </div>
  )
}
