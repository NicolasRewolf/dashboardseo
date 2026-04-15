import { useCallback, useMemo, useState } from 'react'

import { CtrActualVsExpectedScatter } from '@/components/charts/CtrActualVsExpectedScatter'
import { OpportunityScoreHorizontalBarChart } from '@/components/charts/OpportunityScoreHorizontalBarChart'
import {
  PositionEvolutionLineChart,
  type PositionEvolutionSeries,
} from '@/components/charts/PositionEvolutionLineChart'
import { PositionZoneSegmentationBarChart } from '@/components/charts/PositionZoneSegmentationBarChart'
import { VolumePositionCtrGapScatter } from '@/components/charts/VolumePositionCtrGapScatter'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { bucketPositionTrend, shouldUseWeeklyPositionTrend } from '@/lib/bi/position-trend-bucket'
import { formatCompact, formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'
import type {
  DailyTrendPoint,
  DashboardDateRange,
  PageSegmentMode,
  SeoAdvancedBlock,
} from '@/types/bi'

import { useQueryPositionDrilldown } from '@/hooks/use-query-position-drilldown'

function dayCountInclusive(range: DashboardDateRange): number {
  const a = new Date(range.start + 'T12:00:00Z')
  const b = new Date(range.end + 'T12:00:00Z')
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / 864e5) + 1)
}

function SeoAdvancedKpiCards({ kpis }: { kpis: SeoAdvancedBlock['kpis'] }) {
  const items: Array<{ label: string; value: string; hint: string }> = [
    {
      label: 'Σ impressions',
      value: formatCompact(kpis.totalImpressions),
      hint: 'Périmètre GSC filtré',
    },
    {
      label: 'Requêtes ΔCTR bench. > 3 pts',
      value: formatNumber(kpis.queryCountCtrGapAbove003),
      hint: 'getExpectedCtr(pos) − CTR réel',
    },
    {
      label: 'Σ gain si top 3 (est.)',
      value: formatNumber(Math.round(kpis.sumGainIfTop3)),
      hint: 'Σ (volume_FR × 11 % − clics), requêtes avec volume',
    },
    {
      label: 'Requêtes page 2',
      value: formatNumber(kpis.queryCountPositionPage2),
      hint: '10 < position ≤ 20',
    },
  ]
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((it) => (
        <div
          key={it.label}
          className="rounded-[var(--radius-md)] border border-border/60 bg-card/50 px-3 py-2.5"
        >
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{it.label}</p>
          <p className="mt-1 font-mono text-lg tabular-nums text-foreground">{it.value}</p>
          <p className="mt-0.5 text-[9px] leading-snug text-muted-foreground">{it.hint}</p>
        </div>
      ))}
    </div>
  )
}

