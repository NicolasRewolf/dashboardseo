import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { useChartPalette } from '@/hooks/use-chart-palette'
import { cn } from '@/lib/utils'

interface LineConfig {
  key: string
  label?: string
  color?: string
  strokeWidth?: number
  dashed?: boolean
}

interface AreaChartCardProps {
  data: Record<string, unknown>[]
  xKey: string
  lines: LineConfig[]
  height?: number
  className?: string
  showGrid?: boolean
  showLegend?: boolean
  formatter?: (value: number) => string
  /** Libellé court sous l’axe X (ex. « Jour (MM-JJ) »). */
  xAxisLabel?: string
}

function CustomTooltip({
  active,
  payload,
  label,
  formatter,
  tickStrong,
}: {
  active?: boolean
  payload?: { color: string; name: string; value: number; dataKey?: string }[]
  label?: string
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
      <p className="mb-1.5 font-medium" style={{ color: 'var(--color-text-secondary)' }}>
        {label}
      </p>
      <ul className="space-y-1">
        {payload.map((entry) => (
          <li key={String(entry.dataKey ?? entry.name)} className="flex items-center gap-2">
            <span
              className="inline-block size-2 shrink-0 rounded-full"
              style={{ backgroundColor: entry.color }}
              aria-hidden
            />
            <span>
              <span className="text-muted-foreground">{entry.name}</span>
              <span className="ms-1 font-mono tabular-nums" style={{ color: tickStrong }}>
                {formatter ? formatter(Number(entry.value)) : entry.value}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function AreaChartCard({
  data,
  xKey,
  lines,
  height = 240,
  className,
  showGrid = true,
  showLegend = false,
  formatter,
  xAxisLabel,
}: AreaChartCardProps) {
  const p = useChartPalette()
  const n = data.length
  const crowded = n > 14
  const tickAngle = crowded ? -42 : n > 8 ? -28 : 0
  const bottomMargin = crowded ? 52 : n > 8 ? 40 : 28
  const leftMargin = 8

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 12, left: leftMargin, bottom: bottomMargin }}
        >
          <defs>
            {lines.map((line, i) => {
              const color = line.color ?? (i === 0 ? p.accent : p.series2)
              return (
                <linearGradient key={line.key} id={`gradient-${line.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.22} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              )
            })}
          </defs>
          {showGrid && (
            <CartesianGrid
              strokeDasharray="4 4"
              stroke={p.grid}
              strokeOpacity={0.65}
              vertical={false}
            />
          )}
          <XAxis
            dataKey={xKey}
            angle={tickAngle}
            tickMargin={tickAngle ? 10 : 6}
            tick={{
              fontSize: 11,
              fill: p.tick,
              fontFamily: 'var(--font-sans)',
            }}
            height={crowded ? 56 : 36}
            interval={crowded ? 'equidistantPreserveStart' : 'preserveStartEnd'}
            minTickGap={crowded ? 4 : 8}
            axisLine={{ stroke: p.grid }}
            tickLine={false}
            label={
              xAxisLabel
                ? {
                    value: xAxisLabel,
                    position: 'insideBottom',
                    offset: crowded ? -2 : 4,
                    fill: p.muted,
                    fontSize: 10,
                  }
                : undefined
            }
          />
          <YAxis
            tick={{
              fontSize: 11,
              fill: p.tick,
              fontFamily: 'var(--font-sans)',
            }}
            axisLine={false}
            tickLine={false}
            tickFormatter={formatter}
            width={52}
          />
          <Tooltip
            shared
            cursor={{ stroke: p.border, strokeWidth: 1, strokeDasharray: '4 3' }}
            wrapperStyle={{ zIndex: 60, outline: 'none' }}
            content={
              <CustomTooltip formatter={formatter} tickStrong={p.tickStrong} />
            }
          />
          {showLegend && (
            <Legend
              wrapperStyle={{ fontSize: 11, color: p.tick, paddingTop: 4 }}
              formatter={(value) => <span style={{ color: p.tick }}>{value}</span>}
            />
          )}
          {lines.map((line, i) => {
            const color = line.color ?? (i === 0 ? p.accent : p.series2)
            return (
              <Area
                key={line.key}
                type="monotone"
                dataKey={line.key}
                name={line.label ?? line.key}
                stroke={color}
                strokeWidth={line.strokeWidth ?? 2}
                strokeDasharray={line.dashed ? '5 4' : undefined}
                fill={`url(#gradient-${line.key})`}
                dot={false}
                activeDot={{
                  r: 5,
                  strokeWidth: 2,
                  stroke: p.surface,
                  fill: color,
                }}
                isAnimationActive={false}
              />
            )
          })}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
