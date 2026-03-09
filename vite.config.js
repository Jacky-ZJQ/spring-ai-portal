import fs from 'node:fs'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const pdfWorkerSource = new URL('./node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs', import.meta.url)

const pdfWorkerAssetPlugin = () => ({
  name: 'pdfjs-worker-asset',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const requestPath = req.url?.split('?')[0]
      if (requestPath !== '/pdf.worker.min.js') {
        next()
        return
      }

      res.setHeader('Content-Type', 'text/javascript; charset=utf-8')
      fs.createReadStream(pdfWorkerSource).pipe(res)
    })
  },
  generateBundle() {
    this.emitFile({
      type: 'asset',
      fileName: 'pdf.worker.min.js',
      source: fs.readFileSync(pdfWorkerSource, 'utf8')
    })
  }
})

export default defineConfig({
  plugins: [vue(), pdfWorkerAssetPlugin()],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    },
    proxy: {
      // /api -> 后端根路径（开发时与 nginx /api 转发行为保持一致）
      '/api': {
        target: process.env.VITE_DEV_API_TARGET || 'http://127.0.0.1:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      // 保留 /ai 直转发，兼容历史接口直连调用。
      '/ai': {
        target: process.env.VITE_DEV_API_TARGET || 'http://127.0.0.1:8080',
        changeOrigin: true
      }
    }
  },
  optimizeDeps: {
    exclude: ['@pdftron/webviewer']
  }
})
