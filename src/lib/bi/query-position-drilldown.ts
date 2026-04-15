import { normalizeGscRows } from '@/lib/bi/gsc-normalize'
import { pageSegmentToGscFilters } from '@/lib/bi/page-segment'
import { searchAnalyticsQuery } from '@/lib/gsc/api'
import type { DailyTrendPoint, DashboardDateRange, PageSegmentMode } from '@/types/bi'
import type { GscDimension } from '@/types/gsc'

const DATE_QUERY_DIMS: GscDimension[] = ['date', 'query']

/**
 * Série journalière position (pondérée GSC) par requête — pour drill-down courbe position.
 */
export async function fetchQueryPositionDailySeries(
  accessToken: string,
  siteUrl: string,
  dateRange: DashboardDateRange,
  queries: string[],
  pageSegment: PageSegmentMode
): Promise<Map<string, DailyTrendPoint[]>> {
  const out = new Map<string, DailyTrendPoint[]>()
  const q = [...new Set(queries.map((s) => s.trim()).filter(Boolean))].slice(0, 12)
  if (q.length === 0) return out

  const pageGroups = pageSegmentToGscFilters(pageSegment) ?? []
  const res = await searchAnalyticsQuery(accessToken, siteUrl, {
    startDate: dateRange.start,
    endDate: dateRange.end,
    dimensions: DATE_QUERY_DIMS,
    rowLimit: 25_000,
    dataState: 'final',
    dimensionFilterGroups: [
      ...pageGroups,
      {
        groupType: 'or',
        filters: q.map((expression) => ({
          dimension: 'query' as const,
          operator: 'equals' as const,
          expression,
        })),
      },
    ],
  })

  const norm = normalizeGscRows(DATE_QUERY_DIMS, res.rows)
  const byQuery = new Map<string, DailyTrendPoint[]>()

  for (const r of norm) {
    if (!r.query || !r.date) continue
    const list = byQuery.get(r.query) ?? []
    list.push({
      date: r.date,
      clicks: r.clicks,
      impressions: r.impressions,
      position: r.position,
    })
    byQuery.set(r.query, list)
  }

  for (const [key, points] of byQuery) {
    points.sort((a, b) => a.date.localeCompare(b.date))
    out.set(key, points)
  }

  return out
}
