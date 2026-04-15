/**
 * Cache persistant des volumes DataForSEO (FR) pour limiter les appels API facturés au même coût par requête.
 * Stockage : localStorage (navigateur), clé = forme normalisée (voir dataForSeoVolumeLookupKey).
 */

const STORAGE_KEY = 'dataforseo.fr.search_volume.v2'
/** Durée de validité — le volume mensuel Google Ads évolue lentement (~mise à jour mensuelle). */
const DEFAULT_TTL_MS = 30 * 24 * 60 * 60 * 1000
const MAX_ENTRIES = 6000

type Stored = Record<string, { v: number; t: number; d?: number }>

function now(): number {
  return Date.now()
}

function safeParse(raw: string | null): Stored {
  if (!raw) return {}
  try {
    const o = JSON.parse(raw) as unknown
    if (!o || typeof o !== 'object') return {}
    return o as Stored
  } catch {
    return {}
  }
}

function loadStored(): Stored {
  if (typeof window === 'undefined') return {}
  return safeParse(window.localStorage.getItem(STORAGE_KEY))
}

function prune(entries: Stored, ttlMs: number): Stored {
  const t0 = now()
  const out: Stored = {}
  for (const [key, row] of Object.entries(entries)) {
    if (!row || typeof row.v !== 'number' || typeof row.t !== 'number') continue
    if (row.d != null && typeof row.d !== 'number') continue
    if (t0 - row.t > ttlMs) continue
    out[key] = row
  }
  return out
}

/** Garde les entrées les plus récentes si trop volumineux. */
function capSize(entries: Stored): Stored {
  const keys = Object.keys(entries)
  if (keys.length <= MAX_ENTRIES) return entries
  const sorted = keys.sort((a, b) => entries[b]!.t - entries[a]!.t)
  const out: Stored = {}
  for (let i = 0; i < MAX_ENTRIES; i++) {
    const k = sorted[i]!
    out[k] = entries[k]!
  }
  return out
}

function persist(entries: Stored): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch {
    // quota — tenter une version réduite
    try {
      const halved = capSize(prune(entries, DEFAULT_TTL_MS / 2))
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(halved))
    } catch {
      /* ignore */
    }
  }
}

const DEFAULT_DIFFICULTY = 50

function difficultyFromRow(d?: number): number {
  return d != null && d > 0 ? d : DEFAULT_DIFFICULTY
}

/**
 * Retourne le volume en cache si encore valide, sinon `null`.
 */
export function getCachedSearchVolumeFr(
  lookupKey: string,
  ttlMs: number = DEFAULT_TTL_MS
): number | null {
  const m = getCachedKeywordMetricsFr(lookupKey, ttlMs)
  return m?.volume ?? null
}

export interface CachedKeywordMetric {
  volume: number
  difficulty: number
}

export function getCachedKeywordMetricsFr(
  lookupKey: string,
  ttlMs: number = DEFAULT_TTL_MS
): CachedKeywordMetric | null {
  const entries = prune(loadStored(), ttlMs)
  const row = entries[lookupKey]
  if (!row || now() - row.t > ttlMs) return null
  return { volume: row.v, difficulty: difficultyFromRow(row.d) }
}

/**
 * Enregistre plusieurs volumes (clés = dataForSeoVolumeLookupKey).
 */
export function putCachedSearchVolumeFr(
  volumes: Map<string, number>,
  ttlMs: number = DEFAULT_TTL_MS
): void {
  const m = new Map<string, { volume: number; difficulty?: number }>()
  for (const [k, v] of volumes) m.set(k, { volume: v })
  putCachedKeywordMetricsFr(m, ttlMs)
}

export function putCachedKeywordMetricsFr(
  metrics: Map<string, { volume: number; difficulty?: number }>,
  ttlMs: number = DEFAULT_TTL_MS
): void {
  if (typeof window === 'undefined') return
  const t = now()
  let entries = prune(loadStored(), ttlMs)
  for (const [key, row] of metrics) {
    if (row.volume == null || row.volume < 0 || !key) continue
    const prev = entries[key]
    entries[key] = {
      v: row.volume,
      t,
      d: row.difficulty ?? prev?.d,
    }
  }
  entries = capSize(entries)
  persist(entries)
}

/** Vide tout le cache volumes FR (ex. paramètres / debug). */
export function clearSearchVolumeFrCache(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

export { DEFAULT_TTL_MS }
