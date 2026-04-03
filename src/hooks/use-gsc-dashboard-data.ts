import { useCallback, useEffect, useState } from 'react'

import {
  aggregateImpressionsByPage,
  buildBusinessIntentVolume,
  buildDecayMonitor,
  buildExecutiveNorthStar,
  buildStrikingDistanceMatrix,
  filterRowsByBrandMode,
  sumClicks,
  totalMapValues,
} from '@/lib/bi/calculations'
import {
  buildCannibalization,
  buildQueryScatterPoints,
  buildTopMovers,
  mergeTrendChartSeries,
  normalizeDailyRows,
} from '@/lib/bi/extended-metrics'
import { previousPeriodRange } from '@/lib/bi/period'
import { normalizeGscRows } from '@/lib/bi/gsc-normalize'
import { searchAnalyticsQuery } from '@/lib/gsc/api'
import { getValidAccessToken } from '@/lib/gsc/oauth-client'
import { useDashboardFilters } from '@/contexts/dashboard-filters'
import type { BiDashboardSnapshot, ExecutiveNorthStar } from '@/types/bi'
import type { GscDimension } from '@/types/gsc'

const QP_DIMS: GscDimension[] = ['query', 'page']
const DATE_DIM: GscDimension[] = ['date']

export interface GscDashboardDataState {
  loading: boolean
  error: string | null
  snapshot: BiDashboardSnapshot | null
  northStar: ExecutiveNorthStar
  rowCount: number
}

export function useGscDashboardData(siteUrl: string | null): GscDashboardDataState {
  const { dateRange, brandMode } = useDashboardFilters()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [snapshot, setSnapshot] = useState<BiDashboardSnapshot | null>(null)
  const [rowCount, setRowCount] = useState(0)

  const load = useCallback(async () => {
    if (!siteUrl) {
      setSnapshot(null)
      setError(null)
      setRowCount(0)
      return
    }

    const token = await getValidAccessToken()
    if (!token) {
      setSnapshot(null)
      setError(null)
      setRowCount(0)
      return
    }

    setLoading(true)
    setError(null)

    const prevRange = previousPeriodRange(dateRange)

    const bodyQp = {
      startDate: dateRange.start,
      endDate: dateRange.end,
      dimensions: QP_DIMS,
      rowLimit: 25_000,
      dataState: 'final' as const,
    }

    const bodyQpPrev = {
      startDate: prevRange.start,
      endDate: prevRange.end,
      dimensions: QP_DIMS,
      rowLimit: 25_000,
      dataState: 'final' as const,
    }

    const bodyDate = {
      startDate: dateRange.start,
      endDate: dateRange.end,
      dimensions: DATE_DIM,
      rowLimit: 25_000,
      dataState: 'final' as const,
    }

    const bodyDatePrev = {
      startDate: prevRange.start,
      endDate: prevRange.end,
      dimensions: DATE_DIM,
      rowLimit: 25_000,
      dataState: 'final' as const,
    }

    try {
      const [rawCurrent, rawPrev, rawDateCur, rawDatePrev] = await Promise.all([
        searchAnalyticsQuery(token, siteUrl, bodyQp),
        searchAnalyticsQuery(token, siteUrl, bodyQpPrev),
        searchAnalyticsQuery(token, siteUrl, bodyDate),
        searchAnalyticsQuery(token, siteUrl, bodyDatePrev),
      ])

      const normCurrent = normalizeGscRows(QP_DIMS, rawCurrent)
      const normPrev = normalizeGscRows(QP_DIMS, rawPrev)
      setRowCount(normCurrent.length)

      const brandCurrent = filterRowsByBrandMode(normCurrent, brandMode)
      const brandPrev = filterRowsByBrandMode(normPrev, brandMode)

      const currClicks = sumClicks(brandCurrent)
      const prevClicks = sumClicks(brandPrev)
      const velocityPct =
        prevClicks > 0 ? ((currClicks - prevClicks) / prevClicks) * 100 : null

      const intentVol = buildBusinessIntentVolume(brandCurrent)

      const northStar = buildExecutiveNorthStar({
        estimatedMarketShare: null,
        organicGrowthVelocity: velocityPct,
        highIntentLeadProxy: intentVol.businessIntentVolume,
      })

      const strikingDistance = buildStrikingDistanceMatrix(brandCurrent)

      const byPageCur = aggregateImpressionsByPage(brandCurrent)
      const byPagePrev = aggregateImpressionsByPage(brandPrev)
      const siteTotCur = totalMapValues(byPageCur)
      const siteTotPrev = totalMapValues(byPagePrev)

      const decay = buildDecayMonitor(byPageCur, byPagePrev, siteTotCur, siteTotPrev)

      const dailyCurrent = normalizeDailyRows(rawDateCur)
      const dailyPrevious = normalizeDailyRows(rawDatePrev)
      const trendChart = mergeTrendChartSeries(dailyCurrent, dailyPrevious)

      const { gains, losses } = buildTopMovers(brandCurrent, brandPrev, 12)
      const cannibalization = buildCannibalization(brandCurrent)
      const scatterQueryPoints = buildQueryScatterPoints(brandCurrent)

      setSnapshot({
        filters: {
          dateRange,
          brandMode,
        },
        northStar,
        strikingDistance,
        decay,
        intentVolume: intentVol,
        dailyCurrent,
        dailyPrevious,
        trendChart,
        topGains: gains,
        topLosses: losses,
        cannibalization,
        scatterQueryPoints,
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg)
      setSnapshot(null)
    } finally {
      setLoading(false)
    }
  }, [siteUrl, dateRange, brandMode])

  useEffect(() => {
    void load()
  }, [load])

  const northStar =
    snapshot?.northStar ??
    buildExecutiveNorthStar({
      estimatedMarketShare: null,
      organicGrowthVelocity: null,
      highIntentLeadProxy: null,
    })

  return {
    loading,
    error,
    snapshot,
    northStar,
    rowCount,
  }
}
