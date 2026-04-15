import { motion } from 'framer-motion'
import { Info } from 'lucide-react'
import { useMemo, type ReactNode } from 'react'

import { AreaChartCard } from '@/components/charts/AreaChartCard'
import { PlotQueryScatter } from '@/components/charts/PlotQueryScatter'
import { ClickDriversCard } from '@/components/dashboard/ClickDriversCard'
import { DataFoundationsCard } from '@/components/dashboard/DataFoundationsCard'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
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
import { formatCompact, formatNumber, formatPercentSigned, formatRatioAsPercent } from '@/lib/format'
import type {
  BiDashboardSnapshot,
  BusinessIntentVolume,
  CannibalizationRow,
  ContentDecayAlert,
  StrikingDistanceKeyword,
} from '@/types/bi'

function truncate(s: string, max: number): string {
  if (s.length <= max) return s
  return `${s.slice(0, max - 1)}…`
}

function severityBadge(sev: 'watch' | 'alert' | 'critical') {
  if (sev === 'critical')
    return <Badge variant="destructive">Critique</Badge>
  if (sev === 'alert')
    return (
      <Badge variant="outline" className="border-[color:var(--color-warning)] text-[color:var(--color-warning)]">
        Alerte
      </Badge>
    )
  return <Badge variant="secondary">Veille</Badge>
}

const INTENT_BAR_FILLS = [
  'var(--color-accent)',
  'var(--color-info)',
  'var(--color-text-secondary)',
  'var(--color-success)',
  'var(--color-warning)',
] as const

function IntentFunnelBars({ intentVolume }: { intentVolume: BusinessIntentVolume }) {
  const entries = Object.entries(intentVolume.byIntent).filter(([, v]) => v && v.impressions > 0)
  const total = entries.reduce((s, [, v]) => s + (v?.impressions ?? 0), 0)
  const { sortKey, direction, onSort } = useColumnSort()
  const sortedEntries = useMemo(() => {
    if (!sortKey || total <= 0) return entries
    const copy = [...entries]
    if (sortKey === 'intent') {
      copy.sort((a, b) =>
        direction === 'desc'
          ? b[0].localeCompare(a[0], 'fr')
          : a[0].localeCompare(b[0], 'fr')
      )
    } else if (sortKey === 'pct') {
      copy.sort((a, b) => {
        const pa = a[1].impressions / total
        const pb = b[1].impressions / total
        return direction === 'desc' ? pb - pa : pa - pb
      })
    }
    return copy
  }, [entries, sortKey, direction, total])

  if (total <= 0) {
    return <p className="text-xs text-muted-foreground">—</p>
  }
  return (
    <div className="space-y-2.5">
      <p className="text-[10px] text-muted-foreground">
        Part de chaque intention dans les impressions totales (somme des barres = 100 %).{' '}
        <span className="opacity-90">En-têtes : tri.</span>
      </p>
      <div className="flex items-center gap-2 border-b border-border/60 pb-1.5 text-[10px] text-muted-foreground">
        <button
          type="button"
          className={cn(
            'inline-flex items-center gap-0.5 rounded-sm px-1 py-0.5 transition-colors',
            sortKey === 'intent' ? 'text-foreground' : 'hover:text-foreground'
          )}
          onClick={() => onSort('intent')}
        >
          Intention
          {sortKey === 'intent' && direction === 'desc' && (
            <span className="inline-block opacity-60" aria-hidden>
              ↓
            </span>
          )}
          {sortKey === 'intent' && direction === 'asc' && (
            <span className="inline-block opacity-60" aria-hidden>
              ↑
            </span>
          )}
        </button>
        <button
          type="button"
          className={cn(
            'ml-auto inline-flex items-center gap-0.5 rounded-sm px-1 py-0.5 transition-colors',
            sortKey === 'pct' ? 'text-foreground' : 'hover:text-foreground'
          )}
          onClick={() => onSort('pct')}
        >
          Part
          {sortKey === 'pct' && direction === 'desc' && (
            <span className="inline-block opacity-60" aria-hidden>
              ↓
            </span>
          )}
          {sortKey === 'pct' && direction === 'asc' && (
            <span className="inline-block opacity-60" aria-hidden>
              ↑
            </span>
          )}
        </button>
      </div>
      {sortedEntries.map(([intent, v], i) => (
        <div key={intent} className="flex items-center gap-2 text-xs">
          <span className="w-28 shrink-0 capitalize text-foreground">{intent}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full border border-border/80 bg-muted/80">
            <div
              className="h-full rounded-full"
              style={{
                width: `${total > 0 ? ((v!.impressions / total) * 100) : 0}%`,
                backgroundColor: INTENT_BAR_FILLS[i % INTENT_BAR_FILLS.length],
              }}
            />
          </div>
          <span className="w-10 shrink-0 text-right font-mono text-foreground">
            {formatRatioAsPercent(v!.impressions / total, 0)}
          </span>
        </div>
      ))}
    </div>
  )
}

