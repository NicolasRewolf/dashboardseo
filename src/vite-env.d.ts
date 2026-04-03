/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GSC_CLIENT_ID?: string
  /** Web OAuth client secret — local dev only; use a backend in production. */
  readonly VITE_GSC_CLIENT_SECRET?: string
  readonly VITE_GSC_SITE_URL?: string
  readonly VITE_GSC_REDIRECT_URI?: string
}
