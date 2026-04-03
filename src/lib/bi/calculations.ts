import type {
  BrandFilterMode,
  BusinessIntentVolume,
  ContentDecayAlert,
  ExecutiveNorthStar,
  OrganicHealthDecayMonitor,
  SemanticPillarPerformance,
  SemanticPillarSnapshot,
  StrikingDistanceKeyword,
  StrikingDistanceMatrix,
} from '@/types/bi'
import type { GscNormalizedRow } from '@/types/gsc'
import type { LegalSpecialtyId } from '@/types/specialties'
import { isBrandQuery } from '@/lib/bi/brand-filter'
import { inferSearchIntent, transactionalWeight } from '@/lib/bi/intent'
import { resolveSpecialtyFromPage } from '@/lib/bi/resolve-specialty'

const STRIKING_MIN_POS = 4
const STRIKING_MAX_POS = 12
const STRIKING_MIN_IMPRESSIONS = 80

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n))
}

/**
 * Effort vs reward: upside from position lift vs difficulty (heuristic).
 * reward ≈ impressions × room-to-top; effort ↑ as position → 1.
 */
export function computeEffortVsRewardScore(row: {
  position: number
  impressions: number
}): number {
  const p = row.position
  if (p < STRIKING_MIN_POS || p > STRIKING_MAX_POS) return 0
  const room = (13 - p) / 9
  const vol = Math.log1p(row.impressions)
  const effort = 1 + (STRIKING_MAX_POS - p) * 0.08
  const raw = (vol * room) / effort
  return Math.round(clamp01(raw / 12) * 100)
}

export function buildStrikingDistanceMatrix(
  rows: GscNormalizedRow[],
  opts?: { minImpressions?: number; minPos?: number; maxPos?: number }
): StrikingDistanceMatrix {
  const minImpressions = opts?.minImpressions ?? STRIKING_MIN_IMPRESSIONS
  const minPos = opts?.minPos ?? STRIKING_MIN_POS
  const maxPos = opts?.maxPos ?? STRIKING_MAX_POS

  const items: StrikingDistanceKeyword[] = []

  for (const r of rows) {
    if (!r.query) continue
    const p = r.position
    if (p < minPos || p > maxPos) continue
    if (r.impressions < minImpressions) continue

    items.push({
      query: r.query,
      page: r.page,
      position: p,
      impressions: r.impressions,
      clicks: r.clicks,
      ctr: r.ctr,
      effortVsRewardScore: computeEffortVsRewardScore(r),
      label: 'immediate_growth_opportunity',
    })
  }

  items.sort((a, b) => b.effortVsRewardScore - a.effortVsRewardScore)

  return {
    items,
    meta: { minPosition: minPos, maxPosition: maxPos, minImpressions },
  }
}

export function filterRowsByBrandMode(
  rows: GscNormalizedRow[],
  mode: BrandFilterMode
): GscNormalizedRow[] {
  if (mode === 'all') return rows
  return rows.filter((r) => {
    const q = r.query ?? ''
    const brand = isBrandQuery(q)
    if (mode === 'brand') return brand
    return !brand
  })
}

export function filterRowsBySpecialty(
  rows: GscNormalizedRow[],
  specialtyId: LegalSpecialtyId | null
): GscNormalizedRow[] {
  if (!specialtyId) return rows
  return rows.filter((r) => resolveSpecialtyFromPage(r.page ?? '') === specialtyId)
}

export function aggregateImpressionsByPage(rows: GscNormalizedRow[]): Map<string, number> {
  const m = new Map<string, number>()
  for (const r of rows) {
    if (!r.page) continue
    m.set(r.page, (m.get(r.page) ?? 0) + r.impressions)
  }
  return m
}

export function sumClicks(rows: GscNormalizedRow[]): number {
  return rows.reduce((s, r) => s + r.clicks, 0)
}

