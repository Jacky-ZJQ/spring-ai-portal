import fs from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import type { PluginContext } from 'rollup'

import { defineConfig, type Plugin, type ViteDevServer } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

const pdfWorkerSource = fileURLToPath(new URL('./node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs', import.meta.url))

const pdfWorkerAssetPlugin = (): Plugin => ({
  name: 'pdfjs-worker-asset',
  configureServer(server: ViteDevServer) {
    server.middlewares.use((req: any, res: any, next: () => void) => {
      const requestPath = req.url?.split('?')[0]
      if (requestPath !== '/pdf.worker.min.js') {
        next()
        return
      }

      res.setHeader('Content-Type', 'text/javascript; charset=utf-8')
      fs.createReadStream(pdfWorkerSource).pipe(res)
    })
  },
  generateBundle(this: PluginContext) {
    this.emitFile({
      type: 'asset',
      fileName: 'pdf.worker.min.js',
      source: fs.readFileSync(pdfWorkerSource, 'utf8'),
    })
  },
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    pdfWorkerAssetPlugin(),
  ],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
    proxy: {
      // 本地开发统一走 /api 前缀，再由 Vite 代理转发到后端服务。
      '/api': {
        target: process.env.VITE_DEV_API_TARGET || 'http://127.0.0.1:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
