import type { DailyTrendPoint } from '@/types/bi'

/** Regroupe par semaine ISO (lundi) si `weekly` — position moyenne pondérée par impressions. */
export function bucketPositionTrend(
  points: DailyTrendPoint[],
  weekly: boolean
): DailyTrendPoint[] {
  if (!weekly || points.length < 8) return points

  type Bucket = { imp: number; posW: number; clk: number; weekStart: string }
  const m = new Map<string, Bucket>()

  for (const p of points) {
    const d = new Date(p.date + 'T12:00:00Z')
    const day = d.getUTCDay()
    const diff = day === 0 ? -6 : 1 - day
    const monday = new Date(d)
    monday.setUTCDate(d.getUTCDate() + diff)
    const weekStart = monday.toISOString().slice(0, 10)

    const cur = m.get(weekStart) ?? { imp: 0, posW: 0, clk: 0, weekStart }
    cur.imp += p.impressions
    cur.posW += p.position * p.impressions
    cur.clk += p.clicks
    m.set(weekStart, cur)
  }

  return [...m.values()]
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart))
    .map((b) => ({
      date: b.weekStart,
      clicks: b.clk,
      impressions: b.imp,
      position: b.imp > 0 ? b.posW / b.imp : 0,
    }))
}

export function shouldUseWeeklyPositionTrend(dayCount: number): boolean {
  return dayCount > 90
}
