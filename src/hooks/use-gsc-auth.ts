import { useContext } from 'react'

import { GscAuthContext, type GscAuthContextValue } from '@/contexts/gsc-auth-context-base'

export function useGscAuth(): GscAuthContextValue {
  const ctx = useContext(GscAuthContext)
  if (!ctx) throw new Error('useGscAuth must be used within GscAuthProvider')
  return ctx
}
