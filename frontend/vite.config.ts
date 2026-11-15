import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Proxy /api hacia FastAPI para evitar problemas de CORS en desarrollo local.
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',   // escucha en todas las interfaces (red local + localhost)
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
