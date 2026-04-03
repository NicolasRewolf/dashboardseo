/**
 * Types aligned with Google Search Console Search Analytics API (v4) row payloads.
 * @see https://developers.google.com/webmaster-tools/v1/searchanalytics/query
 */

/** Dimensions you can request in a single query (order matters for `keys[]`). */
export type GscDimension =
  | 'query'
  | 'page'
  | 'country'
  | 'device'
  | 'searchAppearance'
  | 'date'

/** Raw API row — `keys[i]` matches requested `dimensions[i]`. */
export interface GscSearchAnalyticsRow {
  keys: string[]
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export interface GscSearchAnalyticsResponse {
  rows?: GscSearchAnalyticsRow[]
  responseAggregationType?: string
}

/** Response envelope (typical REST shape). */
export interface GscSearchAnalyticsQueryResponse {
  data: GscSearchAnalyticsResponse
}

/**
 * Normalized row: named fields for the dimensions present in the request.
 * Absent dimensions are omitted or undefined depending on builder.
 */
export type GscNormalizedRow = {
  query?: string
  page?: string
  country?: string
  device?: string
  searchAppearance?: string
  date?: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export interface GscQueryRequestBody {
  startDate: string
  endDate: string
  dimensions?: GscDimension[]
  dimensionFilterGroups?: GscDimensionFilterGroup[]
  rowLimit?: number
  startRow?: number
  dataState?: 'all' | 'final' | 'hourly'
  searchType?: 'web' | 'image' | 'video' | 'news' | 'discover' | 'googleNews'
}

export interface GscDimensionFilter {
  dimension: GscDimension
  operator: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'includingRegex' | 'excludingRegex'
  expression: string
}

export interface GscDimensionFilterGroup {
  groupType: 'and' | 'or'
  filters: GscDimensionFilter[]
}
