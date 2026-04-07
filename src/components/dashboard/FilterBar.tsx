import { Filter } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  getCurrentMonthRange,
  getCurrentYearRange,
  isCurrentMonthRange,
  isCurrentYearRange,
} from '@/lib/dashboard-date-presets'
import { cn } from '@/lib/utils'
import type { BrandFilterMode } from '@/types/bi'
import { useDashboardFilters } from '@/contexts/dashboard-filters'

const BRAND_OPTIONS: { id: BrandFilterMode; label: string }[] = [
  { id: 'all', label: 'Tout' },
  { id: 'brand', label: 'Marque' },
  { id: 'non_brand', label: 'Hors marque' },
]

export function FilterBar() {
  const { dateRange, setDateRange, brandMode, setBrandMode } = useDashboardFilters()
  const monthActive = isCurrentMonthRange(dateRange)
  const yearActive = isCurrentYearRange(dateRange)

  return (
    <div className="flex flex-wrap items-end gap-4 border-b border-border pb-4">
      <div className="flex min-w-[200px] flex-col gap-1.5">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Période
        </span>
        <div className="flex flex-wrap gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              'h-8 rounded-md px-2.5 text-xs font-normal',
              monthActive && 'border-border bg-card text-foreground shadow-sm'
            )}
            onClick={() => setDateRange(getCurrentMonthRange())}
          >
            Mois en cours
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              'h-8 rounded-md px-2.5 text-xs font-normal',
              yearActive && 'border-border bg-card text-foreground shadow-sm'
            )}
            onClick={() => setDateRange(getCurrentYearRange())}
          >
            Année en cours
          </Button>
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
          Comparaison : même nombre de jours, fenêtre immédiatement avant le début (
          <span className="font-mono">période précédente</span>).
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Marque
        </span>
        <div className="flex rounded-md border border-border bg-secondary p-0.5">
          {BRAND_OPTIONS.map((o) => (
            <Button
              key={o.id}
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
          ))}
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2 text-muted-foreground">
        <Filter className="size-4" aria-hidden />
        <span className="text-xs">Filtres BI</span>
      </div>
    </div>
  )
}
