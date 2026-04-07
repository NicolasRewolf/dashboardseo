import type {
  GscDimension,
  GscNormalizedRow,
  GscSearchAnalyticsRow,
} from '@/types/gsc'

/**
 * Maps `keys[]` to named fields from the dimension order of the request.
 */
export function normalizeGscRow(
  dimensions: GscDimension[],
  row: GscSearchAnalyticsRow
): GscNormalizedRow {
  const out: GscNormalizedRow = {
    clicks: row.clicks,
    impressions: row.impressions,
    ctr: row.ctr,
    position: row.position,
  }

  dimensions.forEach((dim, i) => {
    const v = row.keys[i]
    if (v === undefined) return
    switch (dim) {
      case 'query':
        out.query = v
        break
      case 'page':
        out.page = v
        break
      case 'country':
        out.country = v
        break
      case 'device':
        out.device = v
        break
      case 'searchAppearance':
        out.searchAppearance = v
        break
      case 'date':
        out.date = v
        break
      default:
        break
    }
  })

  return out
}

export function normalizeGscRows(
  dimensions: GscDimension[],
  rows: GscSearchAnalyticsRow[] | undefined
): GscNormalizedRow[] {
  if (!rows?.length) return []
  return rows.map((r) => normalizeGscRow(dimensions, r))
}
