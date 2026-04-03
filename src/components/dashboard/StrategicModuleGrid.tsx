import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { formatCompact, formatNumber, formatPercent, formatPercentSigned } from '@/lib/format'
import { getSpecialtyLabel } from '@/lib/bi/labels'
import type { BiDashboardSnapshot } from '@/types/bi'
import type { LegalSpecialtyId } from '@/types/specialties'

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

export function StrategicModuleGrid({
  specialtyId,
  snapshot,
  loading,
  error,
  connected,
  hasSite,
  rowCount,
}: {
  specialtyId: LegalSpecialtyId | null
  snapshot: BiDashboardSnapshot | null
  loading: boolean
  error: string | null
  connected: boolean
  hasSite: boolean
  rowCount: number
}) {
  const filterLabel = specialtyId ? getSpecialtyLabel(specialtyId) : null

  const emptyMessage = !connected
    ? 'Connectez Google Search Console pour charger les données.'
    : !hasSite
      ? 'Sélectionnez une propriété GSC (en-tête).'
      : error
        ? error
        : 'Aucune donnée pour cette fenêtre.'

  return (
    <motion.div layout className="grid gap-3 lg:grid-cols-2">
      <ModuleCard
        title="Striking distance"
        subtitle="Positions 4–12 · Opportunités immédiates"
        filterLabel={filterLabel}
        delay={0}
      >
        {snapshot && !loading ? (
          snapshot.strikingDistance.items.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Aucun mot-clé en striking distance pour ces seuils (positions 4–12, impressions
              minimales).
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[38%]">Requête</TableHead>
                  <TableHead className="text-right">Pos.</TableHead>
                  <TableHead className="text-right">Impr.</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {snapshot.strikingDistance.items.slice(0, 8).map((k) => (
                  <TableRow key={`${k.query}-${k.page ?? ''}`}>
                    <TableCell className="max-w-0 font-mono text-xs" title={k.query}>
                      {truncate(k.query, 48)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">{k.position.toFixed(1)}</TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {formatNumber(k.impressions)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">{k.effortVsRewardScore}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )
        ) : (
          <p className="text-xs text-muted-foreground">{loading ? 'Chargement…' : emptyMessage}</p>
        )}
      </ModuleCard>

      <ModuleCard
        title="Piliers sémantiques"
        subtitle="Clics par spécialité (URL → pilier)"
        filterLabel={filterLabel}
        delay={0.04}
      >
        {snapshot && !loading ? (
          snapshot.pillarPerformance.pillars.length === 0 ? (
            <p className="text-xs text-muted-foreground">{emptyMessage}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pilier</TableHead>
                  <TableHead className="text-right">Clics</TableHead>
                  <TableHead className="text-right">Part</TableHead>
                  <TableHead className="text-right">Pos. moy.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {snapshot.pillarPerformance.pillars.slice(0, 10).map((p) => (
                  <TableRow key={p.specialtyId}>
                    <TableCell className="text-xs">{getSpecialtyLabel(p.specialtyId)}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{formatNumber(p.clicks)}</TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {formatPercent(p.clickShare * 100, 1)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">{p.weightedPosition.toFixed(1)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )
        ) : (
          <p className="text-xs text-muted-foreground">{loading ? 'Chargement…' : emptyMessage}</p>
        )}
      </ModuleCard>

      <ModuleCard
        title="Santé & déclin"
        subtitle="Pages vs dynamique globale du site"
        filterLabel={filterLabel}
        delay={0.08}
      >
        {snapshot && !loading ? (
          snapshot.decay.alerts.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Aucune page en déclin marqué par rapport à la moyenne site sur cette période.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Page</TableHead>
                  <TableHead className="text-right">Δ impr.</TableHead>
                  <TableHead className="text-right">Excès</TableHead>
                  <TableHead className="text-right">Niveau</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {snapshot.decay.alerts.slice(0, 6).map((a) => (
                  <TableRow key={a.page}>
                    <TableCell className="max-w-0 font-mono text-[11px]" title={a.page}>
                      {truncate(a.page, 56)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {formatPercentSigned(a.impressionsDeltaPct, 1)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {formatPercentSigned(a.decayExcess, 1)}
                    </TableCell>
                    <TableCell className="text-right">{severityBadge(a.severity)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )
        ) : (
          <p className="text-xs text-muted-foreground">{loading ? 'Chargement…' : emptyMessage}</p>
        )}
      </ModuleCard>

      <ModuleCard
        title="Intent & conversion proxy"
        subtitle="Volume pondéré par intention (heuristique FR)"
        filterLabel={filterLabel}
        delay={0.12}
      >
        {snapshot && !loading ? (
          <div className="space-y-3">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Business intent volume
              </p>
              <p className="font-mono text-lg text-foreground">
                {formatCompact(snapshot.intentVolume.businessIntentVolume)}
              </p>
            </div>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
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
        ) : (
          <p className="text-xs text-muted-foreground">{loading ? 'Chargement…' : emptyMessage}</p>
        )}
      </ModuleCard>

      {connected && hasSite && !loading && !error && rowCount === 0 ? (
        <p className="col-span-full text-center text-xs text-muted-foreground">
          0 ligne renvoyée par l’API pour cette fenêtre. Élargissez les dates ou vérifiez la
          propriété.
        </p>
      ) : null}
    </motion.div>
  )
}

function ModuleCard({
  title,
  subtitle,
  filterLabel,
  delay,
  children,
}: {
  title: string
  subtitle: string
  filterLabel: string | null
  delay: number
  children: ReactNode
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 32, delay }}
    >
      <Card
        className={cn(
          'border-border bg-card/80 backdrop-blur-sm',
          filterLabel && 'border-primary/40'
        )}
      >
        <CardHeader className="space-y-1 pb-3">
          <h2 className="text-sm font-medium tracking-tight text-foreground">{title}</h2>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
          {filterLabel ? (
            <p className="text-[11px] font-mono text-primary">Filtre : {filterLabel}</p>
          ) : null}
        </CardHeader>
        <CardContent className="min-h-[120px] border-t border-border/80 pt-4">{children}</CardContent>
      </Card>
    </motion.div>
  )
}
