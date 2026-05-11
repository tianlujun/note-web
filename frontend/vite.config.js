import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  root: __dirname,
  base: '/static/',
  build: {
    outDir: resolve(__dirname, '../backend/app/static'),
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/link-index.json': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
