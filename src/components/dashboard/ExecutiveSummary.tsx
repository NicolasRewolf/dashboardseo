import { Card, Metric, Text, Title } from '@tremor/react'

import { formatCompact, formatPercent, formatPercentSigned } from '@/lib/format'
import type { ExecutiveNorthStar } from '@/types/bi'

function MetricValue({
  value,
  format,
  loading: loadingMetric,
}: {
  value: number | null
  format: 'share' | 'velocity' | 'index'
  loading?: boolean
}) {
  if (loadingMetric) {
    return <span className="text-muted-foreground">…</span>
  }
  if (value === null) {
    return <span className="text-muted-foreground">—</span>
  }
  if (format === 'share') return <>{formatPercent(value * 100, 1)}</>
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
    <div className="grid gap-3 sm:grid-cols-3">
      <Card
        className="border-border bg-card !bg-card text-card-foreground ring-0"
        decoration="top"
        decorationColor="neutral"
      >
        <Text className="text-muted-foreground">Part de marché estimée</Text>
        <Metric className="font-mono text-foreground">
          <MetricValue value={northStar.estimatedMarketShare} format="share" loading={loading} />
        </Metric>
        <Title className="text-muted-foreground">SERPs adressables (modèle)</Title>
      </Card>
      <Card
        className="border-border bg-card !bg-card text-card-foreground ring-0"
        decoration="top"
        decorationColor="neutral"
      >
        <Text className="text-muted-foreground">Vélocité organique</Text>
        <Metric className="font-mono text-foreground">
          <MetricValue value={northStar.organicGrowthVelocity} format="velocity" loading={loading} />
        </Metric>
        <Title className="text-muted-foreground">vs période précédente</Title>
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
        <Title className="text-muted-foreground">Volume pondéré intent</Title>
      </Card>
    </div>
  )
}