export function totalMapValues(m: Map<string, number>): number {
  let s = 0
  for (const v of m.values()) s += v
  return s
}

export function buildSemanticPillarPerformance(
  rows: GscNormalizedRow[]
): SemanticPillarPerformance {
  const byPillar = new Map<
    LegalSpecialtyId,
    { clicks: number; impressions: number; posWeight: number }
  >()

  let totalClicks = 0

  for (const r of rows) {
    const page = r.page ?? ''
    const sid = resolveSpecialtyFromPage(page)
    const cur = byPillar.get(sid) ?? { clicks: 0, impressions: 0, posWeight: 0 }
    cur.clicks += r.clicks
    cur.impressions += r.impressions
    cur.posWeight += r.position * r.impressions
    byPillar.set(sid, cur)
    totalClicks += r.clicks
  }

  const pillars: SemanticPillarSnapshot[] = [...byPillar.entries()].map(([specialtyId, v]) => ({
    specialtyId,
    clicks: v.clicks,
    impressions: v.impressions,
    weightedPosition: v.impressions > 0 ? v.posWeight / v.impressions : 0,
    clickShare: totalClicks > 0 ? v.clicks / totalClicks : 0,
  }))

  pillars.sort((a, b) => b.clicks - a.clicks)

  return { pillars, totalClicks }
}

export function buildDecayMonitor(
  currentByPage: Map<string, number>,
  previousByPage: Map<string, number>,
  siteAvgCurrent: number,
  siteAvgPrevious: number
): OrganicHealthDecayMonitor {
  const siteAvgImpressionsDeltaPct =
    siteAvgPrevious > 0 ? ((siteAvgCurrent - siteAvgPrevious) / siteAvgPrevious) * 100 : 0

  const alerts: ContentDecayAlert[] = []

  for (const [page, curImp] of currentByPage) {
    const prev = previousByPage.get(page) ?? 0
    if (prev < 20) continue
    const deltaPct = ((curImp - prev) / prev) * 100
    const decayExcess = siteAvgImpressionsDeltaPct - deltaPct

    let severity: ContentDecayAlert['severity'] = 'watch'
    if (decayExcess > 15) severity = 'critical'
    else if (decayExcess > 8) severity = 'alert'

    if (deltaPct < siteAvgImpressionsDeltaPct - 5) {
      alerts.push({
        page,
        impressionsDeltaPct: deltaPct,
        siteAvgImpressionsDeltaPct,
        decayExcess,
        severity,
      })
    }
  }

  alerts.sort((a, b) => b.decayExcess - a.decayExcess)

  return { siteAvgImpressionsDeltaPct, alerts }
}

export function buildBusinessIntentVolume(rows: GscNormalizedRow[]): BusinessIntentVolume {
  let totalImpressions = 0
  let totalClicks = 0
  let businessIntentVolume = 0
  const byIntent = {} as BusinessIntentVolume['byIntent']

  for (const r of rows) {
    const q = r.query ?? ''
    const { intent } = inferSearchIntent(q)
    const w = transactionalWeight(intent)
    totalImpressions += r.impressions
    totalClicks += r.clicks
    businessIntentVolume += r.impressions * w

    const slot = byIntent[intent] ?? { impressions: 0, clicks: 0 }
    slot.impressions += r.impressions
    slot.clicks += r.clicks
    byIntent[intent] = slot
  }

  return {
    totalImpressions,
    totalClicks,
    businessIntentVolume,
    byIntent,
  }
}

/**
 * North Star placeholders — wire to your market model + period comparisons.
 */
export function buildExecutiveNorthStar(partial?: Partial<ExecutiveNorthStar>): ExecutiveNorthStar {
  return {
    estimatedMarketShare: partial?.estimatedMarketShare ?? null,
    organicGrowthVelocity: partial?.organicGrowthVelocity ?? null,
    highIntentLeadProxy: partial?.highIntentLeadProxy ?? null,
  }
}
