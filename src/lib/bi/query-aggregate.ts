import type { GscNormalizedRow } from '@/types/gsc'

export interface GscQueryAggregate {
  query: string
  impressions: number
  clicks: number
  /** Position moyenne pondérée par impressions. */
  position: number
}

/**
 * Agrège les lignes query×page GSC en une ligne par requête (somme des impressions / clics).
 */
export function aggregateGscRowsByQuery(rows: GscNormalizedRow[]): GscQueryAggregate[] {
  const m = new Map<string, { imp: number; clk: number; posW: number }>()
  for (const r of rows) {
    const q = r.query?.trim()
    if (!q) continue
    const cur = m.get(q) ?? { imp: 0, clk: 0, posW: 0 }
    cur.imp += r.impressions
    cur.clk += r.clicks
    cur.posW += r.position * r.impressions
    m.set(q, cur)
  }
  const out: GscQueryAggregate[] = []
  for (const [query, v] of m) {
    out.push({
      query,
      impressions: v.imp,
      clicks: v.clk,
      position: v.imp > 0 ? v.posW / v.imp : 0,
    })
  }
  return out.sort((a, b) => b.impressions - a.impressions)
}
