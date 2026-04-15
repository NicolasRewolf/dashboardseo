import { motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'

import { PlotPositionVolumeScatter } from '@/components/charts/PlotPositionVolumeScatter'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatCompact, formatNumber, formatPercent } from '@/lib/format'
import { cn } from '@/lib/utils'
import { SeoAdvancedAnalytics } from '@/components/dashboard/SeoAdvancedAnalytics'
import type {
  DailyTrendPoint,
  DashboardDateRange,
  DataForSeoInsightBlock,
  PageSegmentMode,
} from '@/types/bi'

export function DataForSeoInsightCards({
  block,
  onRefreshDataForSeo,
  dataForSeoRefreshing = false,
  refreshDisabled = false,
  dailyTrend = [],
  dateRange,
  pageSegment = 'all',
  siteUrl = null,
  queryPickerOptions = [],
}: {
  block: DataForSeoInsightBlock
  onRefreshDataForSeo?: () => void | Promise<void>
  dataForSeoRefreshing?: boolean
  refreshDisabled?: boolean
  dailyTrend?: DailyTrendPoint[]
  dateRange?: DashboardDateRange
  pageSegment?: PageSegmentMode
  siteUrl?: string | null
  queryPickerOptions?: string[]
}) {
  const err = block.error
  const dv = block.demandVsVisibility
  const lev = block.leverage
  const cov = block.coverage

  const canRefresh = Boolean(onRefreshDataForSeo)
  const refreshBusy = refreshDisabled || dataForSeoRefreshing

  return (
    <div className="space-y-3">
      {canRefresh ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="min-w-0 space-y-0.5">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">DataForSEO</p>
            <p className="text-sm text-muted-foreground">
              GSC = filtres du haut de page. Le bouton force un nouvel appel volumes DataForSEO (sans recharger GSC).
            </p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 border-border"
                disabled={refreshBusy}
                onClick={() => void onRefreshDataForSeo?.()}
              >
                <RefreshCw className={cn('size-3.5', dataForSeoRefreshing && 'animate-spin')} aria-hidden />
                Rafraîchir les volumes FR
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[280px]">
              Ignore le cache des volumes (30&nbsp;j.) et relance un appel DataForSEO pour les requêtes du périmètre
              actuel. Aucun rechargement des données GSC.
            </TooltipContent>
          </Tooltip>
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-3">
        <motion.div layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card className="h-full border-border bg-card/80 backdrop-blur-sm">
            <CardHeader className="space-y-1 pb-2">
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">DataForSEO · FR</p>
              <h2 className="text-sm font-medium tracking-tight text-foreground">Demande vs visibilité</h2>
              <p className="text-[11px] leading-snug text-muted-foreground">
                Volume FR mensuel estimé pour les requêtes appariées (série Ads DataForSEO, ≈ 12 mois — indépendant des
                dates du filtre). Impressions = fenêtre GSC active. Requêtes très longues ou symboles rares : normalisation
                ou exclusion.
              </p>
            </CardHeader>
            <CardContent className="space-y-2 border-t border-border/80 pt-3 text-xs">
              {err ? (
                <p className="text-[11px] leading-snug text-[color:var(--color-danger)]">{err}</p>
              ) : (
                <>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Σ volume FR</span>
                    <span className="font-mono text-foreground">
                      {dv.totalVolumeFr != null ? formatCompact(dv.totalVolumeFr) : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Σ impressions GSC</span>
                    <span className="font-mono text-foreground">
                      {formatCompact(dv.totalImpressionsGsc)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Impr. / 1000 recherches / mois</span>
                    <span className="font-mono text-foreground">
                      {dv.impressionsPerKVolume != null ? formatNumber(Math.round(dv.impressionsPerKVolume)) : '—'}
                    </span>
                  </div>
                <p className="text-[10px] text-muted-foreground">
                  {dv.matchedQueries} / {dv.gscQueriesUsed} requêtes avec volume FR · cache navigateur 30&nbsp;j. pour
                  limiter les appels DataForSEO.
                </p>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }}>
          <Card className="h-full border-border bg-card/80 backdrop-blur-sm">
            <CardHeader className="space-y-1 pb-2">
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">GSC + volume</p>
              <h2 className="text-sm font-medium tracking-tight text-foreground">Levier (positions 4–15)</h2>
              <p className="text-[11px] leading-snug text-muted-foreground">
                Score = volume FR × marge vers le haut (16 − position). Top 5 sur le périmètre filtré.
              </p>
            </CardHeader>
            <CardContent className="space-y-2 border-t border-border/80 pt-3">
              {err ? (
                <p className="text-[11px] text-muted-foreground">Voir la carte précédente.</p>
              ) : lev.items.length === 0 ? (
                <p className="text-xs text-muted-foreground">Aucune requête en fenêtre 4–15 avec volume.</p>
              ) : (
                <ul className="space-y-1.5 text-[11px]">
                  {lev.items.map((it) => (
                    <li key={it.query} className="flex flex-col gap-0.5 border-b border-border/40 pb-1.5 last:border-0 last:pb-0">
                      <span className="truncate font-mono text-foreground" title={it.query}>
                        {it.query}
                      </span>
                      <span className="flex justify-between text-muted-foreground">
                        <span>vol. {formatCompact(it.volume)}</span>
                        <span>
                          pos. {it.position.toFixed(1)} · score {formatNumber(Math.round(it.score))}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
          <Card className="h-full border-border bg-card/80 backdrop-blur-sm">
            <CardHeader className="space-y-1 pb-2">
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Couverture</p>
              <h2 className="text-sm font-medium tracking-tight text-foreground">Gros volumes & visibilité</h2>
              <p className="text-[11px] leading-snug text-muted-foreground">
                Seuil = max(50, médiane des volumes). Parmi les requêtes « haut volume », part avec impressions GSC
                &gt; 0.
              </p>
            </CardHeader>
            <CardContent className="space-y-2 border-t border-border/80 pt-3 text-xs">
              {err ? (
                <p className="text-[11px] text-muted-foreground">Voir la première carte.</p>
              ) : (
                <>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Seuil volume</span>
                    <span className="font-mono text-foreground">{formatCompact(cov.volumeThreshold)}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Requêtes ≥ seuil</span>
                    <span className="font-mono text-foreground">{formatNumber(cov.highVolumeCount)}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Avec impressions</span>
                    <span className="font-mono text-foreground">
                      {formatNumber(cov.highVolumeWithImpressions)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Couverture</span>
                    <span className="font-mono text-foreground">
                      {cov.coveragePct != null ? formatPercent(cov.coveragePct, 0) : '—'}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {block.fetchedAt ? (
        <p className="text-center text-[10px] text-muted-foreground">
          DataForSEO · France / FR
          {block.volumeDateRange ? (
            <>
              {' '}
              · fenêtre GSC (impressions) {block.volumeDateRange.date_from} → {block.volumeDateRange.date_to}
            </>
          ) : null}
          {' · '}
          chargé {new Date(block.fetchedAt).toLocaleString('fr-FR')}
        </p>
      ) : null}

      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, type: 'spring', stiffness: 320, damping: 28 }}
        className="w-full"
      >
        <Card className="overflow-hidden border-border/90 bg-gradient-to-b from-card via-card/95 to-[color-mix(in_oklab,var(--color-surface-subtle)_65%,transparent)] shadow-[var(--shadow-md)] backdrop-blur-sm">
          <CardHeader className="space-y-1 border-b border-border/60 pb-3">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Opportunités · DataForSEO + GSC
            </p>
            <h2 className="text-base font-medium tracking-tight text-foreground">Position × volume FR (quadrants)</h2>
            <p className="max-w-3xl text-[11px] leading-relaxed text-muted-foreground">
              Un point = une requête. <strong className="font-medium text-foreground">Abscisse</strong> : volume FR / mois
              (log). <strong className="font-medium text-foreground">Ordonnée</strong> : position GSC (haut = meilleur
              classement). Les lignes en pointillés = médianes volume et position ; la zone verte en haut ≈ positions
              1–10. Taille du point ∝ impressions.
            </p>
          </CardHeader>
          <CardContent className="pt-4">
            {err ? (
              <p className="text-[11px] text-muted-foreground">Indisponible tant que les volumes DataForSEO ne sont pas chargés.</p>
            ) : (
              <PlotPositionVolumeScatter data={block.positionVolumeScatter} />
            )}
          </CardContent>
        </Card>
      </motion.div>

      {!err && block.seoAdvanced && dateRange ? (
        <SeoAdvancedAnalytics
          block={block.seoAdvanced}
          dailyTrend={dailyTrend}
          dateRange={dateRange}
          pageSegment={pageSegment}
          siteUrl={siteUrl}
          queryPickerOptions={queryPickerOptions}
        />
      ) : null}
    </div>
  )
}
