import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: 'localhost',
    // Explicitly configure HMR to avoid WebSocket 400 handshake errors
    hmr: {
      host: 'localhost',
      port: 5174,
      protocol: 'ws',
    },
  },
})
