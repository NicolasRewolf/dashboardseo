import { createContext } from 'react'

import type { GscSiteEntry } from '@/lib/gsc/api'

export type GscAuthStatus = 'idle' | 'ready' | 'connecting' | 'error'

export interface GscAuthContextValue {
  status: GscAuthStatus
  error: string | null
  hasClientId: boolean
  isAuthenticated: boolean
  sites: GscSiteEntry[]
  siteUrl: string | null
  setSiteUrl: (url: string | null) => void
  connect: () => Promise<void>
  disconnect: () => void
  refreshSites: () => Promise<void>
}

export const GscAuthContext = createContext<GscAuthContextValue | null>(null)
