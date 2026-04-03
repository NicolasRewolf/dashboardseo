import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import {
  disconnectGsc,
  exchangeCodeForTokens,
  getValidAccessToken,
  parseOAuthCallbackSearch,
  redirectToGoogleAuth,
} from '@/lib/gsc/oauth-client'
import { getGscClientId } from '@/lib/gsc/oauth'
import { listSites, type GscSiteEntry } from '@/lib/gsc/api'
import { loadStoredTokens } from '@/lib/gsc/token-storage'

/** Dev Strict Mode runs the OAuth callback effect twice; avoid clearing URL / status too early. */
let gscOAuthExchangeInFlight = false

const SITE_KEY = 'gsc_selected_site_url'

function loadSavedSiteUrl(): string | null {
  try {
    return localStorage.getItem(SITE_KEY)
  } catch {
    return null
  }
}

function saveSiteUrl(url: string | null): void {
  try {
    if (url) localStorage.setItem(SITE_KEY, url)
    else localStorage.removeItem(SITE_KEY)
  } catch {
    /* ignore */
  }
}

function defaultSiteFromEnv(): string | null {
  const u = import.meta.env.VITE_GSC_SITE_URL
  return typeof u === 'string' && u.trim() ? u.trim() : null
}

function pickSiteUrl(list: GscSiteEntry[]): string | null {
  const preferred = defaultSiteFromEnv()
  const saved = loadSavedSiteUrl()
  return (
    (saved && list.some((s) => s.siteUrl === saved) ? saved : null) ??
    (preferred && list.some((s) => s.siteUrl === preferred) ? preferred : null) ??
    list[0]?.siteUrl ??
    null
  )
}

type GscAuthStatus = 'idle' | 'ready' | 'connecting' | 'error'

interface GscAuthContextValue {
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

const GscAuthContext = createContext<GscAuthContextValue | null>(null)

export function GscAuthProvider({ children }: { children: ReactNode }) {
  const hasClientId = Boolean(getGscClientId())
  const [status, setStatus] = useState<GscAuthStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [sites, setSites] = useState<GscSiteEntry[]>([])
  const [siteUrl, setSiteUrlState] = useState<string | null>(() => loadSavedSiteUrl())
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(loadStoredTokens()?.accessToken))

  const applySitesList = useCallback((list: GscSiteEntry[]) => {
    setSites(list)
    const pick = pickSiteUrl(list)
    setSiteUrlState((curr) => {
      if (curr && list.some((s) => s.siteUrl === curr)) return curr
      if (pick) {
        saveSiteUrl(pick)
        return pick
      }
      return curr
    })
  }, [])

  const refreshSites = useCallback(async () => {
    const token = await getValidAccessToken()
    if (!token) {
      setSites([])
      return
    }
    const list = await listSites(token)
    applySitesList(list)
  }, [applySitesList])

  const setSiteUrl = useCallback((url: string | null) => {
    setSiteUrlState(url)
    saveSiteUrl(url)
  }, [])

  useEffect(() => {
    const { code, state, error: oauthErr, errorDescription } = parseOAuthCallbackSearch(
      window.location.search
    )
    if (oauthErr) {
      setError(errorDescription ?? oauthErr)
      setStatus('error')
      window.history.replaceState({}, '', `${window.location.pathname}${window.location.hash}`)
      return
    }
    if (!code || !state) {
      if (!gscOAuthExchangeInFlight) setStatus('ready')
      return
    }

    gscOAuthExchangeInFlight = true
    window.history.replaceState({}, '', `${window.location.pathname}${window.location.hash}`)
    setStatus('connecting')

    exchangeCodeForTokens(code, state)
      .then(async () => {
        setIsAuthenticated(true)
        setError(null)
        const token = await getValidAccessToken()
        if (!token) return
        const list = await listSites(token)
        applySitesList(list)
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : String(e))
        setStatus('error')
      })
      .finally(() => {
        gscOAuthExchangeInFlight = false
        setStatus((s) => (s === 'error' ? s : 'ready'))
      })
  }, [applySitesList])

  useEffect(() => {
    if (!loadStoredTokens()?.accessToken) return
    void refreshSites()
  }, [refreshSites])

  const connect = useCallback(async () => {
    setError(null)
    await redirectToGoogleAuth()
  }, [])

  const disconnect = useCallback(() => {
    disconnectGsc()
    setIsAuthenticated(false)
    setSites([])
    setSiteUrlState(null)
    saveSiteUrl(null)
    setError(null)
  }, [])

  const value = useMemo(
    (): GscAuthContextValue => ({
      status,
      error,
      hasClientId,
      isAuthenticated,
      sites,
      siteUrl,
      setSiteUrl,
      connect,
      disconnect,
      refreshSites,
    }),
    [status, error, hasClientId, isAuthenticated, sites, siteUrl, setSiteUrl, connect, disconnect, refreshSites]
  )

  return <GscAuthContext.Provider value={value}>{children}</GscAuthContext.Provider>
}

export function useGscAuth(): GscAuthContextValue {
  const ctx = useContext(GscAuthContext)
  if (!ctx) throw new Error('useGscAuth must be used within GscAuthProvider')
  return ctx
}
