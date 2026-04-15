import { motion } from 'framer-motion'
import { useMemo } from 'react'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Info } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { SortableTableHead } from '@/components/ui/sortable-table-head'
import { useColumnSort } from '@/hooks/use-column-sort'
import { cn } from '@/lib/utils'
import { formatNumber, formatPercent, formatRatioAsPercent } from '@/lib/format'
import type { ClickDriversResult, QueryClickDriver } from '@/types/bi'

function truncate(s: string, max: number): string {
  if (s.length <= max) return s
  return `${s.slice(0, max - 1)}…`
}

function roundClicks(n: number): string {
  return formatNumber(Math.round(n))
}

function signedClicks(n: number): string {
  const r = roundClicks(n)
  return n >= 0 ? `+${r}` : r
}

function safeCtr(clicks: number, impressions: number): number {
  return impressions > 0 ? clicks / impressions : 0
}

function volumeEffectTooltip(d: QueryClickDriver): string {
  const ctrRef = safeCtr(d.clicksPrev, d.impressionsPrev)
  return [
    `Impressions ${formatNumber(d.impressionsPrev)} → ${formatNumber(d.impressionsCur)}.`,
    `En gardant le CTR de la référence (${formatRatioAsPercent(ctrRef, 1)}), ce Δ d’impressions vaut ${signedClicks(d.volumeEffectClicks)} clics.`,
  ].join(' ')
}

/** Explique le « +237 » : ce n’est pas un % de CTR, c’est I_actuel × (CTR_actuel − CTR_réf.). */
function ctrEffectTooltip(d: QueryClickDriver): string {
  const ctrRef = safeCtr(d.clicksPrev, d.impressionsPrev)
  const ctrAct = safeCtr(d.clicksCur, d.impressionsCur)
  const deltaPp = (ctrAct - ctrRef) * 100
  const sign = deltaPp >= 0 ? '+' : ''
  return [
    `CTR mot-clé : ${formatRatioAsPercent(ctrRef, 1)} (réf.) → ${formatRatioAsPercent(ctrAct, 1)} (actuel), soit ${sign}${deltaPp.toFixed(1)} pts.`,
    `À ${formatNumber(d.impressionsCur)} impressions actuelles : ${formatNumber(d.impressionsCur)} × (CTR actuel − CTR réf.) ≈ ${signedClicks(d.ctrEffectClicks)} clics.`,
  ].join(' ')
}

function sortDriverRows(
  rows: QueryClickDriver[],
  sortKey: string | null,
  direction: 'asc' | 'desc'
): QueryClickDriver[] {
  if (!sortKey) return rows
  const copy = [...rows]
  copy.sort((a, b) => {
    switch (sortKey) {
      case 'query':
        return direction === 'desc'
          ? b.query.localeCompare(a.query, 'fr', { sensitivity: 'base' })
          : a.query.localeCompare(b.query, 'fr', { sensitivity: 'base' })
      case 'delta':
        return direction === 'desc'
          ? b.deltaClicks - a.deltaClicks
          : a.deltaClicks - b.deltaClicks
      case 'volume':
        return direction === 'desc'
          ? b.volumeEffectClicks - a.volumeEffectClicks
          : a.volumeEffectClicks - b.volumeEffectClicks
      case 'ctr':
        return direction === 'desc'
          ? b.ctrEffectClicks - a.ctrEffectClicks
          : a.ctrEffectClicks - b.ctrEffectClicks
      case 'poids': {
        const va = a.pctOfTotalAbsDelta ?? -1
        const vb = b.pctOfTotalAbsDelta ?? -1
        return direction === 'desc' ? vb - va : va - vb
      }
      default:
        return 0
    }
  })
  return copy
}

