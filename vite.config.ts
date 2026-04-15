import path from 'path'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type ProxyOptions } from 'vite'

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

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const dfsLogin = env.DATAFORSEO_LOGIN ?? ''
  const dfsPassword = env.DATAFORSEO_PASSWORD ?? ''

  const configureDataForSeoProxy: NonNullable<ProxyOptions['configure']> = (proxy) => {
    proxy.on('proxyReq', (proxyReq) => {
      if (dfsLogin && dfsPassword) {
        const b64 = Buffer.from(`${dfsLogin}:${dfsPassword}`).toString('base64')
        proxyReq.setHeader('Authorization', `Basic ${b64}`)
      }
    })
  }

  const dataForSeoProxy = {
    '/dataforseo-api': {
      target: 'https://api.dataforseo.com',
      changeOrigin: true,
      rewrite: (p: string) => p.replace(/^\/dataforseo-api/, ''),
      configure: configureDataForSeoProxy,
    },
  }

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      proxy: {
        ...gscSearchConsoleProxy,
        ...dataForSeoProxy,
      },
    },
    preview: {
      proxy: {
        ...gscSearchConsoleProxy,
        ...dataForSeoProxy,
      },
    },
  }
})
