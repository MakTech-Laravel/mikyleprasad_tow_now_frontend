import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import 'leaflet/dist/leaflet.css';
import './index.css';

import App from './App';
import { setupNetworkSyncListener } from '@/services/sync.service';

// PWA-DISABLED: clear stale service workers from prior deploys (see docs/FIREBASE_DISABLE_AND_RESTORE.md).
if ('serviceWorker' in navigator) {
  void navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      void registration.unregister();
    }
  });
}

/* ===== PWA-DISABLED START (docs/FIREBASE_DISABLE_AND_RESTORE.md) =====
import { registerSW } from 'virtual:pwa-register';
import { toast } from 'sonner';

if (import.meta.env.PROD) {
  registerSW({
    onNeedRefresh() {
      toast('Update available', {
        action: {
          label: 'Reload',
          onClick: () => window.location.reload(),
        },
      });
    },
    onOfflineReady() {
      console.info('[pwa] offline ready');
    },
  });
}
===== PWA-DISABLED END ===== */

setupNetworkSyncListener();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
