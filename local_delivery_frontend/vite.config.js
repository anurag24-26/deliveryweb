import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://deliverybackend-0i61.onrender.com',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
