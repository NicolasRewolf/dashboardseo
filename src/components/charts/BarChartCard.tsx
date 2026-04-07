import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { useChartPalette } from '@/hooks/use-chart-palette'
import { cn } from '@/lib/utils'

interface BarConfig {
  key: string
  label?: string
  color?: string
  radius?: number
}

interface BarChartCardProps {
  data: Record<string, unknown>[]
  xKey: string
  bars: BarConfig[]
  height?: number
  className?: string
  showGrid?: boolean
  showLegend?: boolean
  layout?: 'vertical' | 'horizontal'
  formatter?: (value: number) => string
  highlightLast?: boolean
  /** Libellé de l’axe des valeurs (horizontal: ordonnées ; vertical: abscisses numériques). */
  valueAxisLabel?: string
}

function CustomTooltip({
  active,
  payload,
  label,
  formatter,
  tickStrong,
}: {
  active?: boolean
  payload?: { color: string; name: string; value: number }[]
  label?: string | number
  formatter?: (value: number) => string
  tickStrong: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-[var(--radius-md)] border px-3 py-2 text-xs shadow-md"
      style={{
        background: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
        color: tickStrong,
        fontFamily: 'var(--font-sans)',
        zIndex: 50,
      }}
    >
      <p className="mb-1 font-medium" style={{ color: 'var(--color-text-secondary)' }}>
        {label}
      </p>
      {payload.map((e) => (
        <p key={e.name} className="flex items-center gap-2">
          <span
            className="inline-block size-2 shrink-0 rounded-sm"
            style={{ backgroundColor: e.color }}
            aria-hidden
          />
          <span>
            <span className="text-muted-foreground">{e.name}</span>
            <span className="ms-1 font-mono tabular-nums" style={{ color: tickStrong }}>
              {formatter ? formatter(e.value) : e.value}
            </span>
          </span>
        </p>
      ))}
    </div>
  )
}

export function BarChartCard({
  data,
  xKey,
  bars,
  height = 240,
  className,
  showGrid = true,
  showLegend = false,
  layout = 'horizontal',
  formatter,
  highlightLast = false,
  valueAxisLabel,
}: BarChartCardProps) {
  const p = useChartPalette()
  const lastIndex = data.length - 1

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout={layout}
          margin={{
            top: 10,
            right: 12,
            left: layout === 'vertical' ? 4 : 4,
            bottom: layout === 'vertical' ? 28 : 8,
          }}
        >
          {showGrid && (
            <CartesianGrid
              strokeDasharray="4 4"
              stroke={p.grid}
              strokeOpacity={0.65}
              vertical={layout === 'vertical'}
              horizontal={layout === 'horizontal'}
            />
          )}
          {layout === 'horizontal' ? (
            <>
              <XAxis
                dataKey={xKey}
                tick={{ fontSize: 11, fill: p.tick, fontFamily: 'var(--font-sans)' }}
                axisLine={{ stroke: p.grid }}
                tickLine={false}
                interval={0}
              />
              <YAxis
                tick={{ fontSize: 11, fill: p.tick, fontFamily: 'var(--font-sans)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={formatter}
                width={48}
                label={
                  valueAxisLabel
                    ? {
                        value: valueAxisLabel,
                        angle: -90,
                        position: 'insideLeft',
                        fill: p.muted,
                        fontSize: 10,
                      }
                    : undefined
                }
              />
            </>
          ) : (
            <>
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: p.tick, fontFamily: 'var(--font-sans)' }}
                axisLine={{ stroke: p.grid }}
                tickLine={false}
                tickFormatter={formatter}
                label={
                  valueAxisLabel
                    ? {
                        value: valueAxisLabel,
                        position: 'insideBottom',
                        offset: -4,
                        fill: p.muted,
                        fontSize: 10,
                      }
                    : undefined
                }
              />
              <YAxis
                dataKey={xKey}
                type="category"
                tick={{ fontSize: 11, fill: p.tick, fontFamily: 'var(--font-sans)' }}
                axisLine={false}
                tickLine={false}
                width={96}
              />
            </>
          )}
          <Tooltip
            cursor={{ fill: p.grid, fillOpacity: 0.35 }}
            wrapperStyle={{ zIndex: 60, outline: 'none' }}
            content={<CustomTooltip formatter={formatter} tickStrong={p.tickStrong} />}
          />
          {showLegend && <Legend wrapperStyle={{ fontSize: 11, color: p.tick }} />}
          {bars.map((bar, i) => {
            const color = bar.color ?? (i === 0 ? p.accent : p.series2)
            return (
              <Bar
                key={bar.key}
                dataKey={bar.key}
                name={bar.label ?? bar.key}
                fill={color}
                radius={bar.radius ?? 4}
                maxBarSize={layout === 'vertical' ? 48 : 56}
                isAnimationActive={false}
              >
                {highlightLast &&
                  data.map((_, idx) => (
                    <Cell key={`cell-${idx}`} fill={idx === lastIndex ? color : `${color}99`} />
                  ))}
              </Bar>
            )
          })}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
