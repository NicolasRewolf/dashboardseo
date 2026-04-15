import { Filter } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  getCurrentMonthRange,
  getCurrentYearRange,
  getLast30DaysRange,
  isCurrentMonthRange,
  isCurrentYearRange,
  isLast30DaysRange,
} from '@/lib/dashboard-date-presets'
import { cn } from '@/lib/utils'
import type { BrandFilterMode, PageSegmentMode } from '@/types/bi'
import { useDashboardFilters } from '@/contexts/dashboard-filters'

const BRAND_OPTIONS: { id: BrandFilterMode; label: string; help: string }[] = [
  {
    id: 'all',
    label: 'Tout',
    help: 'Toutes les requêtes, sans filtre marque / hors marque.',
  },
  {
    id: 'brand',
    label: 'Marque',
    help: 'Requêtes détectées comme marque (patterns type « Louton », « JPLouton » — réglables dans le code).',
  },
  {
    id: 'non_brand',
    label: 'Hors marque',
    help: 'Requêtes qui ne matchent pas les patterns marque.',
  },
]

const PAGE_SEGMENT_OPTIONS: { id: PageSegmentMode; label: string; help: string }[] = [
  {
    id: 'all',
    label: 'Tout le site',
    help: 'Toutes les URLs de la propriété GSC.',
  },
  {
    id: 'blog',
    label: 'Blog',
    help: 'Chemins contenant /post/ (articles).',
  },
  {
    id: 'non_blog',
    label: 'Hors blog',
    help: 'URLs sans /post/ dans le chemin.',
  },
]

export function FilterBar() {
  const { dateRange, setDateRange, brandMode, setBrandMode, pageSegment, setPageSegment } =
    useDashboardFilters()
  const monthActive = isCurrentMonthRange(dateRange)
  const last30Active = isLast30DaysRange(dateRange)
  const yearActive = isCurrentYearRange(dateRange)

  return (
    <div className="flex flex-wrap items-end gap-4 border-b border-border pb-4">
      <div className="flex min-w-[200px] flex-col gap-1.5">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Période
        </span>
        <div
          className="inline-flex w-max max-w-full flex-wrap self-start rounded-md border border-border bg-secondary p-0.5 gap-0.5"
          role="group"
          aria-label="Presets de période"
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-pressed={monthActive}
                className={cn(
                  'h-8 rounded-sm px-2.5 text-xs font-normal transition-colors',
                  monthActive
                    ? 'bg-card text-foreground shadow-sm hover:bg-card hover:text-foreground'
                    : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                )}
                onClick={() => setDateRange(getCurrentMonthRange())}
              >
                Mois en cours
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Du 1er jour du mois calendaire à aujourd’hui (inclus). Comparaison : même nombre de jours depuis
              le 1er du mois précédent (aligné calendaire, plafonné à la fin du mois si besoin).
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-pressed={last30Active}
                className={cn(
                  'h-8 rounded-sm px-2.5 text-xs font-normal transition-colors',
                  last30Active
                    ? 'bg-card text-foreground shadow-sm hover:bg-card hover:text-foreground'
                    : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                )}
                onClick={() => setDateRange(getLast30DaysRange())}
              >
                30 derniers jours
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Fenêtre glissante de 30 jours jusqu’à aujourd’hui (inclus). Comparaison : fenêtre de même durée
              se terminant la veille du début de la période choisie.
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-pressed={yearActive}
                className={cn(
                  'h-8 rounded-sm px-2.5 text-xs font-normal transition-colors',
                  yearActive
                    ? 'bg-card text-foreground shadow-sm hover:bg-card hover:text-foreground'
                    : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                )}
                onClick={() => setDateRange(getCurrentYearRange())}
              >
                Année en cours
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Du 1er janvier à aujourd’hui (inclus). Comparaison : fenêtre de même durée se terminant la veille
              du début de la période choisie.
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="h-9 rounded-md border border-border bg-secondary px-2 font-mono text-xs text-foreground"
            aria-label="Date de début"
          />
          <span className="text-muted-foreground">→</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="h-9 rounded-md border border-border bg-secondary px-2 font-mono text-xs text-foreground"
            aria-label="Date de fin"
          />
        </div>
        <p className="text-[11px] text-muted-foreground">
          Comparaison : avec <span className="font-mono">Mois en cours</span>, du 1<sup>er</sup> du mois
          précédent sur le même nombre de jours qu’aujourd’hui ; sinon, fenêtre de même durée juste avant le
          début des dates choisies.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Marque
        </span>
        <div className="flex rounded-md border border-border bg-secondary p-0.5">
          {BRAND_OPTIONS.map((o) => (
            <Tooltip key={o.id}>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'h-8 rounded-sm px-3 text-xs',
                    brandMode === o.id && 'bg-card text-foreground shadow-sm'
                  )}
                  onClick={() => setBrandMode(o.id)}
                >
                  {o.label}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">{o.help}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>

      <div className="flex min-w-[220px] flex-col gap-1.5">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Pages
        </span>
        <div className="flex w-max max-w-full flex-wrap rounded-md border border-border bg-secondary p-0.5">
          {PAGE_SEGMENT_OPTIONS.map((o) => (
            <Tooltip key={o.id}>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'h-8 rounded-sm px-2.5 text-xs font-normal',
                    pageSegment === o.id && 'bg-card text-foreground shadow-sm'
                  )}
                  onClick={() => setPageSegment(o.id)}
                >
                  {o.label}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">{o.help}</TooltipContent>
            </Tooltip>
          ))}
        </div>
        <p className="max-w-[14rem] text-[11px] leading-snug text-muted-foreground">
          Blog = chemins avec <span className="font-mono">/post/</span>. Filtre appliqué côté Search
          Console (requêtes + tendance).
        </p>
      </div>

      <div className="ml-auto flex items-center gap-2 text-muted-foreground">
        <Filter className="size-4" aria-hidden />
        <span className="text-xs">Filtres BI</span>
      </div>
    </div>
  )
}
