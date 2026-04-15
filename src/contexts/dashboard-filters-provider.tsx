import { useMemo, useState, type ReactNode } from 'react'

import type { BrandFilterMode, DashboardDateRange, PageSegmentMode } from '@/types/bi'

import {
  DashboardFiltersContext,
  type DashboardFiltersContextValue,
} from '@/contexts/dashboard-filters-context'
import { getRollingDaysRange } from '@/lib/dashboard-date-presets'

function defaultDateRange(): DashboardDateRange {
  return getRollingDaysRange(29)
}

export function DashboardFiltersProvider({ children }: { children: ReactNode }) {
  const [dateRange, setDateRange] = useState<DashboardDateRange>(defaultDateRange)
  const [brandMode, setBrandMode] = useState<BrandFilterMode>('all')
  const [pageSegment, setPageSegment] = useState<PageSegmentMode>('all')

  const value = useMemo(
    (): DashboardFiltersContextValue => ({
      dateRange,
      brandMode,
      pageSegment,
      setDateRange,
      setBrandMode,
      setPageSegment,
    }),
    [dateRange, brandMode, pageSegment]
  )

  return (
    <DashboardFiltersContext.Provider value={value}>{children}</DashboardFiltersContext.Provider>
  )
}
