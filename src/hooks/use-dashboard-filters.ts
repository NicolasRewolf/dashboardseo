import { useContext } from 'react'

import {
  DashboardFiltersContext,
  type DashboardFiltersContextValue,
} from '@/contexts/dashboard-filters-context'

export function useDashboardFilters(): DashboardFiltersContextValue {
  const ctx = useContext(DashboardFiltersContext)
  if (!ctx) {
    throw new Error('useDashboardFilters must be used within DashboardFiltersProvider')
  }
  return ctx
}
