import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon.svg'],
      manifest: {
        name: 'Artificial World — Constructor de Mundos',
        short_name: 'Artificial World',
        description: 'Ecosistema operativo único. Entrada → Hub → sistemas conectados. Simulación 2D, refugios, héroes y memoria.',
        theme_color: '#0a0b0d',
        background_color: '#0a0b0d',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        orientation: 'any',
        categories: ['games', 'simulation'],
        icons: [
          {
            src: '/icons/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [],
      },
    }),
  ],
  base: '/',
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      '/api': {
        target: `http://localhost:${process.env.VITE_BACKEND_PORT ?? '3001'}`,
        changeOrigin: true,
      },
      '/docs': {
        target: `http://localhost:${process.env.VITE_BACKEND_PORT ?? '3001'}`,
        changeOrigin: true,
      },
    },
  },
});
