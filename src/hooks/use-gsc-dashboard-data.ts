import { useCallback, useEffect, useRef, useState } from 'react'

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
import { buildClickDrivers } from '@/lib/bi/click-drivers'
import { buildDataForSeoInsight } from '@/lib/bi/dataforseo-insight'
import { buildDataLoadMeta } from '@/lib/bi/data-load-meta'
import { aggregateGscRowsByQuery, type GscQueryAggregate } from '@/lib/bi/query-aggregate'
import {
  buildCannibalization,
  buildQueryScatterPoints,
  buildTopMovers,
  mergeTrendChartSeries,
  normalizeDailyRows,
} from '@/lib/bi/extended-metrics'
import { pageSegmentToGscFilters } from '@/lib/bi/page-segment'
import { previousMonthAlignedPeriod, previousPeriodRange } from '@/lib/bi/period'
import { normalizeGscRows } from '@/lib/bi/gsc-normalize'
import { GSC_SEARCH_ANALYTICS_ROW_LIMIT, searchAnalyticsQuery } from '@/lib/gsc/api'
import { getValidAccessToken } from '@/lib/gsc/oauth-client'
import { isCurrentMonthRange } from '@/lib/dashboard-date-presets'
import { useDashboardFilters } from '@/contexts/dashboard-filters'
import { clearSearchVolumeFrCache } from '@/lib/dataforseo/volume-cache'
import type { BiDashboardSnapshot, DashboardDateRange, ExecutiveNorthStar } from '@/types/bi'
import type { GscDimension, GscQueryRequestBody } from '@/types/gsc'

const QP_DIMS: GscDimension[] = ['query', 'page']
const DATE_DIM: GscDimension[] = ['date']

export interface GscDashboardDataState {
  loading: boolean
  error: string | null
  snapshot: BiDashboardSnapshot | null
  northStar: ExecutiveNorthStar
  rowCount: number
  /** Vide le cache volumes DataForSEO et recalcule uniquement ce bloc (GSC inchangé). */
  refreshDataForSeo: () => Promise<void>
  dataForSeoRefreshing: boolean
}

export function useGscDashboardData(siteUrl: string | null): GscDashboardDataState {
  const { dateRange, brandMode, pageSegment } = useDashboardFilters()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [snapshot, setSnapshot] = useState<BiDashboardSnapshot | null>(null)
  const [rowCount, setRowCount] = useState(0)
  const [dataForSeoRefreshing, setDataForSeoRefreshing] = useState(false)
  const dataForSeoContextRef = useRef<{
    aggregates: GscQueryAggregate[]
    dateRange: DashboardDateRange
  } | null>(null)

  const load = useCallback(async () => {
    if (!siteUrl) {
      dataForSeoContextRef.current = null
      setSnapshot(null)
      setError(null)
      setRowCount(0)
      return
    }

    const token = await getValidAccessToken()
    if (!token) {
      dataForSeoContextRef.current = null
      setSnapshot(null)
      setError(null)
      setRowCount(0)
      return
    }

    setLoading(true)
    setError(null)

    const prevRange = isCurrentMonthRange(dateRange)
      ? previousMonthAlignedPeriod(dateRange)
      : previousPeriodRange(dateRange)

    const rowLimit = GSC_SEARCH_ANALYTICS_ROW_LIMIT

    const pageFilters = pageSegmentToGscFilters(pageSegment)
    const withPageFilters = (base: GscQueryRequestBody): GscQueryRequestBody =>
      pageFilters ? { ...base, dimensionFilterGroups: pageFilters } : base

    const bodyQp = withPageFilters({
      startDate: dateRange.start,
      endDate: dateRange.end,
      dimensions: QP_DIMS,
      rowLimit,
      dataState: 'final' as const,
    })

    const bodyQpPrev = withPageFilters({
      startDate: prevRange.start,
      endDate: prevRange.end,
      dimensions: QP_DIMS,
      rowLimit,
      dataState: 'final' as const,
    })

    const bodyDate = withPageFilters({
      startDate: dateRange.start,
      endDate: dateRange.end,
      dimensions: DATE_DIM,
      rowLimit,
      dataState: 'final' as const,
    })

    const bodyDatePrev = withPageFilters({
      startDate: prevRange.start,
      endDate: prevRange.end,
      dimensions: DATE_DIM,
      rowLimit,
      dataState: 'final' as const,
    })

    try {
      const [resQpCur, resQpPrev, resDateCur, resDatePrev] = await Promise.all([
        searchAnalyticsQuery(token, siteUrl, bodyQp),
        searchAnalyticsQuery(token, siteUrl, bodyQpPrev),
        searchAnalyticsQuery(token, siteUrl, bodyDate),
        searchAnalyticsQuery(token, siteUrl, bodyDatePrev),
      ])

      const rawCurrent = resQpCur.rows
      const rawPrev = resQpPrev.rows
      const rawDateCur = resDateCur.rows
      const rawDatePrev = resDatePrev.rows

      const dataLoadMeta = buildDataLoadMeta({
        rowLimit,
        queryPageRowsCurrent: rawCurrent.length,
        queryPageRowsPrevious: rawPrev.length,
        dateRowsCurrent: rawDateCur.length,
        dateRowsPrevious: rawDatePrev.length,
        responseAggregationQueryPageCurrent: resQpCur.responseAggregationType,
        responseAggregationQueryPagePrevious: resQpPrev.responseAggregationType,
        responseAggregationDateCurrent: resDateCur.responseAggregationType,
        responseAggregationDatePrevious: resDatePrev.responseAggregationType,
        dateRangeCurrent: dateRange,
        dateRangePrevious: prevRange,
      })

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
      const clickDrivers = buildClickDrivers(brandCurrent, brandPrev, 18)

      const aggregates = aggregateGscRowsByQuery(brandCurrent)
      dataForSeoContextRef.current = { aggregates, dateRange }
      const dataForSeo = await buildDataForSeoInsight(aggregates, dateRange)

      setSnapshot({
        filters: {
          dateRange,
          brandMode,
          pageSegment,
        },
        northStar,
        strikingDistance,
        decay,
        intentVolume: intentVol,
        dataLoadMeta,
        clickDrivers,
        dailyCurrent,
        dailyPrevious,
        trendChart,
        topGains: gains,
        topLosses: losses,
        cannibalization,
        scatterQueryPoints,
        dataForSeo,
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      dataForSeoContextRef.current = null
      setError(msg)
      setSnapshot(null)
    } finally {
      setLoading(false)
    }
  }, [siteUrl, dateRange, brandMode, pageSegment])

  useEffect(() => {
    void load()
  }, [load])

  const refreshDataForSeo = useCallback(async () => {
    const ctx = dataForSeoContextRef.current
    if (!ctx) return
    setDataForSeoRefreshing(true)
    try {
      clearSearchVolumeFrCache()
      const dataForSeo = await buildDataForSeoInsight(ctx.aggregates, ctx.dateRange)
      setSnapshot((prev) => (prev ? { ...prev, dataForSeo } : null))
    } finally {
      setDataForSeoRefreshing(false)
    }
  }, [])

  const northStar =
    snapshot?.northStar ??
    buildExecutiveNorthStar({
      organicGrowthVelocity: null,
      highIntentLeadProxy: null,
    })

  return {
    loading,
    error,
    snapshot,
    northStar,
    rowCount,
    refreshDataForSeo,
    dataForSeoRefreshing,
  }
}
