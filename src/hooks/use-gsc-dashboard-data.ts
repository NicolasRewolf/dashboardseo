import { useCallback, useEffect, useState } from 'react'

import {
  aggregateImpressionsByPage,
  buildBusinessIntentVolume,
  buildDecayMonitor,
  buildExecutiveNorthStar,
  buildSemanticPillarPerformance,
  buildStrikingDistanceMatrix,
  filterRowsByBrandMode,
  filterRowsBySpecialty,
  sumClicks,
  totalMapValues,
} from '@/lib/bi/calculations'
import { previousPeriodRange } from '@/lib/bi/period'
import { normalizeGscRows } from '@/lib/bi/gsc-normalize'
import { searchAnalyticsQuery } from '@/lib/gsc/api'
import { getValidAccessToken } from '@/lib/gsc/oauth-client'
import { useDashboardFilters } from '@/contexts/dashboard-filters'
import type { BiDashboardSnapshot, ExecutiveNorthStar } from '@/types/bi'
import type { GscDimension } from '@/types/gsc'

const DIMENSIONS: GscDimension[] = ['query', 'page']

export interface GscDashboardDataState {
  loading: boolean
  error: string | null
  snapshot: BiDashboardSnapshot | null
  northStar: ExecutiveNorthStar
  rowCount: number
}

export function useGscDashboardData(siteUrl: string | null): GscDashboardDataState {
  const { dateRange, brandMode, specialtyId } = useDashboardFilters()
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

    const bodyCurrent = {
      startDate: dateRange.start,
      endDate: dateRange.end,
      dimensions: DIMENSIONS,
      rowLimit: 25_000,
      dataState: 'final' as const,
    }

    const bodyPrev = {
      startDate: prevRange.start,
      endDate: prevRange.end,
      dimensions: DIMENSIONS,
      rowLimit: 25_000,
      dataState: 'final' as const,
    }

    try {
      const [rawCurrent, rawPrev] = await Promise.all([
        searchAnalyticsQuery(token, siteUrl, bodyCurrent),
        searchAnalyticsQuery(token, siteUrl, bodyPrev),
      ])

      const normCurrent = normalizeGscRows(DIMENSIONS, rawCurrent)
      const normPrev = normalizeGscRows(DIMENSIONS, rawPrev)
      setRowCount(normCurrent.length)

      const brandCurrent = filterRowsByBrandMode(normCurrent, brandMode)
      const brandPrev = filterRowsByBrandMode(normPrev, brandMode)

      const filteredCurrent = filterRowsBySpecialty(brandCurrent, specialtyId)
      const filteredPrev = filterRowsBySpecialty(brandPrev, specialtyId)

      const currClicks = sumClicks(filteredCurrent)
      const prevClicks = sumClicks(filteredPrev)
      const velocityPct =
        prevClicks > 0 ? ((currClicks - prevClicks) / prevClicks) * 100 : null

      const intentVol = buildBusinessIntentVolume(filteredCurrent)

      const northStar = buildExecutiveNorthStar({
        estimatedMarketShare: null,
        organicGrowthVelocity: velocityPct,
        highIntentLeadProxy: intentVol.businessIntentVolume,
      })

      const strikingDistance = buildStrikingDistanceMatrix(filteredCurrent)
      const pillarPerformance = buildSemanticPillarPerformance(filteredCurrent)

      const byPageCur = aggregateImpressionsByPage(brandCurrent)
      const byPagePrev = aggregateImpressionsByPage(brandPrev)
      const siteTotCur = totalMapValues(byPageCur)
      const siteTotPrev = totalMapValues(byPagePrev)

      const decay = buildDecayMonitor(byPageCur, byPagePrev, siteTotCur, siteTotPrev)

      setSnapshot({
        filters: {
          dateRange,
          brandMode,
          specialtyId,
        },
        northStar,
        strikingDistance,
        pillarPerformance,
        decay,
        intentVolume: intentVol,
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg)
      setSnapshot(null)
    } finally {
      setLoading(false)
    }
  }, [siteUrl, dateRange, brandMode, specialtyId])

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
