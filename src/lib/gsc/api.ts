import type {
  GscQueryRequestBody,
  GscSearchAnalyticsResponse,
  GscSearchAnalyticsRow,
} from '@/types/gsc'

/** Webmasters API v3 — liste des sites et Search Analytics. */
const WEBMASTERS_V3 = 'https://www.googleapis.com/webmasters/v3'

/** En dev : proxy Vite (`/gsc-api` → www.googleapis.com/webmasters/v3). */
function getGscApiBase(): string {
  if (import.meta.env.DEV) {
    return '/gsc-api'
  }
  return WEBMASTERS_V3
}

export interface GscSiteEntry {
  siteUrl: string
  permissionLevel?: string
}

export interface GscListSitesResponse {
  siteEntry?: GscSiteEntry[]
}

export async function listSites(accessToken: string): Promise<GscSiteEntry[]> {
  const res = await fetch(`${getGscApiBase()}/sites`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(`listSites ${res.status}: ${t}`)
  }
  const json = (await res.json()) as GscListSitesResponse
  return json.siteEntry ?? []
}

function encodeSitePath(siteUrl: string): string {
  return encodeURIComponent(siteUrl)
}

/** Plafond GSC Search Analytics par requête (lignes renvoyées). */
export const GSC_SEARCH_ANALYTICS_ROW_LIMIT = 25_000

export interface GscSearchAnalyticsResult {
  rows: GscSearchAnalyticsRow[]
  /** Présent si Google a agrégé différemment (ex. `byProperty`). */
  responseAggregationType?: string
}

export async function searchAnalyticsQuery(
  accessToken: string,
  siteUrl: string,
  body: GscQueryRequestBody
): Promise<GscSearchAnalyticsResult> {
  const path = `${getGscApiBase()}/sites/${encodeSitePath(siteUrl)}/searchAnalytics/query`
  const res = await fetch(path, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(`searchAnalytics ${res.status}: ${t}`)
  }
  const json = (await res.json()) as GscSearchAnalyticsResponse
  return {
    rows: json.rows ?? [],
    responseAggregationType: json.responseAggregationType,
  }
}
