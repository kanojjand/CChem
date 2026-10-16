import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// PREVIEW=1 builds without the service worker, for hosts where service workers are not allowed.
const preview = process.env.PREVIEW === '1';

export default defineConfig({
  base: './',
  build: preview ? { outDir: 'dist-preview' } : undefined,
  plugins: [
    react(),
    !preview && VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'CC Hexa',
        short_name: 'CC Hexa',
        description: 'Химиялық зертхана-құмсалғыш · Химлаборатория-песочница · Chemistry sandbox lab',
        lang: 'kk',
        theme_color: '#1450F5',
        background_color: '#E9EFF6',
        display: 'standalone',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}']
      }
    })
  ],
  test: {
    include: ['src/**/*.test.ts']
  }
});