const SEVERITY_RANK: Record<ContentDecayAlert['severity'], number> = {
  critical: 3,
  alert: 2,
  watch: 1,
}

function CannibalizationSortableTable({ rows }: { rows: CannibalizationRow[] }) {
  const { sortKey, direction, onSort } = useColumnSort()
  const sorted = useMemo(() => {
    const list = [...rows]
    if (!sortKey) return list.slice(0, 8)
    list.sort((a, b) => {
      switch (sortKey) {
        case 'query':
          return direction === 'desc'
            ? b.query.localeCompare(a.query, 'fr', { sensitivity: 'base' })
            : a.query.localeCompare(b.query, 'fr', { sensitivity: 'base' })
        case 'urls':
          return direction === 'desc' ? b.pageCount - a.pageCount : a.pageCount - b.pageCount
        case 'impr':
          return direction === 'desc' ? b.impressions - a.impressions : a.impressions - b.impressions
        default:
          return 0
      }
    })
    return list.slice(0, 8)
  }, [rows, sortKey, direction])

  return (
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
            columnKey="urls"
            activeKey={sortKey}
            direction={direction}
            onSort={onSort}
            align="right"
            title="Trier par nombre d’URLs"
          >
            URLs
          </SortableTableHead>
          <SortableTableHead
            columnKey="impr"
            activeKey={sortKey}
            direction={direction}
            onSort={onSort}
            align="right"
            title="Trier par impressions"
          >
            Impr.
          </SortableTableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((c) => (
          <TableRow key={c.query}>
            <TableCell className="max-w-0 font-mono text-[11px]" title={c.query}>
              {truncate(c.query, 40)}
            </TableCell>
            <TableCell className="text-right font-mono text-xs">{c.pageCount}</TableCell>
            <TableCell className="text-right font-mono text-xs">{formatNumber(c.impressions)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function StrikingDistanceSortableTable({ items }: { items: StrikingDistanceKeyword[] }) {
  const { sortKey, direction, onSort } = useColumnSort()
  const sorted = useMemo(() => {
    const list = [...items]
    if (!sortKey) return list.slice(0, 8)
    list.sort((a, b) => {
      switch (sortKey) {
        case 'query':
          return direction === 'desc'
            ? b.query.localeCompare(a.query, 'fr', { sensitivity: 'base' })
            : a.query.localeCompare(b.query, 'fr', { sensitivity: 'base' })
        case 'pos':
          return direction === 'desc' ? b.position - a.position : a.position - b.position
        case 'impr':
          return direction === 'desc' ? b.impressions - a.impressions : a.impressions - b.impressions
        case 'indice':
          return direction === 'desc'
            ? b.effortVsRewardScore - a.effortVsRewardScore
            : a.effortVsRewardScore - b.effortVsRewardScore
        default:
          return 0
      }
    })
    return list.slice(0, 8)
  }, [items, sortKey, direction])

  return (
    <Table className="[&_th]:text-foreground [&_th]:text-[11px]">
      <TableHeader>
        <TableRow>
          <SortableTableHead
            columnKey="query"
            activeKey={sortKey}
            direction={direction}
            onSort={onSort}
            className="w-[38%]"
            title="Trier par requête"
          >
            Requête
          </SortableTableHead>
          <SortableTableHead
            columnKey="pos"
            activeKey={sortKey}
            direction={direction}
            onSort={onSort}
            align="right"
            title="Trier par position"
          >
            Pos.
          </SortableTableHead>
          <SortableTableHead
            columnKey="impr"
            activeKey={sortKey}
            direction={direction}
            onSort={onSort}
            align="right"
            title="Trier par impressions"
          >
            Impr.
          </SortableTableHead>
          <SortableTableHead
            columnKey="indice"
            activeKey={sortKey}
            direction={direction}
            onSort={onSort}
            align="right"
            title="Score de priorité 0–100 (volume × marge vers le top / effort — voir texte de la carte)"
          >
            Priorité
          </SortableTableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((k) => (
          <TableRow key={`${k.query}-${k.page ?? ''}`}>
            <TableCell className="max-w-0 font-mono text-xs" title={k.query}>
              {truncate(k.query, 48)}
            </TableCell>
            <TableCell className="text-right font-mono text-xs">{k.position.toFixed(1)}</TableCell>
            <TableCell className="text-right font-mono text-xs">{formatNumber(k.impressions)}</TableCell>
            <TableCell className="text-right font-mono text-xs">{k.effortVsRewardScore}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function DecaySortableTable({ alerts }: { alerts: ContentDecayAlert[] }) {
  const { sortKey, direction, onSort } = useColumnSort()
  const sorted = useMemo(() => {
    const list = [...alerts]
    if (!sortKey) return list.slice(0, 6)
    list.sort((a, b) => {
      switch (sortKey) {
        case 'page':
          return direction === 'desc'
            ? b.page.localeCompare(a.page, 'fr', { sensitivity: 'base' })
            : a.page.localeCompare(b.page, 'fr', { sensitivity: 'base' })
        case 'var':
          return direction === 'desc'
            ? b.impressionsDeltaPct - a.impressionsDeltaPct
            : a.impressionsDeltaPct - b.impressionsDeltaPct
        case 'vs':
          return direction === 'desc' ? b.decayExcess - a.decayExcess : a.decayExcess - b.decayExcess
        case 'niveau':
          return direction === 'desc'
            ? SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]
            : SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]
        default:
          return 0
      }
    })
    return list.slice(0, 6)
  }, [alerts, sortKey, direction])

  return (
    <Table className="[&_th]:text-foreground [&_th]:text-[11px]">
      <TableHeader>
        <TableRow>
          <SortableTableHead
            columnKey="page"
            activeKey={sortKey}
            direction={direction}
            onSort={onSort}
            className="w-[40%]"
            title="Trier par URL"
          >
            Page
          </SortableTableHead>
          <SortableTableHead
            columnKey="var"
            activeKey={sortKey}
            direction={direction}
            onSort={onSort}
            align="right"
            title="Trier par variation d’impressions"
          >
            Var. impr.
          </SortableTableHead>
          <SortableTableHead
            columnKey="vs"
            activeKey={sortKey}
            direction={direction}
            onSort={onSort}
            align="right"
            title="Trier par écart vs site"
          >
            vs site (pp)
          </SortableTableHead>
          <SortableTableHead
            columnKey="niveau"
            activeKey={sortKey}
            direction={direction}
            onSort={onSort}
            align="right"
            title="Trier par gravité"
          >
            Niveau
          </SortableTableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((a) => (
          <TableRow key={a.page}>
            <TableCell className="max-w-0 font-mono text-[11px]" title={a.page}>
              {truncate(a.page, 56)}
            </TableCell>
            <TableCell className="text-right font-mono text-xs">{formatPercentSigned(a.impressionsDeltaPct, 1)}</TableCell>
            <TableCell className="text-right font-mono text-xs">{formatPercentSigned(a.decayExcess, 1)}</TableCell>
            <TableCell className="text-right">{severityBadge(a.severity)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export function StrategicModuleGrid({
  snapshot,
  loading,
  error,
  connected,
  hasSite,
  rowCount,
}: {
  snapshot: BiDashboardSnapshot | null
  loading: boolean
  error: string | null
  connected: boolean
  hasSite: boolean
  rowCount: number
}) {
  const emptyMessage = !connected
    ? 'Connectez Google Search Console pour charger les données.'
    : !hasSite
      ? 'Sélectionnez une propriété GSC (en-tête).'
      : error
        ? error
        : 'Aucune donnée pour cette fenêtre.'

  return (
    <motion.div layout className="flex flex-col gap-6">
      {snapshot ? (
        <>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Analyse Search Console
          </p>

          <div className="flex flex-col gap-3">
            <DataFoundationsCard meta={snapshot.dataLoadMeta} />

            <ModuleCard
              title="Tendance organique"
              subtitle="Clics et impressions par jour (MM-JJ)"
              logic="Chaque point = un jour. Courbe pleine : fenêtre actuelle ; pointillés : période de référence, jour aligné par rang (1er jour avec 1er jour, etc.), pas par date calendaire identique."
              delay={0.02}
              className="col-span-full"
            >
              {snapshot.trendChart.length === 0 ? (
                <p className="text-xs text-muted-foreground">Pas de série journalière.</p>
              ) : (
                <div className="space-y-4">
                  <AreaChartCard
                    data={snapshot.trendChart}
                    xKey="label"
                    height={200}
                    xAxisLabel="Jour (MM-JJ)"
                    lines={[
                      { key: 'clicks', label: 'Clics' },
                      { key: 'clicksPrev', label: 'Clics (période préc.)', dashed: true },
                    ]}
                    formatter={formatNumber}
                  />
                  <AreaChartCard
                    data={snapshot.trendChart}
                    xKey="label"
                    height={180}
                    xAxisLabel="Jour (MM-JJ)"
                    lines={[
                      { key: 'impressions', label: 'Impressions' },
                      { key: 'impressionsPrev', label: 'Impr. (période préc.)', dashed: true },
                    ]}
                    formatter={formatCompact}
                  />
                </div>
              )}
            </ModuleCard>

            <ClickDriversCard drivers={snapshot.clickDrivers} />

            <div className="grid gap-3 lg:grid-cols-2">
              <ModuleCard
                title="Top gains (requêtes)"
                subtitle="Δ clics vs période précédente"
                logic="Requêtes avec les plus fortes hausses de clics entre les deux fenêtres (agrégées par requête sur toutes les URLs)."
                delay={0.06}
              >
                <MoversTable rows={snapshot.topGains} gain />
              </ModuleCard>
              <ModuleCard
                title="Top pertes (requêtes)"
                subtitle="Δ clics vs période précédente"
                logic="Requêtes avec les plus fortes baisses de clics (même agrégation que les gains)."
                delay={0.07}
              >
                <MoversTable rows={snapshot.topLosses} gain={false} />
              </ModuleCard>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <ModuleCard
                title="Striking distance"
                subtitle="Positions 4–12 · volume d’impressions minimal"
                logic="Fenêtre « proche du top 3 » : assez de trafic pour viser une montée. Priorité (0–100) combine volume (log), marge vers la 1re place (plus la position est basse dans la fenêtre, plus la marge est grande) et un coût d’effort (position plus haute = moins coûteux à pousser). Ce n’est pas un CTR ni un classement Google."
                delay={0.08}
              >
                {snapshot.strikingDistance.items.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Aucun mot-clé en striking distance pour ces seuils (positions 4–12, impressions minimales).
                  </p>
                ) : (
                  <StrikingDistanceSortableTable items={snapshot.strikingDistance.items} />
                )}
              </ModuleCard>

              <ModuleCard
                title="Santé & déclin"
                subtitle="Pages vs dynamique globale du site"
                logic="Pour chaque URL : variation d’impressions vs période précédente, comparée à la variation moyenne du site. « vs site » mesure si la page décroît plus vite que le reste (points de % d’écart)."
                delay={0.09}
              >
                {snapshot.decay.alerts.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Aucune page en déclin marqué par rapport à la moyenne site sur cette période.
                  </p>
                ) : (
                  <DecaySortableTable alerts={snapshot.decay.alerts} />
                )}
              </ModuleCard>

              <ModuleCard
                title="Intent & conversion proxy"
                subtitle="Volume pondéré par intention (heuristique FR)"
                logic="Chaque requête est étiquetée (informationnel, transactionnel, etc.) par mots-clés français. Le volume « business » = Σ impressions × poids (plus le libellé est proche de l’achat, plus le poids est élevé). Proxy d’intention, pas de mesure de conversion réelle."
                delay={0.1}
                className="lg:col-span-2"
              >
                <div className="space-y-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Business intent volume</p>
                    <p className="font-mono text-lg text-foreground">
                      {formatCompact(snapshot.intentVolume.businessIntentVolume)}
                    </p>
                  </div>
                  <IntentFunnelBars intentVolume={snapshot.intentVolume} />
                  <ul className="space-y-1.5 border-t border-border/80 pt-3 text-xs text-muted-foreground">
                    {Object.entries(snapshot.intentVolume.byIntent).map(([intent, v]) =>
                      v ? (
                        <li key={intent} className="flex justify-between gap-4">
                          <span className="capitalize">{intent}</span>
                          <span className="font-mono text-foreground">
                            {formatCompact(v.impressions)} impr. · {formatNumber(v.clicks)} clics
                          </span>
                        </li>
                      ) : null
                    )}
                  </ul>
                </div>
              </ModuleCard>
            </div>

            <ModuleCard
              title="Cannibalisation"
              subtitle="Même requête, plusieurs URLs"
              logic="Une requête apparaît si GSC renvoie au moins deux URLs distinctes avec un volume d’impressions minimal — le trafic se répartit sur plusieurs pages."
              delay={0.11}
              className="col-span-full"
            >
              {snapshot.cannibalization.length === 0 ? (
                <p className="text-xs text-muted-foreground">Aucune requête multi-URL significative.</p>
              ) : (
                <CannibalizationSortableTable rows={snapshot.cannibalization} />
              )}
            </ModuleCard>

            <ModuleCard
              title="EDA — Position × impressions"
              subtitle="Une requête = un point (agrégé)"
              logic="Abscisse : position moyenne GSC (1 = meilleur rang à gauche). Ordonnée : impressions (log). Utile pour repérer du trafic visible avec une mauvaise position, ou l’inverse."
              delay={0.12}
              className="col-span-full"
            >
              <PlotQueryScatter data={snapshot.scatterQueryPoints} />
            </ModuleCard>
          </div>
        </>
      ) : !loading ? (
        <p className="text-xs text-muted-foreground">{emptyMessage}</p>
      ) : (
        <p className="text-xs text-muted-foreground">Chargement…</p>
      )}

      {connected && hasSite && !loading && !error && rowCount === 0 ? (
        <p className="text-center text-xs text-muted-foreground">
          0 ligne renvoyée par l’API pour cette fenêtre. Élargissez les dates ou vérifiez la propriété.
        </p>
      ) : null}
    </motion.div>
  )
}

function MoversTable({ rows, gain }: { rows: BiDashboardSnapshot['topGains']; gain: boolean }) {
  const { sortKey, direction, onSort } = useColumnSort()
  const sorted = useMemo(() => {
    if (rows.length === 0) return rows
    if (!sortKey) return rows.slice(0, 8)
    const copy = [...rows]
    if (sortKey === 'query') {
      copy.sort((a, b) =>
        direction === 'desc'
          ? b.query.localeCompare(a.query, 'fr', { sensitivity: 'base' })
          : a.query.localeCompare(b.query, 'fr', { sensitivity: 'base' })
      )
    } else {
      copy.sort((a, b) =>
        direction === 'desc' ? b.delta - a.delta : a.delta - b.delta
      )
    }
    return copy.slice(0, 8)
  }, [rows, sortKey, direction])

  if (rows.length === 0) {
    return <p className="text-xs text-muted-foreground">—</p>
  }
  const deltaColor = gain ? 'text-[color:var(--color-success)]' : 'text-[color:var(--color-danger)]'
  return (
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
            title="Trier par Δ clics"
          >
            Δ clics
          </SortableTableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((m) => (
          <TableRow key={m.query}>
            <TableCell className="max-w-0 font-mono text-[11px]" title={m.query}>
              {truncate(m.query, 36)}
            </TableCell>
            <TableCell className={cn('text-right font-mono text-xs', deltaColor)}>
              {gain ? '+' : ''}
              {formatNumber(m.delta)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function ModuleCard({
  title,
  subtitle,
  logic,
  delay,
  className,
  children,
}: {
  title: string
  subtitle: string
  /** Détail méthode / lecture — survol de l’icône ℹ️ */
  logic?: string
  delay: number
  className?: string
  children: ReactNode
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 32, delay }}
      className={className}
    >
      <Card className="border-border bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-1">
              <h2 className="text-sm font-medium tracking-tight text-foreground">{title}</h2>
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
            {logic ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="mt-0.5 shrink-0 rounded-md p-1 text-muted-foreground/65 transition-colors hover:bg-muted/50 hover:text-muted-foreground"
                    aria-label="Comment lire ce bloc"
                  >
                    <Info className="size-3.5" aria-hidden />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-[min(92vw,22rem)] text-left leading-relaxed">
                  {logic}
                </TooltipContent>
              </Tooltip>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="min-h-[80px] border-t border-border/80 pt-4">{children}</CardContent>
      </Card>
    </motion.div>
  )
}
