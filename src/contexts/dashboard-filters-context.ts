import { createContext } from 'react'

import type { BrandFilterMode, DashboardDateRange, PageSegmentMode } from '@/types/bi'

export interface DashboardFiltersState {
  dateRange: DashboardDateRange
  brandMode: BrandFilterMode
  pageSegment: PageSegmentMode
}

export type DashboardFiltersContextValue = DashboardFiltersState & {
  setDateRange: (r: DashboardDateRange) => void
  setBrandMode: (m: BrandFilterMode) => void
  setPageSegment: (m: PageSegmentMode) => void
}

export const DashboardFiltersContext = createContext<DashboardFiltersContextValue | null>(null)
