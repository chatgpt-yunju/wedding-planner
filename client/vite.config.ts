import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico'],
      manifest: {
        name: '备婚助手',
        short_name: '备婚',
        description: '情侣备婚管理 PWA',
        theme_color: '#ec4899',
        background_color: '#fce7f3',
        display: 'standalone',
        // 图标可后续补充，默认使用内置图标
      },
    }),
  ],
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || 'http://localhost:3000/api'),
  },
})
