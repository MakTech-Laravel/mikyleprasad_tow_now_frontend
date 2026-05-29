/**
 * PWA-DISABLED reference only — not imported by the build.
 * Copy into vite.config.ts plugins when re-enabling PWA (see docs/FIREBASE_DISABLE_AND_RESTORE.md).
 */
import { VitePWA } from 'vite-plugin-pwa';

export const vitePwaPlugin = VitePWA({
  registerType: 'autoUpdate',
  injectRegister: null,
  manifestFilename: 'manifest.json',
  includeAssets: [
    'favicon.svg',
    'icons/icon-192.png',
    'icons/icon-512.png',
    'icons/icon-72.png',
    'icons/icon-48.png',
    'icons/icon-144.png',
  ],
  devOptions: {
    enabled: false,
  },
  workbox: {
    // Re-enable Firebase first if using FCM: importScripts: ['firebase-messaging-sw.js'],
    globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
    runtimeCaching: [
      {
        urlPattern: /\/api\/v\d+\/(me|login|register|refresh)(\/|$)/i,
        handler: 'NetworkOnly',
      },
      {
        urlPattern: /\/api\//,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          networkTimeoutSeconds: 5,
          expiration: { maxAgeSeconds: 60 * 60 * 24 },
        },
      },
      {
        urlPattern: /^https:\/\/[a-z]*\.tile\.openstreetmap\.org\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'osm-tiles',
          expiration: { maxEntries: 1000, maxAgeSeconds: 60 * 60 * 24 * 30 },
        },
      },
      {
        urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'fonts',
          expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
        },
      },
    ],
  },
  manifest: {
    name: 'TowTrack',
    short_name: 'TowTrack',
    theme_color: '#F97316',
    background_color: '#0F172A',
    display: 'standalone',
    orientation: 'portrait',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/icons/icon-48.png',
        sizes: '48x48',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/icons/icon-72.png',
        sizes: '72x72',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/icons/icon-96.png',
        sizes: '96x96',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/icons/icon-144.png',
        sizes: '144x144',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
  },
});
