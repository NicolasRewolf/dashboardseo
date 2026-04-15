/**
 * Business Intelligence metrics — derived from normalized GSC data + domain rules.
 */

/** User-facing filter: all queries vs brand-stripped “market” view. */
export type BrandFilterMode = 'all' | 'brand' | 'non_brand'

/** Périmètre URL : blog (chemins contenant `/post/`) vs reste du site. */
export type PageSegmentMode = 'all' | 'blog' | 'non_blog'

/** Search intent proxy for conversion quality. */
export type SearchIntent = 'informational' | 'transactional' | 'navigational' | 'commercial'

export interface DashboardDateRange {
  start: string
  end: string
}

export interface DashboardFilters {
  dateRange: DashboardDateRange
  brandMode: BrandFilterMode
  pageSegment: PageSegmentMode
}

export interface DailyTrendPoint {
  date: string
  clicks: number
  impressions: number
  position: number
}

export interface QueryMover {
  query: string
  clicksCur: number
  clicksPrev: number
  delta: number
  deltaPct: number
}

export interface CannibalizationRow {
  query: string
  pageCount: number
  impressions: number
  pages: string[]
}

export interface QueryScatterPoint {
  position: number
  impressions: number
  query: string
}

/** Point nuage position GSC × volume mensuel FR (DataForSEO), taille ∝ impressions. */
export interface PositionVolumeScatterPoint {
  query: string
  /** Position moyenne pondérée GSC (1 = meilleur). */
  position: number
  /** Volume mensuel estimé Google Ads (FR). */
  volume: number
  impressions: number
}

/** Point nuage volume × position avec couleur = écart CTR (benchmark position). */
export interface SeoAdvancedVolumePositionPoint {
  query: string
  volume: number
  position: number
  impressions: number
  /** getExpectedCtr(position) − ctr_réel */
  ctrGap: number
}

export type SeoAdvancedZoneId = 'top3' | 'page1_low' | 'page2' | 'off_radar'

export interface SeoAdvancedZoneSegment {
  id: SeoAdvancedZoneId
  label: string
  impressions: number
  clicks: number
  /** Σ (volume_fr × CTR attendu pos.3 − clics) sur les requêtes de la zone avec volume FR. */
  gainIfTop3: number
}

export interface SeoAdvancedKpis {
  totalImpressions: number
  queryCountCtrGapAbove003: number
  /** Σ (volume_fr × 0,11 − clics) sur les requêtes avec volume DataForSEO. */
  sumGainIfTop3: number
  /** Requêtes avec 10 < position ≤ 20 (GSC). */
  queryCountPositionPage2: number
}

export interface SeoAdvancedCtrScatterPoint {
  query: string
  /** Abscisse 1…20 (clamp). */
  position: number
  ctrReal: number
  /** ctr_réel > courbe attendue à cette position. */
  aboveExpected: boolean
}

export interface SeoAdvancedOpportunityRow {
  query: string
  /** 0–100, normalisé sur le max du dataset filtré. */
  score: number
  impressions: number
  position: number
  /** DataForSEO (competition_index ou équivalent), min 1. */
  difficulty: number
}

