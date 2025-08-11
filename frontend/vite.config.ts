import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    modules: {
      // Export both 'kebab-case' and 'camelCase' class names for TS consumption
      localsConvention: 'camelCase',
    },
  },
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, 'src') },
      { find: '@shared', replacement: path.resolve(__dirname, 'src/shared') },
      { find: '@features', replacement: path.resolve(__dirname, 'src/features') },
      { find: '@pages', replacement: path.resolve(__dirname, 'src/pages') }
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