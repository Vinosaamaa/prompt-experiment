import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/jack-3d-portfolio/',
  server: {
    host: true,
    port: 5173,
  },
})
