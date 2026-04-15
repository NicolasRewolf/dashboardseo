import type { GscQueryAggregate } from '@/lib/bi/query-aggregate'
import { buildSeoAdvancedMetrics } from '@/lib/bi/seo-advanced-metrics'
import {
  dataForSeoVolumeLookupKey,
  filterKeywordsForDataForSeoApi,
} from '@/lib/dataforseo/keyword-eligibility'
import { fetchKeywordVolumeDifficultyFranceFr } from '@/lib/dataforseo/search-volume'
import type {
  DashboardDateRange,
  DataForSeoInsightBlock,
  PositionVolumeScatterPoint,
} from '@/types/bi'

/** Nombre max de requêtes GSC envoyées à DataForSEO par chargement (coût API). */
const MAX_QUERIES_FOR_DFS = 500

function emptyBlock(message: string | null): DataForSeoInsightBlock {
  return {
    demandVsVisibility: {
      totalVolumeFr: null,
      totalImpressionsGsc: 0,
      impressionsPerKVolume: null,
      matchedQueries: 0,
      gscQueriesUsed: 0,
    },
    leverage: { items: [] },
    coverage: {
      volumeThreshold: 0,
      highVolumeCount: 0,
      highVolumeWithImpressions: 0,
      coveragePct: null,
    },
    error: message,
    fetchedAt: null,
    volumeDateRange: null,
    positionVolumeScatter: [],
    seoAdvanced: null,
  }
}

/**
 * Enrichit les agrégats GSC avec les volumes FR DataForSEO (cartes métier + nuage position × volume).
 * `gscDateRange` : période du filtre pour l’affichage ; l’appel volume n’envoie pas de dates.
 */
export async function buildDataForSeoInsight(
  aggregates: GscQueryAggregate[],
  gscDateRange: DashboardDateRange
): Promise<DataForSeoInsightBlock> {
  if (aggregates.length === 0) {
    return emptyBlock('Aucune requête GSC sur ce périmètre.')
  }

  const top = aggregates.slice(0, MAX_QUERIES_FOR_DFS)
  const keywords = top.map((a) => a.query)
  const eligibleForApi = filterKeywordsForDataForSeoApi(keywords)
  if (eligibleForApi.length === 0) {
    return emptyBlock(
      'Aucune requête GSC ne respecte les limites DataForSEO pour les volumes (≤80 caractères, ≤10 mots, ≥3 caractères). Les requêtes type « question longue » ne sont pas envoyées à l’API.'
    )
  }

  let volumeMap: Map<string, number>
  let difficultyMap: Map<string, number>
  try {
    const fetched = await fetchKeywordVolumeDifficultyFranceFr(eligibleForApi)
    volumeMap = fetched.volumeMap
    difficultyMap = fetched.difficultyMap
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return emptyBlock(msg)
  }

  if (volumeMap.size === 0) {
    return {
      ...emptyBlock(
        'DataForSEO n’a renvoyé aucun volume pour ces requêtes (vérifier crédits, identifiants .env, ou correspondance des libellés).'
      ),
      seoAdvanced: buildSeoAdvancedMetrics(aggregates, new Map(), new Map()),
    }
  }

  let totalVolume = 0
  let totalImprMatched = 0
  let matched = 0

  for (const a of top) {
    const v = volumeMap.get(dataForSeoVolumeLookupKey(a.query))
    if (v == null) continue
    totalVolume += v
    totalImprMatched += a.impressions
    matched++
  }

  const impressionsPerKVolume =
    totalVolume > 0 ? (totalImprMatched / totalVolume) * 1000 : null

  const leverage: DataForSeoInsightBlock['leverage']['items'] = []
  for (const a of top) {
    const v = volumeMap.get(dataForSeoVolumeLookupKey(a.query))
    if (v == null) continue
    if (a.position < 4 || a.position > 15) continue
    const score = v * Math.max(0, 16 - a.position)
    leverage.push({ query: a.query, volume: v, position: a.position, score })
  }
  leverage.sort((a, b) => b.score - a.score)

  const volList = [...volumeMap.values()].sort((x, y) => x - y)
  const median = volList.length ? volList[Math.floor(volList.length / 2)]! : 50
  const threshold = Math.max(50, median)

  let highVol = 0
  let highVolWithImpr = 0
  for (const a of top) {
    const v = volumeMap.get(dataForSeoVolumeLookupKey(a.query))
    if (v == null || v < threshold) continue
    highVol++
    if (a.impressions > 0) highVolWithImpr++
  }

  const coveragePct = highVol > 0 ? (highVolWithImpr / highVol) * 100 : null

  const positionVolumeScatter: PositionVolumeScatterPoint[] = []
  for (const a of top) {
    const v = volumeMap.get(dataForSeoVolumeLookupKey(a.query))
    if (v == null) continue
    positionVolumeScatter.push({
      query: a.query,
      position: a.position,
      volume: v,
      impressions: a.impressions,
    })
  }
  positionVolumeScatter.sort((a, b) => a.impressions - b.impressions)

  /** KPI & segments : tout le périmètre GSC ; volumes / difficulté = requêtes couvertes par DataForSEO. */
  const seoAdvanced = buildSeoAdvancedMetrics(aggregates, volumeMap, difficultyMap)

  return {
    demandVsVisibility: {
      totalVolumeFr: totalVolume > 0 ? totalVolume : null,
      totalImpressionsGsc: totalImprMatched,
      impressionsPerKVolume,
      matchedQueries: matched,
      gscQueriesUsed: top.length,
    },
    leverage: { items: leverage.slice(0, 5) },
    coverage: {
      volumeThreshold: threshold,
      highVolumeCount: highVol,
      highVolumeWithImpressions: highVolWithImpr,
      coveragePct,
    },
    error: null,
    fetchedAt: new Date().toISOString(),
    volumeDateRange: {
      date_from: gscDateRange.start,
      date_to: gscDateRange.end,
    },
    positionVolumeScatter,
    seoAdvanced,
  }
}
