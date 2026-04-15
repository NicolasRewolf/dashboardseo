/**
 * Courbe CTR « attendu » par position (repères fixes type benchmark SERP).
 * Interpolation linéaire entre positions entières ; au-delà de 10, décroissance légère jusqu’à 20.
 */

const ANCHORS: Array<{ pos: number; ctr: number }> = [
  { pos: 1, ctr: 0.28 },
  { pos: 2, ctr: 0.15 },
  { pos: 3, ctr: 0.11 },
  { pos: 4, ctr: 0.08 },
  { pos: 5, ctr: 0.06 },
  { pos: 6, ctr: 0.05 },
  { pos: 7, ctr: 0.04 },
  { pos: 8, ctr: 0.03 },
  { pos: 9, ctr: 0.025 },
  { pos: 10, ctr: 0.02 },
]

/** CTR attendu à la position 3 (gain « si top 3 »). */
export const EXPECTED_CTR_AT_3 = 0.11

/**
 * Retourne un CTR attendu (0–1) pour une position moyenne (peut être décimale), clamp [1, 20].
 */
export function getExpectedCtr(position: number): number {
  const p = Math.min(20, Math.max(1, position))
  if (p <= 10) {
    for (let i = 0; i < ANCHORS.length - 1; i++) {
      const a = ANCHORS[i]!
      const b = ANCHORS[i + 1]!
      if (p >= a.pos && p <= b.pos) {
        const t = (p - a.pos) / (b.pos - a.pos)
        return a.ctr + t * (b.ctr - a.ctr)
      }
    }
    return ANCHORS[ANCHORS.length - 1]!.ctr
  }
  const t = (p - 10) / 10
  return 0.02 * (1 - t) + 0.01 * t
}

/** Points (position, ctr) pour tracer la courbe de référence 1…20 (pas à pas 0.25). */
export function sampleExpectedCtrCurve(): Array<{ position: number; ctr: number }> {
  const out: Array<{ position: number; ctr: number }> = []
  for (let i = 0; i <= 76; i++) {
    const position = 1 + i * 0.25
    if (position > 20) break
    out.push({ position, ctr: getExpectedCtr(position) })
  }
  return out
}
