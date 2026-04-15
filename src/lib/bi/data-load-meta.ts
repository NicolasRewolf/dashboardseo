import type { DashboardDateRange, DataLoadMeta } from '@/types/bi'

export function buildDataLoadMeta(opts: {
  rowLimit: number
  queryPageRowsCurrent: number
  queryPageRowsPrevious: number
  dateRowsCurrent: number
  dateRowsPrevious: number
  responseAggregationQueryPageCurrent?: string
  responseAggregationQueryPagePrevious?: string
  responseAggregationDateCurrent?: string
  responseAggregationDatePrevious?: string
  dateRangeCurrent: DashboardDateRange
  dateRangePrevious: { start: string; end: string }
}): DataLoadMeta {
  const { rowLimit } = opts
  const trunc = (n: number) => n >= rowLimit
  return {
    grainQueryPage: 'query_page',
    grainDate: 'date',
    rowLimit,
    queryPageRowsCurrent: opts.queryPageRowsCurrent,
    queryPageRowsPrevious: opts.queryPageRowsPrevious,
    dateRowsCurrent: opts.dateRowsCurrent,
    dateRowsPrevious: opts.dateRowsPrevious,
    queryPageLikelyTruncatedCurrent: trunc(opts.queryPageRowsCurrent),
    queryPageLikelyTruncatedPrevious: trunc(opts.queryPageRowsPrevious),
    dateLikelyTruncatedCurrent: trunc(opts.dateRowsCurrent),
    dateLikelyTruncatedPrevious: trunc(opts.dateRowsPrevious),
    responseAggregationQueryPageCurrent: opts.responseAggregationQueryPageCurrent,
    responseAggregationQueryPagePrevious: opts.responseAggregationQueryPagePrevious,
    responseAggregationDateCurrent: opts.responseAggregationDateCurrent,
    responseAggregationDatePrevious: opts.responseAggregationDatePrevious,
    dateRangeCurrent: opts.dateRangeCurrent,
    dateRangePrevious: opts.dateRangePrevious,
  }
}
