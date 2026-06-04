import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png'],
      manifest: {
        name: '내 플래너',
        short_name: '플래너',
        description: '일정·할일·메모 관리 앱',
        theme_color: '#6366f1',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
    }),
  ],
  server: {
    proxy: {
      '/auth': 'http://localhost:3001',
      '/calendar': 'http://localhost:3001',
      '/todos': 'http://localhost:3001',
      '/notes': 'http://localhost:3001',
      '/push': 'http://localhost:3001',
      '/chat': 'http://localhost:3001',
    },
  },
});
