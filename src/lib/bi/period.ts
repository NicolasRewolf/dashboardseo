import { differenceInCalendarDays, format, parseISO, subDays } from 'date-fns'

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
