import { createCodeChallengeS256, createCodeVerifier, createOAuthState } from '@/lib/gsc/pkce'
import {
  clearPendingOAuth,
  clearStoredTokens,
  loadStoredTokens,
  peekPendingVerifier,
  savePendingOAuth,
  saveStoredTokens,
} from '@/lib/gsc/token-storage'
import {
  GSC_READONLY_SCOPE,
  getDefaultRedirectUri,
  getGscClientId,
  getOptionalGscClientSecret,
  type GscTokenBundle,
  type TokenResponse,
} from '@/lib/gsc/oauth'

function applyClientSecret(body: URLSearchParams): void {
  const secret = getOptionalGscClientSecret()
  if (secret) body.set('client_secret', secret)
}

const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'
const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth'

function toBundle(tr: TokenResponse): GscTokenBundle {
  return {
    accessToken: tr.access_token,
    expiresAt: Date.now() + tr.expires_in * 1000 - 30_000,
    refreshToken: tr.refresh_token,
  }
}

export function buildAuthorizationUrl(params: {
  clientId: string
  redirectUri: string
  codeChallenge: string
  state: string
}): string {
  const u = new URL(AUTH_ENDPOINT)
  u.searchParams.set('client_id', params.clientId)
  u.searchParams.set('redirect_uri', params.redirectUri)
  u.searchParams.set('response_type', 'code')
  u.searchParams.set('scope', GSC_READONLY_SCOPE)
  u.searchParams.set('code_challenge', params.codeChallenge)
  u.searchParams.set('code_challenge_method', 'S256')
  u.searchParams.set('state', params.state)
  u.searchParams.set('access_type', 'offline')
  u.searchParams.set('prompt', 'consent')
  return u.toString()
}

/** Start OAuth redirect (call from a user gesture). */
export async function redirectToGoogleAuth(): Promise<void> {
  const clientId = getGscClientId()
  if (!clientId) {
    throw new Error('Missing VITE_GSC_CLIENT_ID')
  }
  const redirectUri = getDefaultRedirectUri()
  const verifier = createCodeVerifier()
  const challenge = await createCodeChallengeS256(verifier)
  const state = createOAuthState()
  savePendingOAuth({ state, codeVerifier: verifier, redirectUri, createdAt: Date.now() })
  const url = buildAuthorizationUrl({
    clientId,
    redirectUri,
    codeChallenge: challenge,
    state,
  })
  window.location.assign(url)
}

export async function exchangeCodeForTokens(code: string, state: string): Promise<GscTokenBundle> {
  const clientId = getGscClientId()
  if (!clientId) throw new Error('Missing VITE_GSC_CLIENT_ID')
  const pending = peekPendingVerifier(state)
  if (!pending) {
    throw new Error('OAuth state mismatch — réessayez la connexion.')
  }
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: pending.redirectUri,
    client_id: clientId,
    code_verifier: pending.codeVerifier,
  })
  applyClientSecret(body)
  try {
    const res = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
    if (!res.ok) {
      const err = await res.text()
      clearPendingOAuth()
      throw new Error(`Token exchange failed: ${res.status} ${err}`)
    }
    const json = (await res.json()) as TokenResponse
    const bundle = toBundle(json)
    saveStoredTokens(bundle)
    clearPendingOAuth()
    return bundle
  } catch (e) {
    if (e instanceof Error && e.message.startsWith('Token exchange failed')) throw e
    clearPendingOAuth()
    throw e
  }
}

export async function refreshAccessToken(refreshToken: string): Promise<GscTokenBundle> {
  const clientId = getGscClientId()
  if (!clientId) throw new Error('Missing VITE_GSC_CLIENT_ID')
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
  })
  applyClientSecret(body)
  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Refresh failed: ${res.status} ${err}`)
  }
  const json = (await res.json()) as TokenResponse
  const bundle = toBundle(json)
  if (!bundle.refreshToken) {
    bundle.refreshToken = refreshToken
  }
  saveStoredTokens(bundle)
  return bundle
}

/** Returns a valid access token, refreshing when needed. */
export async function getValidAccessToken(): Promise<string | null> {
  let bundle = loadStoredTokens()
  if (!bundle) return null
  if (Date.now() < bundle.expiresAt) {
    return bundle.accessToken
  }
  if (!bundle.refreshToken) {
    clearStoredTokens()
    return null
  }
  try {
    bundle = await refreshAccessToken(bundle.refreshToken)
    return bundle.accessToken
  } catch {
    clearStoredTokens()
    return null
  }
}

export function disconnectGsc(): void {
  clearStoredTokens()
}

export function parseOAuthCallbackSearch(search: string): {
  code: string | null
  state: string | null
  error: string | null
  errorDescription: string | null
} {
  const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`)
  return {
    code: params.get('code'),
    state: params.get('state'),
    error: params.get('error'),
    errorDescription: params.get('error_description'),
  }
}