export function ClickDriversCard({ drivers }: { drivers: ClickDriversResult }) {
  const { aggregate, topDrivers } = drivers
  const { sortKey, direction, onSort } = useColumnSort()
  const sortedDrivers = useMemo(
    () => sortDriverRows(topDrivers, sortKey, direction),
    [topDrivers, sortKey, direction]
  )
  const { volumeEffectClicks, ctrEffectClicks, deltaClicks } = aggregate
  const sumParts = volumeEffectClicks + ctrEffectClicks
  const bridgeOk = Math.abs(sumParts - deltaClicks) < 2

  return (
    <motion.div layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-border bg-card/80 backdrop-blur-sm">
        <CardHeader className="space-y-2 pb-3">
          <div className="flex items-start justify-between gap-3">
            <h2 className="min-w-0 flex-1 text-sm font-medium tracking-tight text-foreground">
              D’où vient le changement de clics ?
            </h2>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="mt-0.5 shrink-0 rounded-md p-1 text-muted-foreground/65 transition-colors hover:bg-muted/50 hover:text-muted-foreground"
                  aria-label="Méthode de décomposition"
                >
                  <Info className="size-3.5" aria-hidden />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-[min(92vw,22rem)] text-left leading-relaxed">
                Pont <span className="font-mono">clics ≈ impressions × CTR</span> : effet « volume » = Δ
                impressions en gardant le CTR de référence ; effet « CTR » = impressions actuelles × écart de CTR.
                Les cellules sont en <strong className="text-foreground">clics</strong>, pas en points de CTR.
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            vs période de référence : <strong className="text-foreground">impressions</strong> (visibilité) et{' '}
            <strong className="text-foreground">CTR</strong> (snippet, position…).
          </p>
        </CardHeader>
        <CardContent className="space-y-4 border-t border-border/80 pt-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-md border border-border/80 bg-muted/30 px-3 py-2.5">
              <p className="text-[11px] font-medium text-muted-foreground">Écart total de clics</p>
              <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">
                Clics maintenant − clics avant (sur le périmètre filtré).
              </p>
              <p
                className={cn(
                  'mt-2 font-mono text-xl tabular-nums',
                  deltaClicks >= 0 ? 'text-[color:var(--color-success)]' : 'text-[color:var(--color-danger)]'
                )}
              >
                {deltaClicks >= 0 ? '+' : ''}
                {roundClicks(deltaClicks)}
              </p>
            </div>
            <div className="rounded-md border border-border/80 bg-muted/30 px-3 py-2.5">
              <p className="text-[11px] font-medium text-muted-foreground">Effet impressions (clics)</p>
              <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">
                Comme la colonne « Effet volume » : CTR de référence figé.
              </p>
              <p className="mt-2 font-mono text-xl tabular-nums text-foreground">
                {volumeEffectClicks >= 0 ? '+' : ''}
                {roundClicks(volumeEffectClicks)}
              </p>
            </div>
            <div className="rounded-md border border-border/80 bg-muted/30 px-3 py-2.5">
              <p className="text-[11px] font-medium text-muted-foreground">Effet CTR (clics)</p>
              <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">
                Comme « Effet CTR » : impressions actuelles × écart de CTR (pas un % seul).
              </p>
              <p className="mt-2 font-mono text-xl tabular-nums text-foreground">
                {ctrEffectClicks >= 0 ? '+' : ''}
                {roundClicks(ctrEffectClicks)}
              </p>
            </div>
          </div>

          <div className="rounded-md border border-border/60 bg-muted/15 px-3 py-2 text-[11px] text-muted-foreground">
            <span className="text-foreground">Synthèse : </span>
            CTR moyen site {formatRatioAsPercent(aggregate.ctrCurrent, 2)} (actuel) vs{' '}
            {formatRatioAsPercent(aggregate.ctrPrevious, 2)} (réf.) · impressions{' '}
            {formatNumber(aggregate.impressionsCurrent)} vs {formatNumber(aggregate.impressionsPrevious)}.
            {!bridgeOk && (
              <span className="text-[color:var(--color-warning)]">
                {' '}
                Léger écart : arrondis ou export incomplet — voir carte « Fiabilité ».
              </span>
            )}
          </div>

          <div>
            <p className="mb-1 text-sm font-medium text-foreground">Requêtes qui pèsent le plus</p>
            <p className="mb-2 text-[11px] leading-snug text-muted-foreground">
              Colonnes en <strong className="text-foreground">clics</strong> — survol pour le détail CTR. Tri
              sur les en-têtes.
            </p>
            <details className="mb-3 text-[10px] leading-relaxed text-muted-foreground">
              <summary className="cursor-pointer select-none">Lire effet volume / effet CTR / poids</summary>
              <p className="mt-2">
                « Effet volume » : clics dus au Δ d’impressions si le CTR restait celui de la référence. « Effet
                CTR » : clics dus au passage CTR réf. → actuel à impressions actuelles. « Poids » : part du Σ|Δ
                clics| du site.
              </p>
            </details>
            <Table className="[&_th]:text-foreground [&_th]:text-[11px]">
              <TableHeader>
                <TableRow>
                  <SortableTableHead
                    columnKey="query"
                    activeKey={sortKey}
                    direction={direction}
                    onSort={onSort}
                    title="Trier par requête"
                  >
                    Requête
                  </SortableTableHead>
                  <SortableTableHead
                    columnKey="delta"
                    activeKey={sortKey}
                    direction={direction}
                    onSort={onSort}
                    align="right"
                    title="Trier par écart de clics"
                  >
                    Écart clics
                  </SortableTableHead>
                  <SortableTableHead
                    columnKey="volume"
                    activeKey={sortKey}
                    direction={direction}
                    onSort={onSort}
                    align="right"
                    title="Trier par effet volume (clics)"
                  >
                    Effet volume
                  </SortableTableHead>
                  <SortableTableHead
                    columnKey="ctr"
                    activeKey={sortKey}
                    direction={direction}
                    onSort={onSort}
                    align="right"
                    title="Trier par effet CTR (clics)"
                  >
                    Effet CTR
                  </SortableTableHead>
                  <SortableTableHead
                    columnKey="poids"
                    activeKey={sortKey}
                    direction={direction}
                    onSort={onSort}
                    align="right"
                    title="Trier par poids (% du Σ |Δ|)"
                  >
                    Poids (% du |Δ|)
                  </SortableTableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedDrivers.map((d) => (
                  <TableRow key={d.query}>
                    <TableCell className="max-w-0 font-mono text-[11px]" title={d.query}>
                      {truncate(d.query, 40)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        'text-right font-mono text-xs tabular-nums',
                        d.deltaClicks >= 0
                          ? 'text-[color:var(--color-success)]'
                          : 'text-[color:var(--color-danger)]'
                      )}
                    >
                      {d.deltaClicks >= 0 ? '+' : ''}
                      {roundClicks(d.deltaClicks)}
                    </TableCell>
                    <TableCell
                      className="text-right font-mono text-xs tabular-nums text-muted-foreground"
                      title={volumeEffectTooltip(d)}
                    >
                      {d.volumeEffectClicks >= 0 ? '+' : ''}
                      {roundClicks(d.volumeEffectClicks)}
                    </TableCell>
                    <TableCell
                      className="text-right font-mono text-xs tabular-nums text-muted-foreground"
                      title={ctrEffectTooltip(d)}
                    >
                      {d.ctrEffectClicks >= 0 ? '+' : ''}
                      {roundClicks(d.ctrEffectClicks)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs tabular-nums text-muted-foreground">
                      {d.pctOfTotalAbsDelta != null ? formatPercent(d.pctOfTotalAbsDelta, 1) : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
