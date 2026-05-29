/// <reference types="vitest" />
// /// <reference types="vite-plugin-pwa/client" /> // PWA-DISABLED
import { defineConfig } from 'vitest/config';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
// import { loadEnv } from 'vite'; // FIREBASE-DISABLED (was used for Firebase env warning)
import tailwindcss from '@tailwindcss/vite';
// import { VitePWA } from 'vite-plugin-pwa'; // PWA-DISABLED

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

/* ===== FIREBASE-DISABLED START (docs/FIREBASE_DISABLE_AND_RESTORE.md) =====
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
===== FIREBASE-DISABLED END ===== */

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
    // PWA-DISABLED: VitePWA plugin omitted — restore from docs/FIREBASE_DISABLE_AND_RESTORE.md (section "VitePWA config").
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
