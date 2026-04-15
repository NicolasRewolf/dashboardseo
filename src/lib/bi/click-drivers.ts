import { sumClicks, sumImpressions } from '@/lib/bi/calculations'
import type { ClickBridgeAggregate, ClickDriversResult, QueryClickDriver } from '@/types/bi'
import type { GscNormalizedRow } from '@/types/gsc'

function aggregateByQuery(rows: GscNormalizedRow[]): Map<string, { clicks: number; impressions: number }> {
  const m = new Map<string, { clicks: number; impressions: number }>()
  for (const r of rows) {
    const q = r.query ?? ''
    if (!q) continue
    const cur = m.get(q) ?? { clicks: 0, impressions: 0 }
    cur.clicks += r.clicks
    cur.impressions += r.impressions
    m.set(q, cur)
  }
  return m
}

function safeCtr(clicks: number, impressions: number): number {
  return impressions > 0 ? clicks / impressions : 0
}

export function buildAggregateClickBridge(
  currentRows: GscNormalizedRow[],
  previousRows: GscNormalizedRow[]
): ClickBridgeAggregate {
  const clicksCurrent = sumClicks(currentRows)
  const clicksPrevious = sumClicks(previousRows)
  const impressionsCurrent = sumImpressions(currentRows)
  const impressionsPrevious = sumImpressions(previousRows)
  const ctrCurrent = safeCtr(clicksCurrent, impressionsCurrent)
  const ctrPrevious = safeCtr(clicksPrevious, impressionsPrevious)
  const deltaClicks = clicksCurrent - clicksPrevious
  const volumeEffectClicks = (impressionsCurrent - impressionsPrevious) * ctrPrevious
  const ctrEffectClicks = impressionsCurrent * (ctrCurrent - ctrPrevious)
  return {
    clicksCurrent,
    clicksPrevious,
    impressionsCurrent,
    impressionsPrevious,
    ctrCurrent,
    ctrPrevious,
    deltaClicks,
    volumeEffectClicks,
    ctrEffectClicks,
  }
}

export function buildClickDrivers(
  currentRows: GscNormalizedRow[],
  previousRows: GscNormalizedRow[],
  topN = 18
): ClickDriversResult {
  const aggregate = buildAggregateClickBridge(currentRows, previousRows)
  const curByQ = aggregateByQuery(currentRows)
  const prevByQ = aggregateByQuery(previousRows)
  const allQueries = new Set<string>([...curByQ.keys(), ...prevByQ.keys()])

  const drivers: QueryClickDriver[] = []
  for (const query of allQueries) {
    const c = curByQ.get(query) ?? { clicks: 0, impressions: 0 }
    const p = prevByQ.get(query) ?? { clicks: 0, impressions: 0 }
    const ctrP = safeCtr(p.clicks, p.impressions)
    const ctrC = safeCtr(c.clicks, c.impressions)
    const deltaClicks = c.clicks - p.clicks
    const volumeEffectClicks = (c.impressions - p.impressions) * ctrP
    const ctrEffectClicks = c.impressions * (ctrC - ctrP)
    drivers.push({
      query,
      clicksCur: c.clicks,
      clicksPrev: p.clicks,
      impressionsCur: c.impressions,
      impressionsPrev: p.impressions,
      deltaClicks,
      volumeEffectClicks,
      ctrEffectClicks,
      pctOfTotalAbsDelta: null,
    })
  }

  /** Σ |Δ clics| sur toutes les requêtes — base stable pour une part 0–100 % (le Δ net peut être ~0). */
  let grossAbsDelta = 0
  for (const d of drivers) {
    grossAbsDelta += Math.abs(d.deltaClicks)
  }
  for (const d of drivers) {
    d.pctOfTotalAbsDelta =
      grossAbsDelta > 0 ? (Math.abs(d.deltaClicks) / grossAbsDelta) * 100 : null
  }

  drivers.sort((a, b) => Math.abs(b.deltaClicks) - Math.abs(a.deltaClicks))

  return {
    aggregate,
    topDrivers: drivers.slice(0, topN),
  }
}
