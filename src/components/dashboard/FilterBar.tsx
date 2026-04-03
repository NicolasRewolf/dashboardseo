import { AnimatePresence, motion } from 'framer-motion'
import { Filter } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { BrandFilterMode } from '@/types/bi'
import { LEGAL_SPECIALTIES } from '@/types/specialties'
import { useDashboardFilters } from '@/contexts/dashboard-filters'

const BRAND_OPTIONS: { id: BrandFilterMode; label: string }[] = [
  { id: 'all', label: 'Tout' },
  { id: 'brand', label: 'Marque' },
  { id: 'non_brand', label: 'Hors marque' },
]

export function FilterBar() {
  const { dateRange, setDateRange, brandMode, setBrandMode, specialtyId, setSpecialtyId } =
    useDashboardFilters()

  return (
    <div className="flex flex-col gap-4 border-b border-border pb-4">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex min-w-[200px] flex-col gap-1.5">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Période
          </span>
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

      <div>
        <span className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Spécialité juridique
        </span>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={specialtyId === null ? 'default' : 'outline'}
            size="sm"
            className="h-8 rounded-md text-xs"
            onClick={() => setSpecialtyId(null)}
          >
            Toutes
          </Button>
          {LEGAL_SPECIALTIES.map((s) => (
            <SpecialtyPill
              key={s.id}
              label={s.label}
              active={specialtyId === s.id}
              onSelect={() => setSpecialtyId(specialtyId === s.id ? null : s.id)}
            />
          ))}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {specialtyId ? (
          <motion.p
            key="hint"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-xs text-muted-foreground"
          >
            Vue filtrée : les modules ci-dessous se calent sur cette spécialité (données GSC à
            brancher).
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

function SpecialtyPill({
  label,
  active,
  onSelect,
}: {
  label: string
  active: boolean
  onSelect: () => void
}) {
  return (
    <motion.div layout>
      <Button
        type="button"
        variant={active ? 'default' : 'outline'}
        size="sm"
        className="h-8 rounded-md text-xs"
        onClick={onSelect}
        aria-pressed={active}
      >
        {label}
      </Button>
    </motion.div>
  )
}
