import { useMemo, useState } from 'react'
import {
  CartesianGrid,
  Label,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts'

import { useChartPalette } from '@/hooks/use-chart-palette'
import {
  computePositionVolumeQuadrantSplit,
  getQuadrantIdForPoint,
  groupPointsByQuadrant,
  POSITION_VOLUME_QUADRANTS,
  type PositionVolumeQuadrantId,
  type PositionVolumeQuadrantSplit,
} from '@/lib/dataforseo/position-volume-quadrants'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCompact, formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { PositionVolumeScatterPoint } from '@/types/bi'

function truncateQuery(s: string, max: number): string {
  if (s.length <= max) return s
  return `${s.slice(0, max - 1)}…`
}

/** Pearson sur les valeurs brutes (symétrique si on échange les axes). */
function pearsonPositionLogVolume(points: PositionVolumeScatterPoint[]): number | null {
  if (points.length < 4) return null
  const xs = points.map((p) => p.position)
  const ys = points.map((p) => Math.log10(Math.max(1, p.volume)))
  const n = xs.length
  const mx = xs.reduce((s, v) => s + v, 0) / n
  const my = ys.reduce((s, v) => s + v, 0) / n
  let num = 0
  let dx = 0
  let dy = 0
  for (let i = 0; i < n; i++) {
    const vx = xs[i]! - mx
    const vy = ys[i]! - my
    num += vx * vy
    dx += vx * vx
    dy += vy * vy
  }
  if (dx === 0 || dy === 0) return null
  return num / Math.sqrt(dx * dy)
}

function TooltipPv({
  active,
  payload,
  split,
}: {
  active?: boolean
  payload?: Array<{ payload: PositionVolumeScatterPoint & { volumePlot: number } }>
  split: PositionVolumeQuadrantSplit | null
}) {
  if (!active || !payload?.length) return null
  const d = payload[0]!.payload
  let zone: string | null = null
  if (split) {
    const id = getQuadrantIdForPoint(d, split.medianPosition, split.medianVolume)
    zone = POSITION_VOLUME_QUADRANTS[id].label
  }
  return (
    <div
      className="max-w-[min(100vw-2rem,280px)] rounded-[var(--radius-md)] border px-3 py-2.5 text-xs shadow-md"
      style={{
        background: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
        color: 'var(--color-text-primary)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <p className="mb-1.5 line-clamp-3 font-medium leading-snug" title={d.query}>
        {d.query}
      </p>
      {zone ? (
        <p className="mb-1.5 text-[10px] leading-snug text-muted-foreground">
          Zone : <span className="text-foreground">{zone}</span>
        </p>
      ) : null}
      <div className="space-y-0.5 font-mono text-[11px] tabular-nums text-muted-foreground">
        <p>
          Vol. FR / mois <span className="text-foreground">{formatCompact(d.volume)}</span>
        </p>
        <p>
          Position <span className="text-foreground">{d.position.toFixed(1)}</span>
        </p>
        <p>
          Impressions <span className="text-foreground">{formatCompact(d.impressions)}</span>
        </p>
      </div>
    </div>
  )
}

const QUADRANT_ORDER: Array<keyof typeof POSITION_VOLUME_QUADRANTS> = [
  'good_high',
  'bad_high',
  'good_low',
  'bad_low',
]

export function PlotPositionVolumeScatter({ data }: { data: PositionVolumeScatterPoint[] }) {
  const [openQuadrant, setOpenQuadrant] = useState<PositionVolumeQuadrantId | null>(null)
  const p = useChartPalette()
  const chartData = useMemo(
    () =>
      data.map((d) => ({
        ...d,
        volumePlot: Math.max(1, d.volume),
      })),
    [data]
  )

  const rho = useMemo(() => pearsonPositionLogVolume(data), [data])
  const split = useMemo(() => computePositionVolumeQuadrantSplit(data), [data])

  const pointsByQuadrant = useMemo(() => {
    if (!split) return null
    return groupPointsByQuadrant(data, split.medianPosition, split.medianVolume)
  }, [data, split])

  const posMax = useMemo(() => {
    if (chartData.length === 0) return 20
    const m = Math.max(...chartData.map((d) => d.position), 1)
    return Math.min(100, Math.ceil(m + 2))
  }, [chartData])

  /** Position du trait « 10 » sur la barre schéma 1 → posMax (linéaire). */
  const tick10Pct = posMax >= 10 ? (10 / posMax) * 100 : null

  const chartMaxX = useMemo(() => {
    if (chartData.length === 0) return 100
    return Math.max(10, ...chartData.map((d) => d.volumePlot)) * 1.15
  }, [chartData])

  if (chartData.length === 0) {
    return <p className="text-xs text-muted-foreground">Pas assez de requêtes avec volume FR.</p>
  }

  const medPos = split?.medianPosition
  const medVol = split?.medianVolume
  const showQuadrants = split != null && medPos != null && medVol != null
  const medVolPlot = showQuadrants ? Math.max(1, medVol) : 1

  return (
    <div className="space-y-3">
      {showQuadrants ? (
        <>
          <div className="grid gap-2 sm:grid-cols-2">
            {QUADRANT_ORDER.map((id) => {
              const def = POSITION_VOLUME_QUADRANTS[id]
              const n = split!.counts[id]
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setOpenQuadrant(id)}
                  className={cn(
                    'rounded-[var(--radius-md)] border border-border/60 bg-card/50 px-3 py-2 text-left transition-colors',
                    'hover:border-border hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
                  )}
                  title="Voir les requêtes de cette zone"
                  aria-label={`${def.label} — ${formatNumber(n)} requêtes, ouvrir le détail`}
                >
                  <p className="text-[11px] font-medium leading-snug text-foreground">{def.label}</p>
                  <p className="mt-0.5 font-mono text-base tabular-nums text-foreground">{formatNumber(n)}</p>
                </button>
              )
            })}
          </div>

          <Dialog open={openQuadrant != null} onOpenChange={(o) => !o && setOpenQuadrant(null)}>
            {openQuadrant != null && split != null && pointsByQuadrant ? (
              <DialogContent className="flex max-h-[min(88vh,720px)] flex-col gap-0 p-0 sm:max-w-3xl">
                <DialogHeader>
                  <DialogTitle>{POSITION_VOLUME_QUADRANTS[openQuadrant].label}</DialogTitle>
                  <DialogDescription>
                    {POSITION_VOLUME_QUADRANTS[openQuadrant].hint} · méd. position{' '}
                    {split.medianPosition.toFixed(1)} · méd. volume {formatCompact(split.medianVolume)} / mois · tri
                    par impressions
                  </DialogDescription>
                </DialogHeader>
                <div className="min-h-0 flex-1 overflow-auto px-3 pb-4 sm:px-5">
                  {pointsByQuadrant[openQuadrant].length === 0 ? (
                    <p className="text-xs text-muted-foreground">Aucune requête dans cette zone.</p>
                  ) : (
                    <Table className="[&_th]:text-[11px] [&_td]:py-2.5 [&_td]:text-[11px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="max-w-[min(40vw,240px)]">Requête</TableHead>
                          <TableHead className="text-right">Vol. FR / mois</TableHead>
                          <TableHead className="text-right">Position</TableHead>
                          <TableHead className="text-right">Impressions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pointsByQuadrant[openQuadrant].map((row) => (
                          <TableRow key={row.query}>
                            <TableCell className="max-w-0 font-mono" title={row.query}>
                              {truncateQuery(row.query, 56)}
                            </TableCell>
                            <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                              {formatCompact(row.volume)}
                            </TableCell>
                            <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                              {row.position.toFixed(1)}
                            </TableCell>
                            <TableCell className="text-right font-mono tabular-nums text-foreground">
                              {formatCompact(row.impressions)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </DialogContent>
            ) : null}
          </Dialog>
        </>
      ) : (
        <p className="text-[10px] text-muted-foreground">
          4 requêtes minimum — seuils = médianes volume (axe horizontal) et position (axe vertical).
        </p>
      )}

      <div className="h-[min(48vh,360px)] w-full min-h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 12, bottom: 36, left: 12 }}>
            <defs>
              <linearGradient id="pvPage1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-success)" stopOpacity={0.14} />
                <stop offset="100%" stopColor="var(--color-success)" stopOpacity={0.02} />
              </linearGradient>
              <radialGradient id="pvBubble" cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor={p.accent} stopOpacity={0.88} />
                <stop offset="100%" stopColor="var(--color-info)" stopOpacity={0.38} />
              </radialGradient>
            </defs>
            <CartesianGrid stroke={p.grid} strokeOpacity={0.45} strokeDasharray="3 6" />
            {/* Bande « page 1 » (repère positions 1–10) : lecture intuitive en haut du graphique */}
            {posMax >= 3 ? (
              <ReferenceArea
                x1={1}
                x2={chartMaxX}
                y1={1}
                y2={Math.min(10, posMax)}
                fill="url(#pvPage1)"
                strokeOpacity={0}
              />
            ) : null}
            {showQuadrants ? (
              <>
                <ReferenceArea
                  x1={1}
                  x2={medVolPlot}
                  y1={1}
                  y2={medPos}
                  fill="var(--color-info)"
                  fillOpacity={0.07}
                  strokeOpacity={0}
                />
                <ReferenceArea
                  x1={medVolPlot}
                  x2={chartMaxX}
                  y1={1}
                  y2={medPos}
                  fill="var(--color-success)"
                  fillOpacity={0.08}
                  strokeOpacity={0}
                />
                <ReferenceArea
                  x1={1}
                  x2={medVolPlot}
                  y1={medPos}
                  y2={posMax}
                  fill="var(--color-text-tertiary)"
                  fillOpacity={0.06}
                  strokeOpacity={0}
                />
                <ReferenceArea
                  x1={medVolPlot}
                  x2={chartMaxX}
                  y1={medPos}
                  y2={posMax}
                  fill="var(--color-warning)"
                  fillOpacity={0.09}
                  strokeOpacity={0}
                />
                <ReferenceLine
                  x={medVolPlot}
                  stroke={p.accent}
                  strokeDasharray="4 4"
                  strokeOpacity={0.55}
                />
                <ReferenceLine
                  y={medPos}
                  stroke={p.accent}
                  strokeDasharray="4 4"
                  strokeOpacity={0.55}
                />
              </>
            ) : null}
            {posMax > 10 ? (
              <ReferenceLine
                y={10}
                stroke={p.series2}
                strokeDasharray="6 4"
                strokeOpacity={0.5}
                label={{
                  value: '≈ fin 1re page (repère 10)',
                  position: 'right',
                  fill: p.tick,
                  fontSize: 10,
                }}
              />
            ) : null}
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
                value="Volume de recherche FR / mois (log) — droite = plus de demande"
                offset={-14}
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
                value="Position moyenne GSC — haut = meilleur classement"
                angle={-90}
                position="insideLeft"
                style={{ fill: p.tick, fontSize: 10, fontFamily: 'var(--font-sans)' }}
              />
            </YAxis>
            <ZAxis type="number" dataKey="impressions" range={[12, 52]} />
            <Tooltip
              cursor={{ strokeDasharray: '4 4', stroke: p.border, strokeOpacity: 0.75 }}
              content={<TooltipPv split={split} />}
            />
            <Scatter
              data={chartData}
              fill="url(#pvBubble)"
              fillOpacity={0.92}
              stroke={p.surface}
              strokeWidth={1}
              isAnimationActive
              animationDuration={700}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Cadran léger sous le graphique : repère 1 → 10 → suite */}
      <div className="rounded-md border border-border/50 bg-muted/20 px-3 py-2">
        <p className="mb-1.5 text-[9px] uppercase tracking-wider text-muted-foreground">
          Repère position (schéma)
        </p>
        <div className="relative h-6 overflow-hidden rounded-sm border border-border/40 bg-gradient-to-r from-[color-mix(in_oklab,var(--color-success)_22%,transparent)] via-[color-mix(in_oklab,var(--color-warning)_18%,transparent)] to-muted/40">
          {tick10Pct != null ? (
            <div
              className="absolute bottom-0 top-0 w-px bg-foreground/25"
              style={{ left: `${tick10Pct}%` }}
              title="Repère position 10"
            />
          ) : null}
          <span className="absolute left-1 top-1/2 -translate-y-1/2 font-mono text-[9px] text-muted-foreground">
            1
          </span>
          {tick10Pct != null ? (
            <span
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 font-mono text-[9px] text-foreground/80"
              style={{ left: `${tick10Pct}%` }}
            >
              10
            </span>
          ) : null}
          <span className="absolute right-1 top-1/2 -translate-y-1/2 font-mono text-[9px] text-muted-foreground">
            {posMax}
          </span>
        </div>
        <p className="mt-1.5 text-[9px] leading-snug text-muted-foreground">
          En haut du graphique, la zone verte ≈ positions 1–10 (repère « première page » courante). Au-delà, la
          visibilité baisse souvent — indicatif seulement.
        </p>
      </div>

      <p className="text-[9px] text-muted-foreground">
        Points : taille ∝ impressions · {formatNumber(chartData.length)} requêtes
        {showQuadrants ? ' · lignes = médianes volume & position' : null}
      </p>

      {rho != null ? (
        <details className="rounded-md border border-border/50 bg-transparent px-2 py-1.5 text-[9px] text-muted-foreground">
          <summary className="cursor-pointer select-none">ρ Pearson {rho.toFixed(2)}</summary>
          <p className="mt-1.5 leading-relaxed">
            Relation linéaire position ↔ log volume. Les quadrants restent le repère principal.
          </p>
        </details>
      ) : null}
    </div>
  )
}
