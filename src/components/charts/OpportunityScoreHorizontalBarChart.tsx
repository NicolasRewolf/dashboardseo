import {
  Bar,
  BarChart,
  CartesianGrid,
  Label,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { useChartPalette } from '@/hooks/use-chart-palette'
import { formatCompact, formatNumber } from '@/lib/format'
import type { SeoAdvancedOpportunityRow } from '@/types/bi'

function truncate(s: string, max: number): string {
  if (s.length <= max) return s
  return `${s.slice(0, max - 1)}…`
}

export function OpportunityScoreHorizontalBarChart({ data }: { data: SeoAdvancedOpportunityRow[] }) {
  const p = useChartPalette()
  if (data.length === 0) {
    return <p className="text-xs text-muted-foreground">Pas assez de requêtes avec volume + difficulté.</p>
  }

  const chartData = [...data]
    .sort((a, b) => a.score - b.score)
    .map((r) => ({
      ...r,
      label: truncate(r.query, 42),
    }))

  return (
    <div className="h-[min(52vh,480px)] w-full min-h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={chartData}
          margin={{ top: 8, right: 16, bottom: 8, left: 4 }}
          barCategoryGap="12%"
        >
          <CartesianGrid stroke={p.grid} strokeOpacity={0.35} strokeDasharray="3 6" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fill: p.tick, fontSize: 10 }}
            tickLine={{ stroke: p.grid }}
            axisLine={{ stroke: p.grid }}
          >
            <Label
              value="Score opportunité (0–100)"
              offset={-8}
              position="insideBottom"
              style={{ fill: p.tick, fontSize: 10, fontFamily: 'var(--font-sans)' }}
            />
          </XAxis>
          <YAxis
            type="category"
            dataKey="label"
            width={118}
            tick={{ fill: p.tick, fontSize: 9 }}
            interval={0}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const row = payload[0]!.payload as (typeof chartData)[0]
              return (
                <div
                  className="max-w-[min(92vw,320px)] rounded-[var(--radius-md)] border px-3 py-2 text-xs shadow-md"
                  style={{
                    background: 'var(--color-surface)',
                    borderColor: 'var(--color-border)',
                  }}
                >
                  <p className="font-medium leading-snug" title={row.query}>
                    {row.query}
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                    Score {formatNumber(Math.round(row.score))} · impr. {formatCompact(row.impressions)} · pos.{' '}
                    {row.position.toFixed(1)} · diff. {formatNumber(Math.round(row.difficulty))}
                  </p>
                </div>
              )
            }}
          />
          <Bar dataKey="score" name="Opportunity" fill="var(--color-accent)" radius={[0, 4, 4, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
