import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true, // Expose describe, it, expect, etc.
    environment: 'jsdom', // Environnement DOM pour les tests React
    setupFiles: ['./src/test/setup.ts'], // Fichier de configuration des tests
    css: false, // Désactiver le support CSS pour les tests
  },
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, 'src') },
      { find: '@shared', replacement: path.resolve(__dirname, 'src/shared') },
      { find: '@features', replacement: path.resolve(__dirname, 'src/features') },
      { find: '@pages', replacement: path.resolve(__dirname, 'src/pages') }
    ]
  }
})

