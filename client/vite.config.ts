import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from "path";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // dnd-kit проверяем первым: путь @dnd-kit/react/… иначе попадает под 'react/' и тянет dnd в общий чанк
          if (id.includes('@dnd-kit')) return 'dnd'
          if (id.includes('react-dom') || id.includes('node_modules/react/')) return 'react-vendor'
          if (id.includes('react-query')) return 'query'
          if (id.includes('gsap')) return 'gsap'
        },
      }
    }
  },
  server: {
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000/api',
        changeOrigin: true,
      },
    },
    port: 5173,
    watch: {
      usePolling: true,
      interval: 100,
    },
  },
  preview: {
    host: true,
    port: 5173,
    allowedHosts: ['plancktask.site', 'www.plancktask.site'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
})
