import { dataForSeoVolumeLookupKey } from '@/lib/dataforseo/keyword-eligibility'
import { EXPECTED_CTR_AT_3, getExpectedCtr } from '@/lib/bi/expected-ctr'
import type { GscQueryAggregate } from '@/lib/bi/query-aggregate'
import type {
  SeoAdvancedBlock,
  SeoAdvancedCtrScatterPoint,
  SeoAdvancedKpis,
  SeoAdvancedOpportunityRow,
  SeoAdvancedVolumePositionPoint,
  SeoAdvancedZoneId,
  SeoAdvancedZoneSegment,
} from '@/types/bi'

const ZONE_ORDER: SeoAdvancedZoneId[] = ['top3', 'page1_low', 'page2', 'off_radar']

const ZONE_LABEL: Record<SeoAdvancedZoneId, string> = {
  top3: 'Top 3',
  page1_low: 'Page 1 bas',
  page2: 'Page 2',
  off_radar: 'Hors radar',
}

function zoneForPosition(pos: number): SeoAdvancedZoneId {
  if (pos <= 3) return 'top3'
  if (pos <= 10) return 'page1_low'
  if (pos <= 20) return 'page2'
  return 'off_radar'
}

/**
 * Agrège les signaux GSC + volumes / difficulté DataForSEO (mêmes requêtes que le bloc insight).
 */
export function buildSeoAdvancedMetrics(
  aggregates: GscQueryAggregate[],
  volumeMap: Map<string, number>,
  difficultyMap: Map<string, number>
): SeoAdvancedBlock {
  const zones: Record<SeoAdvancedZoneId, { impressions: number; clicks: number; gainIfTop3: number }> = {
    top3: { impressions: 0, clicks: 0, gainIfTop3: 0 },
    page1_low: { impressions: 0, clicks: 0, gainIfTop3: 0 },
    page2: { impressions: 0, clicks: 0, gainIfTop3: 0 },
    off_radar: { impressions: 0, clicks: 0, gainIfTop3: 0 },
  }

  let totalImpressions = 0
  let queryCountCtrGapAbove003 = 0
  let sumGainIfTop3 = 0
  let queryCountPositionPage2 = 0

  const volumePositionScatter: SeoAdvancedVolumePositionPoint[] = []
  const ctrScatter: SeoAdvancedCtrScatterPoint[] = []
  const opportunityRaw: Array<{
    query: string
    raw: number
    impressions: number
    position: number
    difficulty: number
  }> = []

  for (const a of aggregates) {
    totalImpressions += a.impressions
    const z = zoneForPosition(a.position)
    zones[z].impressions += a.impressions
    zones[z].clicks += a.clicks

    const key = dataForSeoVolumeLookupKey(a.query)
    const vol = volumeMap.get(key)
    const diff = difficultyMap.get(key) ?? 50

    if (vol != null) {
      zones[z].gainIfTop3 += vol * EXPECTED_CTR_AT_3 - a.clicks
      sumGainIfTop3 += vol * EXPECTED_CTR_AT_3 - a.clicks
    }

    if (a.impressions > 0) {
      const ctrReal = a.clicks / a.impressions
      const expected = getExpectedCtr(a.position)
      const ctrGap = expected - ctrReal
      if (ctrGap > 0.03) queryCountCtrGapAbove003 += 1

      if (vol != null) {
        volumePositionScatter.push({
          query: a.query,
          volume: vol,
          position: a.position,
          impressions: a.impressions,
          ctrGap,
        })
      }

      const px = Math.min(20, Math.max(1, a.position))
      ctrScatter.push({
        query: a.query,
        position: px,
        ctrReal,
        aboveExpected: ctrReal > expected,
      })
    }

    if (a.position > 10 && a.position <= 20) queryCountPositionPage2 += 1

    if (vol != null && a.impressions > 0 && a.position > 0) {
      const raw = (a.impressions * (1 / Math.max(a.position, 0.5))) / Math.max(diff, 1)
      opportunityRaw.push({
        query: a.query,
        raw,
        impressions: a.impressions,
        position: a.position,
        difficulty: diff,
      })
    }
  }

  const maxRaw = opportunityRaw.reduce((m, r) => Math.max(m, r.raw), 0)
  const opportunityTop20: SeoAdvancedOpportunityRow[] = [...opportunityRaw]
    .sort((a, b) => b.raw - a.raw)
    .slice(0, 20)
    .map((r) => ({
      query: r.query,
      score: maxRaw > 0 ? (r.raw / maxRaw) * 100 : 0,
      impressions: r.impressions,
      position: r.position,
      difficulty: r.difficulty,
    }))

  const zoneSegments: SeoAdvancedZoneSegment[] = ZONE_ORDER.map((id) => ({
    id,
    label: ZONE_LABEL[id],
    impressions: zones[id].impressions,
    clicks: zones[id].clicks,
    gainIfTop3: zones[id].gainIfTop3,
  }))

  const kpis: SeoAdvancedKpis = {
    totalImpressions,
    queryCountCtrGapAbove003,
    sumGainIfTop3,
    queryCountPositionPage2,
  }

  return {
    volumePositionScatter,
    zoneSegments,
    kpis,
    ctrScatter,
    opportunityTop20,
  }
}
