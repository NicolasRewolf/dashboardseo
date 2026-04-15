import type { PositionVolumeScatterPoint } from '@/types/bi'

export type PositionVolumeQuadrantId = 'good_high' | 'good_low' | 'bad_high' | 'bad_low'

interface PositionVolumeQuadrantDef {
  id: PositionVolumeQuadrantId
  /** Titre court (carte / légende). */
  label: string
  /** Sous-texte métier. */
  hint: string
}

export const POSITION_VOLUME_QUADRANTS: Record<PositionVolumeQuadrantId, PositionVolumeQuadrantDef> = {
  good_high: {
    id: 'good_high',
    label: 'Déjà bien placé sur de la demande',
    hint: 'Position ≤ médiane · volume ≥ médiane',
  },
  good_low: {
    id: 'good_low',
    label: 'Bonne visibilité · demande modeste',
    hint: 'Position ≤ médiane · volume < médiane',
  },
  bad_high: {
    id: 'bad_high',
    label: 'Forte demande / mauvaise visibilité',
    hint: 'Position > médiane · volume ≥ médiane — priorité SEO',
  },
  bad_low: {
    id: 'bad_low',
    label: 'Faible enjeu sur la période',
    hint: 'Position > médiane · volume < médiane',
  },
}

function median(values: number[]): number | null {
  if (values.length === 0) return null
  const s = [...values].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 === 1 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2
}

export interface PositionVolumeQuadrantSplit {
  medianPosition: number
  medianVolume: number
  /** Comptage par quadrant (même logique que le graphique). */
  counts: Record<PositionVolumeQuadrantId, number>
}

/**
 * Seuils : **médiane** position et volume sur les points affichés (adaptatif au périmètre).
 * Lecture graphique : axe X = volume (log), axe Y = position (haut = mieux classé) — les quadrants coupent selon ces médianes.
 */
export function computePositionVolumeQuadrantSplit(
  points: PositionVolumeScatterPoint[]
): PositionVolumeQuadrantSplit | null {
  if (points.length < 4) return null

  const positions = points.map((p) => p.position)
  const volumes = points.map((p) => p.volume)
  const medianPosition = median(positions)
  const medianVolume = median(volumes)
  if (medianPosition == null || medianVolume == null) return null

  const counts: Record<PositionVolumeQuadrantId, number> = {
    good_high: 0,
    good_low: 0,
    bad_high: 0,
    bad_low: 0,
  }

  for (const p of points) {
    const left = p.position <= medianPosition
    const highVol = p.volume >= medianVolume
    if (left && highVol) counts.good_high++
    else if (left && !highVol) counts.good_low++
    else if (!left && highVol) counts.bad_high++
    else counts.bad_low++
  }

  return { medianPosition, medianVolume, counts }
}

export function getQuadrantIdForPoint(
  p: PositionVolumeScatterPoint,
  medianPosition: number,
  medianVolume: number
): PositionVolumeQuadrantId {
  const left = p.position <= medianPosition
  const highVol = p.volume >= medianVolume
  if (left && highVol) return 'good_high'
  if (left && !highVol) return 'good_low'
  if (!left && highVol) return 'bad_high'
  return 'bad_low'
}

function sortQuadrantPoints(points: PositionVolumeScatterPoint[]): PositionVolumeScatterPoint[] {
  return [...points].sort((a, b) => {
    if (b.impressions !== a.impressions) return b.impressions - a.impressions
    if (b.volume !== a.volume) return b.volume - a.volume
    return a.query.localeCompare(b.query, 'fr', { sensitivity: 'base' })
  })
}

/** Liste des requêtes par zone (même règle que le graphique), triées par impressions décroissantes. */
export function groupPointsByQuadrant(
  points: PositionVolumeScatterPoint[],
  medianPosition: number,
  medianVolume: number
): Record<PositionVolumeQuadrantId, PositionVolumeScatterPoint[]> {
  const out: Record<PositionVolumeQuadrantId, PositionVolumeScatterPoint[]> = {
    good_high: [],
    good_low: [],
    bad_high: [],
    bad_low: [],
  }
  for (const p of points) {
    const id = getQuadrantIdForPoint(p, medianPosition, medianVolume)
    out[id].push(p)
  }
  for (const id of Object.keys(out) as PositionVolumeQuadrantId[]) {
    out[id] = sortQuadrantPoints(out[id]!)
  }
  return out
}
