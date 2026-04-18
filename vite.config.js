import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: [
      'gran-sabio.tail2474b3.ts.net',
      'server-sabio.tail2474b3.ts.net',
      'years-holly-vote-onto.trycloudflare.com',
      'advertise-another-organ-con.trycloudflare.com'
    ],
    watch: {
      usePolling: true,
    }
  }
})
