/**
 * PKCE helpers (RFC 7636) for public OAuth clients.
 */

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function randomBytes(length: number): Uint8Array {
  const a = new Uint8Array(length)
  crypto.getRandomValues(a)
  return a
}

/** 43–128 characters per RFC 7636. */
export function createCodeVerifier(): string {
  return base64UrlEncode(randomBytes(32).buffer)
}

export async function createCodeChallengeS256(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return base64UrlEncode(digest)
}

export function createOAuthState(): string {
  return base64UrlEncode(randomBytes(16).buffer)
}