/** Bloc analytique avancé (CTR benchmark, zones, opportunités) — GSC + volumes DataForSEO. */
export interface SeoAdvancedBlock {
  volumePositionScatter: SeoAdvancedVolumePositionPoint[]
  zoneSegments: SeoAdvancedZoneSegment[]
  kpis: SeoAdvancedKpis
  ctrScatter: SeoAdvancedCtrScatterPoint[]
  opportunityTop20: SeoAdvancedOpportunityRow[]
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
  /**
   * Score de priorité 0–100 : combine volume (log impressions), marge vers le haut de page et coût
   * d’effort (heuristique interne — voir carte Striking distance). Pas un CTR ni un rang Google.
   */
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

/** Page-level decay signal vs site benchmark. */
export interface ContentDecayAlert {
  page: string
  /** Variation relative des impressions (page), en % sur 100. */
  impressionsDeltaPct: number
  siteAvgImpressionsDeltaPct: number
  /** Écart en points de pourcentage : variation site − variation page. */
  decayExcess: number
  severity: 'watch' | 'alert' | 'critical'
}

export interface OrganicHealthDecayMonitor {
  siteAvgImpressionsDeltaPct: number
  alerts: ContentDecayAlert[]
}

/** Executive “North Star” header metrics (may combine GSC + internal assumptions). */
export interface ExecutiveNorthStar {
  /** Variation relative des clics organiques, en % sur 100 (ex. +12 = +12 %). */
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

/** Métadonnées de chargement GSC (pack A — fondations data). */
export interface DataLoadMeta {
  grainQueryPage: 'query_page'
  grainDate: 'date'
  rowLimit: number
  queryPageRowsCurrent: number
  queryPageRowsPrevious: number
  dateRowsCurrent: number
  dateRowsPrevious: number
  queryPageLikelyTruncatedCurrent: boolean
  queryPageLikelyTruncatedPrevious: boolean
  dateLikelyTruncatedCurrent: boolean
  dateLikelyTruncatedPrevious: boolean
  responseAggregationQueryPageCurrent?: string
  responseAggregationQueryPagePrevious?: string
  responseAggregationDateCurrent?: string
  responseAggregationDatePrevious?: string
  dateRangeCurrent: DashboardDateRange
  dateRangePrevious: { start: string; end: string }
}

/** Pont clics I×CTR au niveau site + requêtes (pack B). */
export interface ClickBridgeAggregate {
  clicksCurrent: number
  clicksPrevious: number
  impressionsCurrent: number
  impressionsPrevious: number
  /** CTR agrégé = Σ clics / Σ impr. (ratio 0–1, comme l’API GSC). */
  ctrCurrent: number
  ctrPrevious: number
  deltaClicks: number
  volumeEffectClicks: number
  ctrEffectClicks: number
}

export interface QueryClickDriver {
  query: string
  clicksCur: number
  clicksPrev: number
  impressionsCur: number
  impressionsPrev: number
  deltaClicks: number
  volumeEffectClicks: number
  ctrEffectClicks: number
  /**
   * Part du volume total de variation des clics (Σ |Δ clics| sur toutes les requêtes), 0–100 %.
   * Toujours positif : poids du mot-clé dans l’ensemble des mouvements, pas le Δ net site.
   */
  pctOfTotalAbsDelta: number | null
}

export interface ClickDriversResult {
  aggregate: ClickBridgeAggregate
  topDrivers: QueryClickDriver[]
}

/** Cartes GSC + DataForSEO (volumes FR via Google Ads Keywords Data). */
/** Période du filtre GSC affichée à côté des volumes (les dates ne sont pas envoyées à DataForSEO — défauts API). */
export interface DataForSeoVolumeDateRange {
  date_from: string
  date_to: string
}

export interface DataForSeoInsightBlock {
  demandVsVisibility: {
    /** Σ volumes mensuels estimés (requêtes appariées DataForSEO). */
    totalVolumeFr: number | null
    /** Σ impressions GSC sur les mêmes requêtes appariées. */
    totalImpressionsGsc: number
    /** Impressions GSC pour 1000 recherches / mois (ordre de grandeur). */
    impressionsPerKVolume: number | null
    matchedQueries: number
    gscQueriesUsed: number
  }
  leverage: {
    items: Array<{
      query: string
      volume: number
      position: number
      score: number
    }>
  }
  coverage: {
    volumeThreshold: number
    highVolumeCount: number
    highVolumeWithImpressions: number
    coveragePct: number | null
  }
  error: string | null
  fetchedAt: string | null
  /** Période GSC affichée (impressions) ; volumes DataForSEO sans paramètres de date. Absent si erreur. */
  volumeDateRange: DataForSeoVolumeDateRange | null
  /** Nuage position × volume FR (requêtes avec volume apparié). */
  positionVolumeScatter: PositionVolumeScatterPoint[]
  /** Métriques dérivées (CTR attendu, zones, opportunités) — null si pas de données GSC utiles. */
  seoAdvanced: SeoAdvancedBlock | null
}

/** Full BI snapshot for one filter set + date window (feeds dashboard modules). */
export interface BiDashboardSnapshot {
  filters: DashboardFilters
  northStar: ExecutiveNorthStar
  strikingDistance: StrikingDistanceMatrix
  decay: OrganicHealthDecayMonitor
  intentVolume: BusinessIntentVolume
  dataLoadMeta: DataLoadMeta
  clickDrivers: ClickDriversResult
  dailyCurrent: DailyTrendPoint[]
  dailyPrevious: DailyTrendPoint[]
  trendChart: Record<string, unknown>[]
  topGains: QueryMover[]
  topLosses: QueryMover[]
  cannibalization: CannibalizationRow[]
  scatterQueryPoints: QueryScatterPoint[]
  /** Enrichissement volumes FR — peut contenir `error` si l’API DataForSEO échoue. */
  dataForSeo: DataForSeoInsightBlock
}
