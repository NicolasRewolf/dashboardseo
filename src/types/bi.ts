/**
 * Business Intelligence metrics — derived from normalized GSC data + domain rules.
 */

import type { LegalSpecialtyId } from './specialties'

/** User-facing filter: all queries vs brand-stripped “market” view. */
export type BrandFilterMode = 'all' | 'brand' | 'non_brand'

/** Search intent proxy for conversion quality. */
export type SearchIntent = 'informational' | 'transactional' | 'navigational' | 'commercial'

export interface DashboardDateRange {
  start: string
  end: string
}

export interface DashboardFilters {
  dateRange: DashboardDateRange
  brandMode: BrandFilterMode
  /** `null` = all specialties. */
  specialtyId: LegalSpecialtyId | null
}

/** Single keyword (or query/page pair) with BI annotations. */
export interface KeywordIntentRecord {
  query: string
  page?: string
  intent: SearchIntent
  /** Weight 0–1 from heuristics / optional ML later. */
  intentConfidence: number
}

/**
 * “Striking distance” — positions 4–12 with meaningful impression volume.
 */
export interface StrikingDistanceKeyword {
  query: string
  page?: string
  position: number
  impressions: number
  clicks: number
  ctr: number
  /** Higher = more upside per unit of effort (0–100 scale, domain-tuned). */
  effortVsRewardScore: number
  label: 'immediate_growth_opportunity'
}

export interface StrikingDistanceMatrix {
  items: StrikingDistanceKeyword[]
  /** Thresholds used for labeling (for auditability). */
  meta: {
    minPosition: number
    maxPosition: number
    minImpressions: number
  }
}

/** Organic value by legal pillar (semantic grouping, not raw URL list). */
export interface SemanticPillarSnapshot {
  specialtyId: LegalSpecialtyId
  clicks: number
  impressions: number
  weightedPosition: number
  /** Share of site organic clicks in window. */
  clickShare: number
}

export interface SemanticPillarPerformance {
  pillars: SemanticPillarSnapshot[]
  totalClicks: number
}

/** Page-level decay signal vs site benchmark. */
export interface ContentDecayAlert {
  page: string
  impressionsDeltaPct: number
  siteAvgImpressionsDeltaPct: number
  /** Positive = decaying faster than average. */
  decayExcess: number
  severity: 'watch' | 'alert' | 'critical'
}

export interface OrganicHealthDecayMonitor {
  siteAvgImpressionsDeltaPct: number
  alerts: ContentDecayAlert[]
}

/** Executive “North Star” header metrics (may combine GSC + internal assumptions). */
export interface ExecutiveNorthStar {
  /** 0–1 estimated share of addressable SERP demand (model-dependent). */
  estimatedMarketShare: number | null
  /** Period-over-period change in weighted organic clicks or impressions. */
  organicGrowthVelocity: number | null
  /** Σ (transactional-weighted impressions) or similar proxy. */
  highIntentLeadProxy: number | null
}

export interface BusinessIntentVolume {
  /** Window totals. */
  totalImpressions: number
  totalClicks: number
  /** Σ impressions × transactional_weight(query). */
  businessIntentVolume: number
  byIntent: Partial<Record<SearchIntent, { impressions: number; clicks: number }>>
}

/** Full BI snapshot for one filter set + date window (feeds dashboard modules). */
export interface BiDashboardSnapshot {
  filters: DashboardFilters
  northStar: ExecutiveNorthStar
  strikingDistance: StrikingDistanceMatrix
  pillarPerformance: SemanticPillarPerformance
  decay: OrganicHealthDecayMonitor
  intentVolume: BusinessIntentVolume
}
