import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import type { BrandFilterMode, DashboardDateRange } from '@/types/bi'
import type { LegalSpecialtyId } from '@/types/specialties'

export interface DashboardFiltersState {
  dateRange: DashboardDateRange
  brandMode: BrandFilterMode
  specialtyId: LegalSpecialtyId | null
}

type DashboardFiltersContextValue = DashboardFiltersState & {
  setDateRange: (r: DashboardDateRange) => void
  setBrandMode: (m: BrandFilterMode) => void
  setSpecialtyId: (id: LegalSpecialtyId | null) => void
  resetSpecialty: () => void
}

function defaultDateRange(): DashboardDateRange {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - 28)
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  }
}

const DashboardFiltersContext = createContext<DashboardFiltersContextValue | null>(null)

export function DashboardFiltersProvider({ children }: { children: ReactNode }) {
  const [dateRange, setDateRange] = useState<DashboardDateRange>(defaultDateRange)
  const [brandMode, setBrandMode] = useState<BrandFilterMode>('non_brand')
  const [specialtyId, setSpecialtyId] = useState<LegalSpecialtyId | null>(null)

  const resetSpecialty = useCallback(() => setSpecialtyId(null), [])

  const value = useMemo(
    (): DashboardFiltersContextValue => ({
      dateRange,
      brandMode,
      specialtyId,
      setDateRange,
      setBrandMode,
      setSpecialtyId,
      resetSpecialty,
    }),
    [dateRange, brandMode, specialtyId]
  )

  return (
    <DashboardFiltersContext.Provider value={value}>{children}</DashboardFiltersContext.Provider>
  )
}

export function useDashboardFilters(): DashboardFiltersContextValue {
  const ctx = useContext(DashboardFiltersContext)
  if (!ctx) {
    throw new Error('useDashboardFilters must be used within DashboardFiltersProvider')
  }
  return ctx
}
