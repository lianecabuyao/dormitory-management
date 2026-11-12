import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Forward /api/* to the Spring Boot backend so the app can use relative URLs.
    proxy: {
      '/api': 'http://localhost:8080',
      // Uploaded room photos are served by the backend too.
      '/uploads': 'http://localhost:8080',
    },
  },
})
