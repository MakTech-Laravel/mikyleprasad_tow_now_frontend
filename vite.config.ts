/// <reference types="vitest" />
/// <reference types="vite-plugin-pwa/client" />
import { defineConfig } from 'vitest/config';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

(() => {
  const mode = process.env.NODE_ENV === 'production' ? 'production' : 'development';
  const fromFile = loadEnv(mode, projectRoot, 'VITE_').VITE_FIREBASE_API_KEY ?? '';
  const fromOs = process.env.VITE_FIREBASE_API_KEY;
  if (fromOs !== undefined && String(fromOs).trim() === '' && String(fromFile).trim() !== '') {
    console.warn(
      '\n[vite] VITE_FIREBASE_API_KEY is set in your OS environment to an empty string, which overrides the value in .env.\n' +
        '  Fix (PowerShell, then restart this terminal): [Environment]::SetEnvironmentVariable("VITE_FIREBASE_API_KEY",$null,"User")\n' +
        '  Also check System Properties → Environment Variables for an empty VITE_FIREBASE_API_KEY.\n',
    );
  }
})();

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
    VitePWA({
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
      // Dev SW + autoUpdate causes infinite reload glitches when refreshing protected routes.
      devOptions: {
        enabled: false,
      },
      workbox: {
        // Load Firebase Messaging handlers into the same SW as Workbox (FCM + PWA precache).
        importScripts: ['firebase-messaging-sw.js'],
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
    }),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        // target: 'https://api.townow.maktechlaravel.cloud',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(projectRoot, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 550,
    /** Rolldown-only: silence slow-plugin diagnostics when Babel (React Compiler) is expected to dominate transform time. */
    rolldownOptions: {
      checks: {
        pluginTimings: false,
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('react-dom')) return 'vendor-react-dom';
          if (id.includes('/react/') || id.includes('\\react\\')) return 'vendor-react';
          if (id.includes('react-router')) return 'vendor-react-router';
          if (id.includes('@tanstack/react-query')) return 'vendor-tanstack-query';
          if (id.includes('axios')) return 'vendor-axios';
          if (id.includes('motion')) return 'vendor-motion';
          if (id.includes('lucide-react')) return 'vendor-lucide';
          if (id.includes('embla-carousel')) return 'vendor-embla';
          if (id.includes('react-hook-form') || id.includes('@hookform')) return 'vendor-forms';
          if (id.includes('@radix-ui')) return 'vendor-radix';
          if (id.includes('react-helmet-async')) return 'vendor-helmet';
          return 'vendor';
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
