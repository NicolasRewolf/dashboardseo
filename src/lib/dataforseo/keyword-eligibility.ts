/**
 * Règles DataForSEO (Google Ads Keywords) — voir doc endpoint search_volume/live.
 * Erreurs fréquentes : 40501 si longueur / mots dépassés, ou **caractères interdits** (tirets typographiques, etc.).
 */
const MIN_CHARS = 3
const MAX_CHARS = 80
const MAX_WORDS = 10

/**
 * Remplace tirets typographiques, apostrophes « smart », etc., puis retire les symboles
 * que DataForSEO refuse (`/`, `?`, ponctuation hors lettres/chiffres/espaces/tiret/apostrophe).
 */
function normalizeKeywordForDataForSeo(keyword: string): string {
  return keyword
    .trim()
    .replace(/\u2014/g, '-') // EM DASH —
    .replace(/\u2013/g, '-') // EN DASH –
    .replace(/\u2012/g, '-')
    .replace(/\u2010/g, '-')
    .replace(/\u2011/g, '-') // non-breaking hyphen
    .replace(/[\u2018\u2019\u0060\u00B4]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\//g, ' ')
    // Tout sauf lettres (y compris accents), chiffres, espaces, tiret ASCII, apostrophe droite.
    .replace(/[^-\p{L}\p{N}\s\x27]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function isEligibleDataForSeoKeyword(keyword: string): boolean {
  const k = normalizeKeywordForDataForSeo(keyword)
  if (k.length < MIN_CHARS || k.length > MAX_CHARS) return false
  const words = k.split(/\s+/).filter(Boolean)
  if (words.length > MAX_WORDS) return false
  return true
}

/** Clé pour retrouver le volume renvoyé (réponse API alignée sur la forme normalisée). */
export function dataForSeoVolumeLookupKey(rawQuery: string): string {
  return normalizeKeywordForDataForSeo(rawQuery).toLowerCase()
}

/** Filtre une liste de mots-clés pour l’envoi à l’API (normalisés, ordre conservé, doublons retirés). */
export function filterKeywordsForDataForSeoApi(keywords: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of keywords) {
    if (!isEligibleDataForSeoKeyword(raw)) continue
    const k = normalizeKeywordForDataForSeo(raw)
    const lower = k.toLowerCase()
    if (seen.has(lower)) continue
    seen.add(lower)
    out.push(k)
  }
  return out
}
