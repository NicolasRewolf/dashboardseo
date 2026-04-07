import type {
  CannibalizationRow,
  DailyTrendPoint,
  QueryMover,
  QueryScatterPoint,
} from '@/types/bi'
import type { GscNormalizedRow, GscSearchAnalyticsRow } from '@/types/gsc'

export function normalizeDailyRows(rows: GscSearchAnalyticsRow[]): DailyTrendPoint[] {
  return rows
    .map((r) => ({
      date: r.keys[0] ?? '',
      clicks: r.clicks,
      impressions: r.impressions,
      position: r.position,
    }))
    .filter((d) => d.date)
    .sort((a, b) => a.date.localeCompare(b.date))
}

function aggregateClicksByQuery(rows: GscNormalizedRow[]): Map<string, number> {
  const m = new Map<string, number>()
  for (const r of rows) {
    if (!r.query) continue
    m.set(r.query, (m.get(r.query) ?? 0) + r.clicks)
  }
  return m
}

export function buildTopMovers(
  cur: GscNormalizedRow[],
  prev: GscNormalizedRow[],
  topN: number
): { gains: QueryMover[]; losses: QueryMover[] } {
  const curM = aggregateClicksByQuery(cur)
  const prevM = aggregateClicksByQuery(prev)
  const all = new Set([...curM.keys(), ...prevM.keys()])
  const movers: QueryMover[] = []
  for (const q of all) {
    const c = curM.get(q) ?? 0
    const p = prevM.get(q) ?? 0
    const delta = c - p
    movers.push({
      query: q,
      clicksCur: c,
      clicksPrev: p,
      delta,
      deltaPct: p > 0 ? ((c - p) / p) * 100 : c > 0 ? 100 : 0,
    })
  }
  const gains = [...movers]
    .filter((m) => m.delta > 0)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, topN)
  const losses = [...movers]
    .filter((m) => m.delta < 0)
    .sort((a, b) => a.delta - b.delta)
    .slice(0, topN)
  return { gains, losses }
}

export function buildCannibalization(rows: GscNormalizedRow[], minImpr = 20): CannibalizationRow[] {
  const byQuery = new Map<string, { pages: Set<string>; impressions: number }>()
  for (const r of rows) {
    if (!r.query || !r.page) continue
    const slot = byQuery.get(r.query) ?? { pages: new Set<string>(), impressions: 0 }
    slot.pages.add(r.page)
    slot.impressions += r.impressions
    byQuery.set(r.query, slot)
  }
  return [...byQuery.entries()]
    .filter(([, v]) => v.pages.size > 1 && v.impressions >= minImpr)
    .map(([query, v]) => ({
      query,
      pageCount: v.pages.size,
      impressions: v.impressions,
      pages: [...v.pages].slice(0, 6),
    }))
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 20)
}

export function buildQueryScatterPoints(
  rows: GscNormalizedRow[],
  limit = 400
): QueryScatterPoint[] {
  const byQuery = new Map<string, { imp: number; posW: number }>()
  for (const r of rows) {
    if (!r.query) continue
    const cur = byQuery.get(r.query) ?? { imp: 0, posW: 0 }
    cur.imp += r.impressions
    cur.posW += r.position * r.impressions
    byQuery.set(r.query, cur)
  }
  const pts: QueryScatterPoint[] = []
  for (const [query, v] of byQuery) {
    if (v.imp < 1) continue
    pts.push({
      query,
      impressions: v.imp,
      position: v.imp > 0 ? v.posW / v.imp : 0,
    })
  }
  pts.sort((a, b) => b.impressions - a.impressions)
  return pts.slice(0, limit)
}

export function mergeTrendChartSeries(
  current: DailyTrendPoint[],
  previous: DailyTrendPoint[]
): Record<string, unknown>[] {
  const n = Math.min(current.length, previous.length)
  const out: Record<string, unknown>[] = []
  for (let i = 0; i < n; i++) {
    const c = current[i]!
    const p = previous[i]!
    out.push({
      label: c.date.slice(5),
      clicks: c.clicks,
      impressions: c.impressions,
      clicksPrev: p.clicks,
      impressionsPrev: p.impressions,
    })
  }
  return out
}
