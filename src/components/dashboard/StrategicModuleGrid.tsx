import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

import { AreaChartCard } from '@/components/charts/AreaChartCard'
import { PlotQueryScatter } from '@/components/charts/PlotQueryScatter'
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
import type { BiDashboardSnapshot, BusinessIntentVolume } from '@/types/bi'

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
  if (total <= 0) {
    return <p className="text-xs text-muted-foreground">—</p>
  }
  return (
    <div className="space-y-2.5">
      {entries.map(([intent, v], i) => (
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
            {formatPercent((v!.impressions / total) * 100, 0)}
          </span>
        </div>
      ))}
    </div>
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
    <motion.div layout className="flex flex-col gap-3">
      {snapshot ? (
        <>
          <ModuleCard title="Tendance organique" subtitle="Clics & impressions — jour par jour vs période précédente (alignement par rang)" delay={0} className="col-span-full">
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

          <div className="grid gap-3 lg:grid-cols-2">
            <ModuleCard title="Top gains (requêtes)" subtitle="Δ clics vs période précédente" delay={0.03}>
              <MoversTable rows={snapshot.topGains} gain />
            </ModuleCard>
            <ModuleCard title="Top pertes (requêtes)" subtitle="Δ clics vs période précédente" delay={0.04}>
              <MoversTable rows={snapshot.topLosses} gain={false} />
            </ModuleCard>
          </div>

          <ModuleCard title="Cannibalisation" subtitle="Même requête, plusieurs URLs" delay={0.05} className="col-span-full">
            {snapshot.cannibalization.length === 0 ? (
              <p className="text-xs text-muted-foreground">Aucune requête multi-URL significative.</p>
            ) : (
              <Table className="[&_th]:text-foreground [&_th]:text-[11px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Requête</TableHead>
                    <TableHead className="text-right">URLs</TableHead>
                    <TableHead className="text-right">Impr.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {snapshot.cannibalization.slice(0, 8).map((c) => (
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
            )}
          </ModuleCard>

          <ModuleCard title="EDA — Position × impressions" subtitle="Une requête = un point (agrégé)" delay={0.06} className="col-span-full">
            <PlotQueryScatter data={snapshot.scatterQueryPoints} />
          </ModuleCard>
        </>
      ) : !loading ? (
        <p className="text-xs text-muted-foreground">{emptyMessage}</p>
      ) : (
        <p className="text-xs text-muted-foreground">Chargement…</p>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        <ModuleCard title="Striking distance" subtitle="Positions 4–12 · Opportunités immédiates" delay={0.07}>
          {snapshot && !loading ? (
            snapshot.strikingDistance.items.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Aucun mot-clé en striking distance pour ces seuils (positions 4–12, impressions minimales).
              </p>
            ) : (
              <Table className="[&_th]:text-foreground [&_th]:text-[11px]">
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
                      <TableCell className="text-right font-mono text-xs">{formatNumber(k.impressions)}</TableCell>
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

        <ModuleCard title="Santé & déclin" subtitle="Pages vs dynamique globale du site" delay={0.08}>
          {snapshot && !loading ? (
            snapshot.decay.alerts.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Aucune page en déclin marqué par rapport à la moyenne site sur cette période.
              </p>
            ) : (
              <Table className="[&_th]:text-foreground [&_th]:text-[11px]">
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
                      <TableCell className="text-right font-mono text-xs">{formatPercentSigned(a.impressionsDeltaPct, 1)}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{formatPercentSigned(a.decayExcess, 1)}</TableCell>
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
          delay={0.09}
          className="lg:col-span-2"
        >
          {snapshot && !loading ? (
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
          ) : (
            <p className="text-xs text-muted-foreground">{loading ? 'Chargement…' : emptyMessage}</p>
          )}
        </ModuleCard>
      </div>

      {connected && hasSite && !loading && !error && rowCount === 0 ? (
        <p className="text-center text-xs text-muted-foreground">
          0 ligne renvoyée par l’API pour cette fenêtre. Élargissez les dates ou vérifiez la propriété.
        </p>
      ) : null}
    </motion.div>
  )
}

function MoversTable({ rows, gain }: { rows: BiDashboardSnapshot['topGains']; gain: boolean }) {
  if (rows.length === 0) {
    return <p className="text-xs text-muted-foreground">—</p>
  }
  const deltaColor = gain ? 'text-[color:var(--color-success)]' : 'text-[color:var(--color-danger)]'
  return (
    <Table className="[&_th]:text-foreground [&_th]:text-[11px]">
      <TableHeader>
        <TableRow>
          <TableHead>Requête</TableHead>
          <TableHead className="text-right">Δ clics</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.slice(0, 8).map((m) => (
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
  delay,
  className,
  children,
}: {
  title: string
  subtitle: string
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
        <CardHeader className="space-y-1 pb-3">
          <h2 className="text-sm font-medium tracking-tight text-foreground">{title}</h2>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </CardHeader>
        <CardContent className="min-h-[80px] border-t border-border/80 pt-4">{children}</CardContent>
      </Card>
    </motion.div>
  )
}
