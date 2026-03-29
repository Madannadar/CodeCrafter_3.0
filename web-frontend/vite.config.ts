import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: [
      'web-frontend.80.225.195.137.sslip.io',
      'web-backend.80.225.195.137.sslip.io'
    ],
    host: '0.0.0.0', // Ensure it listens on all interfaces for the proxy
    port: 7004       // Your requested port
  }
})