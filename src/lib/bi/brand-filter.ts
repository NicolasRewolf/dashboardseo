/**
 * Brand vs non-brand — tune patterns for JP Louton / site-specific naming.
 */

const DEFAULT_BRAND_PATTERNS: RegExp[] = [
  /j\.?\s*p\.?\s*louton/i,
  /louton/i,
  /plouton/i,
  /jplouton/i,
]

export function isBrandQuery(query: string, extraPatterns: RegExp[] = []): boolean {
  const q = query.trim()
  if (!q) return false
  const patterns = [...DEFAULT_BRAND_PATTERNS, ...extraPatterns]
  return patterns.some((re) => re.test(q))
}
