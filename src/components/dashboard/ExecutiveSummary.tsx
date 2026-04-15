import { Card, Metric, Text, Title } from '@tremor/react'
import { Info } from 'lucide-react'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

import { formatCompact, formatPercentSigned } from '@/lib/format'
import type { ExecutiveNorthStar } from '@/types/bi'

function MetricValue({
  value,
  format,
  loading: loadingMetric,
}: {
  value: number | null
  format: 'velocity' | 'index'
  loading?: boolean
}) {
  if (loadingMetric) {
    return <span className="text-muted-foreground">…</span>
  }
  if (value === null) {
    return <span className="text-muted-foreground">—</span>
  }
  if (format === 'velocity') return <>{formatPercentSigned(value, 1)}</>
  return <>{formatCompact(value)}</>
}

export function ExecutiveSummary({
  northStar,
  loading,
}: {
  northStar: ExecutiveNorthStar
  loading?: boolean
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Card
        className="border-border bg-card !bg-card text-card-foreground ring-0"
        decoration="top"
        decorationColor="neutral"
      >
        <Text className="text-muted-foreground">Vélocité organique</Text>
        <Metric className="font-mono text-foreground">
          <MetricValue value={northStar.organicGrowthVelocity} format="velocity" loading={loading} />
        </Metric>
        <div className="mt-1 flex items-start justify-between gap-2">
          <Title className="text-muted-foreground">Variation des clics vs période précédente (en %)</Title>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="mt-0.5 shrink-0 rounded-md p-1 text-muted-foreground/65 transition-colors hover:bg-muted/50 hover:text-muted-foreground"
                aria-label="Formule"
              >
                <Info className="size-3.5" aria-hidden />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs text-left leading-relaxed">
              <span className="font-mono">(clics actuels − clics réf.) / clics réf.</span> sur le périmètre filtré
              (dates, marque, pages).
            </TooltipContent>
          </Tooltip>
        </div>
      </Card>
      <Card
        className="border-border bg-card !bg-card text-card-foreground ring-0"
        decoration="top"
        decorationColor="neutral"
      >
        <Text className="text-muted-foreground">Proxy leads haute intention</Text>
        <Metric className="font-mono text-foreground">
          <MetricValue value={northStar.highIntentLeadProxy} format="index" loading={loading} />
        </Metric>
        <div className="mt-1 flex items-start justify-between gap-2">
          <Title className="text-muted-foreground">Volume pondéré intent</Title>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="mt-0.5 shrink-0 rounded-md p-1 text-muted-foreground/65 transition-colors hover:bg-muted/50 hover:text-muted-foreground"
                aria-label="Définition de l’indice"
              >
                <Info className="size-3.5" aria-hidden />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs text-left leading-relaxed">
              Σ <span className="font-mono">impressions × poids</span> par intention (heuristique FR, plus fort
              pour le transactionnel). Indice de « demande qualifiée », pas un comptage de leads.
            </TooltipContent>
          </Tooltip>
        </div>
      </Card>
    </div>
  )
}
