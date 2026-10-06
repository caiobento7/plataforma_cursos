import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Em desenvolvimento, /api é encaminhado para o Express local. Assim o
    // frontend usa os mesmos caminhos relativos que em produção na Vercel.
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
