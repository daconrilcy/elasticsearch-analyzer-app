import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, 'src') },
      { find: '@shared', replacement: path.resolve(__dirname, '../shared-contract') }
    ]
  },
  // 👇 Ajoutez cette section pour rediriger les appels API vers le backend
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000', // L'adresse de votre backend FastAPI
        changeOrigin: true,
      },
    },
  },
})