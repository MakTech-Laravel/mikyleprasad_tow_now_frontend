import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { toast } from 'sonner';

import 'leaflet/dist/leaflet.css';
import './index.css';

import App from './App';
import { setupNetworkSyncListener } from '@/services/sync.service';

// Dev service worker + autoUpdate caused infinite reload glitches on Ctrl+R; clear stale SW.
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  void navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      void registration.unregister();
    }
  });
}

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

setupNetworkSyncListener();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