export function SeoAdvancedAnalytics({
  block,
  dailyTrend,
  dateRange,
  pageSegment,
  siteUrl,
  queryPickerOptions,
}: {
  block: SeoAdvancedBlock
  dailyTrend: DailyTrendPoint[]
  dateRange: DashboardDateRange
  pageSegment: PageSegmentMode
  siteUrl: string | null
  /** Libellés requêtes pour le drill-down (ex. nuage position × volume). */
  queryPickerOptions: string[]
}) {
  const days = dayCountInclusive(dateRange)
  const weekly = shouldUseWeeklyPositionTrend(days)

  const siteSeriesPoints = useMemo(
    () => bucketPositionTrend(dailyTrend, weekly),
    [dailyTrend, weekly]
  )

  const pickOptions = useMemo(() => queryPickerOptions.slice(0, 40), [queryPickerOptions])

  const [selected, setSelected] = useState<string[]>([])

  const toggle = useCallback((q: string) => {
    setSelected((prev) => (prev.includes(q) ? prev.filter((x) => x !== q) : [...prev, q].slice(0, 8)))
  }, [])

  const { seriesByQuery, loading: drillLoading } = useQueryPositionDrilldown(
    siteUrl,
    dateRange,
    pageSegment,
    selected
  )

  const evolutionSeries: PositionEvolutionSeries[] = useMemo(() => {
    const out: PositionEvolutionSeries[] = [
      {
        id: 'site',
        label: 'Site (toutes requêtes)',
        points: siteSeriesPoints,
        color: 'var(--color-accent)',
      },
    ]
    let drillIdx = 0
    for (const q of selected) {
      const pts = seriesByQuery.get(q)
      if (pts && pts.length > 0) {
        drillIdx += 1
        out.push({
          id: `drill_${drillIdx}`,
          label: q.length > 36 ? `${q.slice(0, 34)}…` : q,
          points: bucketPositionTrend(pts, weekly),
        })
      }
    }
    return out
  }, [selected, seriesByQuery, siteSeriesPoints, weekly])

  const xLabel = weekly ? 'Semaine (début lundi UTC) · position pondérée impressions' : 'Jour · position pondérée impressions'

  return (
    <div className="space-y-6 border-t border-border/70 pt-6">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Analyse avancée</p>
        <h2 className="mt-1 text-base font-medium tracking-tight text-foreground">
          CTR benchmark · zones · opportunités
        </h2>
        <p className="mt-1 max-w-3xl text-xs text-muted-foreground">
          Volumes & difficulté DataForSEO ; positions, impressions et clics GSC. Courbe CTR attendue : repères fixes
          (1 → 28 % … 10 → 2 %).
        </p>
      </div>

      <SeoAdvancedKpiCards kpis={block.kpis} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border bg-card/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-2">
            <h3 className="text-sm font-medium text-foreground">Scatter — Volume × position</h3>
            <p className="text-[11px] text-muted-foreground">
              Taille = impressions (5–22 px). Couleur = écart au CTR attendu (position).
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            <VolumePositionCtrGapScatter data={block.volumePositionScatter} />
          </CardContent>
        </Card>

        <Card className="border-border bg-card/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-2">
            <h3 className="text-sm font-medium text-foreground">Barres — Segmentation par zone</h3>
            <p className="text-[11px] text-muted-foreground">Par position GSC : Top 3 · P1 bas · P2 · Hors radar.</p>
          </CardHeader>
          <CardContent className="pt-0">
            <PositionZoneSegmentationBarChart data={block.zoneSegments} />
          </CardContent>
        </Card>

        <Card className="border-border bg-card/80 backdrop-blur-sm lg:col-span-2">
          <CardHeader className="space-y-1 pb-2">
            <h3 className="text-sm font-medium text-foreground">Scatter — CTR réel vs attendu</h3>
            <p className="text-[11px] text-muted-foreground">
              Vert = au-dessus de la courbe ; rouge = en dessous. Ligne = CTR benchmark par position.
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            <CtrActualVsExpectedScatter data={block.ctrScatter} />
          </CardContent>
        </Card>

        <Card className="border-border bg-card/80 backdrop-blur-sm lg:col-span-2">
          <CardHeader className="space-y-1 pb-2">
            <h3 className="text-sm font-medium text-foreground">Barres — Opportunity score (top 20)</h3>
            <p className="text-[11px] text-muted-foreground">
              (impr. × 1/pos) / max(difficulté, 1), normalisé 0–100. Difficulté = DataForSEO (ou 50).
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            <OpportunityScoreHorizontalBarChart data={block.opportunityTop20} />
          </CardContent>
        </Card>

        <Card className="border-border bg-card/80 backdrop-blur-sm lg:col-span-2">
          <CardHeader className="space-y-1 pb-2">
            <h3 className="text-sm font-medium text-foreground">Courbe — Évolution position</h3>
            <p className="text-[11px] text-muted-foreground">
              {weekly ? 'Agrégation hebdomadaire (>90 j.)' : 'Quotidien'}. Sélectionnez des requêtes pour comparer
              (max 8).
            </p>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {pickOptions.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {pickOptions.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => toggle(q)}
                    className={cn(
                      'max-w-full truncate rounded-md border px-2 py-1 text-left font-mono text-[10px] transition-colors',
                      selected.includes(q)
                        ? 'border-[color:var(--color-accent)] bg-muted/50 text-foreground'
                        : 'border-border/60 bg-transparent text-muted-foreground hover:bg-muted/30'
                    )}
                    title={q}
                  >
                    {q.length > 48 ? `${q.slice(0, 46)}…` : q}
                  </button>
                ))}
              </div>
            ) : null}
            {drillLoading ? (
              <p className="text-[11px] text-muted-foreground">Chargement des séries requête…</p>
            ) : null}
            <PositionEvolutionLineChart series={evolutionSeries} xLabel={xLabel} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
