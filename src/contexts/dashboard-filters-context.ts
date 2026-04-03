import { createContext } from 'react'

import type { BrandFilterMode, DashboardDateRange } from '@/types/bi'

export interface DashboardFiltersState {
  dateRange: DashboardDateRange
  brandMode: BrandFilterMode
}

export type DashboardFiltersContextValue = DashboardFiltersState & {
  setDateRange: (r: DashboardDateRange) => void
  setBrandMode: (m: BrandFilterMode) => void
}

export const DashboardFiltersContext = createContext<DashboardFiltersContextValue | null>(null)
