import { dataForSeoVolumeLookupKey, filterKeywordsForDataForSeoApi } from '@/lib/dataforseo/keyword-eligibility'
import {
  getCachedKeywordMetricsFr,
  putCachedKeywordMetricsFr,
} from '@/lib/dataforseo/volume-cache'
import { getDataForSeoApiOrigin } from '@/lib/dataforseo/constants'
import type { DataForSeoKeywordVolumeRow, DataForSeoSearchVolumeResponse } from '@/lib/dataforseo/types'

const ENDPOINT = '/v3/keywords_data/google_ads/search_volume/live'

function parseDifficulty(row: DataForSeoKeywordVolumeRow): number {
  const kd = row.keyword_difficulty
  const ci = row.competition_index
  if (typeof kd === 'number' && kd > 0) return Math.min(100, kd)
  if (typeof ci === 'number' && ci > 0) return Math.min(100, ci)
  return 50
}

export interface KeywordVolumeDifficultyMaps {
  volumeMap: Map<string, number>
  difficultyMap: Map<string, number>
}

/**
 * Volume mensuel + proxy difficulté (keyword_difficulty ou competition_index DataForSEO).
 * Même quota API que le fetch volume seul.
 */
export async function fetchKeywordVolumeDifficultyFranceFr(
  keywords: string[]
): Promise<KeywordVolumeDifficultyMaps> {
  const volumeMap = new Map<string, number>()
  const difficultyMap = new Map<string, number>()
  const unique = filterKeywordsForDataForSeoApi(keywords).slice(0, 1000)
  if (unique.length === 0) return { volumeMap, difficultyMap }

  const missing: string[] = []
  for (const kw of unique) {
    const key = dataForSeoVolumeLookupKey(kw)
    const cached = getCachedKeywordMetricsFr(key)
    if (cached != null) {
      volumeMap.set(key, cached.volume)
      difficultyMap.set(key, cached.difficulty)
    } else {
      missing.push(kw)
    }
  }

  if (missing.length === 0) {
    return { volumeMap, difficultyMap }
  }

  const res = await fetch(`${getDataForSeoApiOrigin()}${ENDPOINT}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify([
      {
        location_name: 'France',
        language_code: 'fr',
        keywords: missing,
        search_partners: false,
      },
    ]),
  })

  const text = await res.text()
  if (!res.ok) {
    throw new Error(`DataForSEO ${res.status}: ${text.slice(0, 400)}`)
  }

  let json: DataForSeoSearchVolumeResponse
  try {
    json = JSON.parse(text) as DataForSeoSearchVolumeResponse
  } catch {
    throw new Error('DataForSEO: réponse JSON invalide')
  }

  if (json.status_code !== 20000) {
    throw new Error(`DataForSEO ${json.status_code}: ${json.status_message ?? text.slice(0, 200)}`)
  }

  const task = json.tasks?.[0]
  if (!task || task.status_code !== 20000) {
    throw new Error(
      `DataForSEO tâche: ${task?.status_code ?? '—'} ${task?.status_message ?? ''}`.trim()
    )
  }

  const rows = task.result ?? []
  const toStore = new Map<string, { volume: number; difficulty: number }>()
  for (const row of rows) {
    const k = dataForSeoVolumeLookupKey(row.keyword ?? '')
    const vol = row.search_volume
    if (!k || vol == null || vol < 0) continue
    const d = parseDifficulty(row)
    volumeMap.set(k, vol)
    difficultyMap.set(k, d)
    toStore.set(k, { volume: vol, difficulty: d })
  }

  putCachedKeywordMetricsFr(toStore)

  return { volumeMap, difficultyMap }
}

/**
 * @deprecated Préférer `fetchKeywordVolumeDifficultyFranceFr` si difficulté requise.
 */
export async function fetchSearchVolumeFranceFr(keywords: string[]): Promise<Map<string, number>> {
  const { volumeMap } = await fetchKeywordVolumeDifficultyFranceFr(keywords)
  return volumeMap
}
