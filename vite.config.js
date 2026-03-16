import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: ['gran-sabio.tail2474b3.ts.net'],
    watch: {
      usePolling: true,
    }
  }
})
