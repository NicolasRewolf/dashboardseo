/** Réponse racine DataForSEO v3 (extrait utile pour search_volume live). */
export interface DataForSeoSearchVolumeResponse {
  status_code: number
  status_message?: string
  tasks?: Array<{
    status_code: number
    status_message?: string
    result: DataForSeoKeywordVolumeRow[] | null
  }>
}

export interface DataForSeoKeywordVolumeRow {
  keyword: string
  search_volume: number | null
  /** Index 0–100 (Google Ads) — proxy de « difficulté » si pas de keyword_difficulty. */
  competition_index?: number | null
  keyword_difficulty?: number | null
}
