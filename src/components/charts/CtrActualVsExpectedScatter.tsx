import { useMemo } from 'react'
import {
  CartesianGrid,
  Cell,
  ComposedChart,
  Label,
  Line,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { useChartPalette } from '@/hooks/use-chart-palette'
import { sampleExpectedCtrCurve } from '@/lib/bi/expected-ctr'
import { formatRatioAsPercent } from '@/lib/format'
import type { SeoAdvancedCtrScatterPoint } from '@/types/bi'

export function CtrActualVsExpectedScatter({ data }: { data: SeoAdvancedCtrScatterPoint[] }) {
  const p = useChartPalette()
  const curve = useMemo(() => sampleExpectedCtrCurve(), [])
  const scatter = useMemo(
    () =>
      data.map((d) => ({
        ...d,
        fill: d.aboveExpected ? 'var(--color-success)' : 'var(--color-danger)',
      })),
    [data]
  )

  if (scatter.length === 0) {
    return <p className="text-xs text-muted-foreground">Pas de points CTR (impressions nulles).</p>
  }

  return (
    <div className="h-[min(44vh,340px)] w-full min-h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart margin={{ top: 8, right: 12, bottom: 28, left: 12 }}>
          <CartesianGrid stroke={p.grid} strokeOpacity={0.45} strokeDasharray="3 6" />
          <XAxis
            type="number"
            dataKey="position"
            domain={[1, 20]}
            allowDecimals
            tick={{ fill: p.tick, fontSize: 10 }}
            tickLine={{ stroke: p.grid }}
            axisLine={{ stroke: p.grid }}
          >
            <Label
              value="Position GSC (1–20)"
              offset={-10}
              position="insideBottom"
              style={{ fill: p.tick, fontSize: 10, fontFamily: 'var(--font-sans)' }}
            />
          </XAxis>
          <YAxis
            type="number"
            domain={[0, 'auto']}
            tickFormatter={(v: number) => formatRatioAsPercent(v, 1)}
            tick={{ fill: p.tick, fontSize: 10 }}
            tickLine={{ stroke: p.grid }}
            axisLine={{ stroke: p.grid }}
          >
            <Label
              value="CTR réel"
              angle={-90}
              position="insideLeft"
              style={{ fill: p.tick, fontSize: 10, fontFamily: 'var(--font-sans)' }}
            />
          </YAxis>
          <Tooltip
            cursor={{ strokeDasharray: '4 4', stroke: p.border }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const d = payload[0]!.payload as (typeof scatter)[0]
              return (
                <div
                  className="max-w-[280px] rounded-[var(--radius-md)] border px-3 py-2 text-xs shadow-md"
                  style={{
                    background: 'var(--color-surface)',
                    borderColor: 'var(--color-border)',
                  }}
                >
                  <p className="line-clamp-2 font-medium" title={d.query}>
                    {d.query}
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                    CTR {formatRatioAsPercent(d.ctrReal, 2)} · pos. {d.position.toFixed(1)}
                  </p>
                </div>
              )
            }}
          />
          <Line
            data={curve}
            type="monotone"
            dataKey="ctr"
            stroke={p.accent}
            strokeWidth={2}
            dot={false}
            name="CTR attendu"
            isAnimationActive={false}
          />
          <Scatter data={scatter} name="CTR réel" isAnimationActive animationDuration={500}>
            {scatter.map((row, i) => (
              <Cell key={row.query + i} fill={row.fill} fillOpacity={0.9} />
            ))}
          </Scatter>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
