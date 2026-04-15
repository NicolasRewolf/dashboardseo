import { useEffect, useState } from 'react'

import { fetchQueryPositionDailySeries } from '@/lib/bi/query-position-drilldown'
import { getValidAccessToken } from '@/lib/gsc/oauth-client'
import type { DailyTrendPoint, DashboardDateRange, PageSegmentMode } from '@/types/bi'

export function useQueryPositionDrilldown(
  siteUrl: string | null,
  dateRange: DashboardDateRange | null,
  pageSegment: PageSegmentMode,
  selectedQueries: string[]
): { seriesByQuery: Map<string, DailyTrendPoint[]>; loading: boolean } {
  const [seriesByQuery, setSeriesByQuery] = useState<Map<string, DailyTrendPoint[]>>(new Map())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!siteUrl || !dateRange || selectedQueries.length === 0) {
      setSeriesByQuery(new Map())
      return
    }

    let cancelled = false
    setLoading(true)

    ;(async () => {
      const token = await getValidAccessToken()
      if (!token || cancelled) {
        if (!cancelled) setLoading(false)
        return
      }
      try {
        const m = await fetchQueryPositionDailySeries(token, siteUrl, dateRange, selectedQueries, pageSegment)
        if (!cancelled) setSeriesByQuery(m)
      } catch {
        if (!cancelled) setSeriesByQuery(new Map())
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [siteUrl, dateRange, pageSegment, selectedQueries.join('\0')])

  return { seriesByQuery, loading }
}
