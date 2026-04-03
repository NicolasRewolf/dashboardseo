import type { GscTokenBundle } from '@/lib/gsc/oauth'

const TOKEN_KEY = 'gsc_token_bundle'
const PENDING_OAUTH_KEY = 'gsc_oauth_pending'

export interface PendingOAuthPayload {
  state: string
  codeVerifier: string
  redirectUri: string
  createdAt: number
}

export function savePendingOAuth(payload: PendingOAuthPayload): void {
  sessionStorage.setItem(PENDING_OAUTH_KEY, JSON.stringify(payload))
}

/** Read PKCE payload without removing (required for React Strict Mode double mount). */
export function peekPendingVerifier(expectedState: string): {
  codeVerifier: string
  redirectUri: string
} | null {
  const raw = sessionStorage.getItem(PENDING_OAUTH_KEY)
  if (!raw) return null
  try {
    const p = JSON.parse(raw) as PendingOAuthPayload
    if (p.state !== expectedState) return null
    return { codeVerifier: p.codeVerifier, redirectUri: p.redirectUri }
  } catch {
    return null
  }
}

export function clearPendingOAuth(): void {
  sessionStorage.removeItem(PENDING_OAUTH_KEY)
}

/** @deprecated Prefer peek + clearPendingOAuth after exchange (Strict Mode safe). */
export function consumePendingVerifier(expectedState: string): {
  codeVerifier: string
  redirectUri: string
} | null {
  const peeked = peekPendingVerifier(expectedState)
  if (peeked) clearPendingOAuth()
  return peeked
}

export function loadStoredTokens(): GscTokenBundle | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY)
    if (!raw) return null
    const t = JSON.parse(raw) as GscTokenBundle
    if (!t.accessToken || typeof t.expiresAt !== 'number') return null
    return t
  } catch {
    return null
  }
}

export function saveStoredTokens(bundle: GscTokenBundle): void {
  localStorage.setItem(TOKEN_KEY, JSON.stringify(bundle))
}

export function clearStoredTokens(): void {
  localStorage.removeItem(TOKEN_KEY)
}
