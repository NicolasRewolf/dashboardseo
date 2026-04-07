/**
 * Google Search Console OAuth2 (browser, PKCE).
 * @see https://developers.google.com/identity/protocols/oauth2/native-app
 */

export const GSC_READONLY_SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly'

export interface GscTokenBundle {
  accessToken: string
  expiresAt: number
  refreshToken?: string
}

export interface TokenResponse {
  access_token: string
  expires_in: number
  refresh_token?: string
  scope?: string
  token_type: string
}

export function getDefaultRedirectUri(): string {
  if (typeof window === 'undefined') return ''
  return import.meta.env.VITE_GSC_REDIRECT_URI ?? `${window.location.origin}/`
}

export function getGscClientId(): string {
  const id = import.meta.env.VITE_GSC_CLIENT_ID
  return typeof id === 'string' ? id.trim() : ''
}

/**
 * Required for Google OAuth clients of type « Application Web » (token + refresh).
 * Dev/local only in the browser bundle — production should use a backend exchange.
 */
export function getOptionalGscClientSecret(): string | undefined {
  const s = import.meta.env.VITE_GSC_CLIENT_SECRET
  if (typeof s !== 'string') return undefined
  const t = s.trim()
  return t.length > 0 ? t : undefined
}
