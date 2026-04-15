import {
  addDays,
  differenceInCalendarDays,
  endOfMonth,
  format,
  min,
  parseISO,
  startOfMonth,
  subDays,
  subMonths,
} from 'date-fns'

/** Previous window of the same inclusive length, immediately before `range.start`. */
export function previousPeriodRange(range: { start: string; end: string }): {
  start: string
  end: string
} {
  const start = parseISO(range.start)
  const end = parseISO(range.end)
  const days = differenceInCalendarDays(end, start) + 1
  const prevEnd = subDays(start, 1)
  const prevStart = subDays(prevEnd, days - 1)
  return {
    start: format(prevStart, 'yyyy-MM-dd'),
    end: format(prevEnd, 'yyyy-MM-dd'),
  }
}

/**
 * Mois en cours (1er du mois → fin) : compare avec le **même nombre de jours** depuis le 1er du mois **précédent**.
 * Ex. 1–3 avril vs 1–3 mars. Si le mois précédent est plus court (ex. février), la fin est plafonnée au dernier jour du mois.
 */
export function previousMonthAlignedPeriod(range: { start: string; end: string }): {
  start: string
  end: string
} {
  const rangeStart = parseISO(range.start)
  const rangeEnd = parseISO(range.end)
  const days = differenceInCalendarDays(rangeEnd, rangeStart) + 1

  const prevMonthStart = startOfMonth(subMonths(rangeStart, 1))
  const candidateEnd = addDays(prevMonthStart, days - 1)
  const prevEnd = min([candidateEnd, endOfMonth(prevMonthStart)])

  return {
    start: format(prevMonthStart, 'yyyy-MM-dd'),
    end: format(prevEnd, 'yyyy-MM-dd'),
  }
}
