import { format, startOfMonth, startOfYear, subDays } from 'date-fns'

import type { DashboardDateRange } from '@/types/bi'

/** Premier jour du mois calendaire courant → aujourd’hui (inclus). */
export function getCurrentMonthRange(now: Date = new Date()): DashboardDateRange {
  const start = startOfMonth(now)
  return {
    start: format(start, 'yyyy-MM-dd'),
    end: format(now, 'yyyy-MM-dd'),
  }
}

/** 1er janvier de l’année courante → aujourd’hui (inclus). */
export function getCurrentYearRange(now: Date = new Date()): DashboardDateRange {
  const start = startOfYear(now)
  return {
    start: format(start, 'yyyy-MM-dd'),
    end: format(now, 'yyyy-MM-dd'),
  }
}

/** Fenêtre glissante de N jours se terminant aujourd’hui (inclus). */
export function getRollingDaysRange(days: number, now: Date = new Date()): DashboardDateRange {
  const end = now
  const start = subDays(end, days - 1)
  return {
    start: format(start, 'yyyy-MM-dd'),
    end: format(end, 'yyyy-MM-dd'),
  }
}

export function rangesEqual(a: DashboardDateRange, b: DashboardDateRange): boolean {
  return a.start === b.start && a.end === b.end
}

export function isCurrentMonthRange(
  range: DashboardDateRange,
  now: Date = new Date()
): boolean {
  return rangesEqual(range, getCurrentMonthRange(now))
}

export function isCurrentYearRange(
  range: DashboardDateRange,
  now: Date = new Date()
): boolean {
  return rangesEqual(range, getCurrentYearRange(now))
}
