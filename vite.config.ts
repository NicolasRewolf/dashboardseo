import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

/**
 * Webmasters API v3 (Search Console) — pas de CORS navigateur → proxy en dev.
 * @see https://developers.google.com/webmaster-tools/v1/how-tos/authorizing
 */
const gscSearchConsoleProxy = {
  '/gsc-api': {
    target: 'https://www.googleapis.com',
    changeOrigin: true,
    rewrite: (p: string) => p.replace(/^\/gsc-api/, '/webmasters/v3'),
  },
} as const

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: gscSearchConsoleProxy,
  },
  preview: {
    proxy: gscSearchConsoleProxy,
  },
})
