import { useMemo } from 'react'
import {
  CartesianGrid,
  Cell,
  Label,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts'

import { useChartPalette } from '@/hooks/use-chart-palette'
import { formatCompact } from '@/lib/format'
import type { SeoAdvancedVolumePositionPoint } from '@/types/bi'

function ctrGapFill(gap: number): string {
  if (gap > 0.03) return 'var(--color-danger)'
  if (gap < -0.02) return 'var(--color-success)'
  return 'var(--color-text-tertiary)'
}

export function VolumePositionCtrGapScatter({ data }: { data: SeoAdvancedVolumePositionPoint[] }) {
  const p = useChartPalette()
  const chartData = useMemo(
    () =>
      data.map((d) => ({
        ...d,
        volumePlot: Math.max(1, d.volume),
      })),
    [data]
  )

  const { posMax, chartMaxX, zRange } = useMemo(() => {
    if (chartData.length === 0) {
      return { posMax: 20, chartMaxX: 100, zRange: [5, 22] as [number, number] }
    }
    const posM = Math.max(...chartData.map((d) => d.position), 1)
    return {
      posMax: Math.min(100, Math.ceil(posM + 2)),
      chartMaxX: Math.max(10, ...chartData.map((d) => d.volumePlot)) * 1.15,
      zRange: [5, 22] as [number, number],
    }
  }, [chartData])

  if (chartData.length === 0) {
    return <p className="text-xs text-muted-foreground">Pas de requêtes avec volume FR pour ce nuage.</p>
  }

  return (
    <div className="h-[min(44vh,340px)] w-full min-h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 8, right: 12, bottom: 36, left: 12 }}>
          <CartesianGrid stroke={p.grid} strokeOpacity={0.45} strokeDasharray="3 6" />
          <XAxis
            type="number"
            dataKey="volumePlot"
            scale="log"
            domain={[1, chartMaxX]}
            tick={{ fill: p.tick, fontSize: 10 }}
            tickLine={{ stroke: p.grid }}
            axisLine={{ stroke: p.grid }}
            tickFormatter={(v: number) => formatCompact(v)}
          >
            <Label
              value="Volume FR / mois (log)"
              offset={-12}
              position="insideBottom"
              style={{ fill: p.tick, fontSize: 10, fontFamily: 'var(--font-sans)' }}
            />
          </XAxis>
          <YAxis
            type="number"
            dataKey="position"
            domain={[1, posMax]}
            reversed
            tick={{ fill: p.tick, fontSize: 10 }}
            tickLine={{ stroke: p.grid }}
            axisLine={{ stroke: p.grid }}
            tickFormatter={(v: number) => String(Math.round(v))}
          >
            <Label
              value="Position GSC (pondérée)"
              angle={-90}
              position="insideLeft"
              style={{ fill: p.tick, fontSize: 10, fontFamily: 'var(--font-sans)' }}
            />
          </YAxis>
          <ZAxis type="number" dataKey="impressions" range={zRange} />
          <Tooltip
            cursor={{ strokeDasharray: '4 4', stroke: p.border, strokeOpacity: 0.75 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const d = payload[0]!.payload as (typeof chartData)[0]
              return (
                <div
                  className="rounded-[var(--radius-md)] border px-3 py-2 text-xs shadow-md"
                  style={{
                    background: 'var(--color-surface)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  <p className="mb-1 line-clamp-2 font-medium" title={d.query}>
                    {d.query}
                  </p>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    ΔCTR bench. {(d.ctrGap * 100).toFixed(2)} pts
                  </p>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    Vol. {formatCompact(d.volume)} · impr. {formatCompact(d.impressions)}
                  </p>
                </div>
              )
            }}
          />
          <Scatter data={chartData} fill={p.accent} isAnimationActive animationDuration={600}>
            {chartData.map((row, i) => (
              <Cell key={row.query + i} fill={ctrGapFill(row.ctrGap)} fillOpacity={0.85} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}
