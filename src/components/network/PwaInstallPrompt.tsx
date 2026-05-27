import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

const DISMISS_KEY = 'towtrack:pwa-install-dismissed';
const DISMISS_TTL_MS = 24 * 60 * 60 * 1000;

function isDismissedActive(): boolean {
  const raw = localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  const ts = Number(raw);
  if (!Number.isFinite(ts)) return false;
  const active = Date.now() - ts < DISMISS_TTL_MS;
  if (!active) localStorage.removeItem(DISMISS_KEY);
  return active;
}

function isStandaloneMode(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia('(display-mode: standalone)').matches || Boolean(nav.standalone);
}

function isiOS(): boolean {
  return /iPad|iPhone|iPod/i.test(navigator.userAgent);
}

function isSafari(): boolean {
  const ua = navigator.userAgent;
  return /Safari/i.test(ua) && !/Chrome|CriOS|Android/i.test(ua);
}

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(() => isDismissedActive());
  const [showIosGuide, setShowIosGuide] = useState(
    () => !isStandaloneMode() && isiOS() && isSafari(),
  );

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setDeferredPrompt(null);
      setShowIosGuide(false);
      localStorage.removeItem(DISMISS_KEY);
      setDismissed(false);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const visible = useMemo(() => {
    if (dismissed || isStandaloneMode()) return false;
    return Boolean(deferredPrompt) || showIosGuide;
  }, [deferredPrompt, showIosGuide, dismissed]);

  if (!visible) return null;

  const dismiss = () => {
    setDismissed(true);
    setDeferredPrompt(null);
    setShowIosGuide(false);
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  };

  const installNow = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome !== 'accepted') {
      // Keep prompt hidden for this session if user dismissed.
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="fixed right-3 bottom-3 left-3 z-50 mx-auto max-w-md rounded-2xl border border-border bg-background/95 p-4 shadow-xl backdrop-blur">
      <p className="text-sm font-semibold text-foreground">Install TowTruckTT</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {deferredPrompt
          ? 'Add TowTruckTT to your home screen for faster launch and better offline support.'
          : 'On iPhone Safari: tap Share, then choose "Add to Home Screen" to install TowTruckTT.'}
      </p>
      <div className="mt-3 flex gap-2">
        {deferredPrompt ? (
          <Button size="sm" className="rounded-xl" onClick={() => void installNow()}>
            Install
          </Button>
        ) : null}
        <Button size="sm" variant="outline" className="rounded-xl" onClick={dismiss}>
          Not now
        </Button>
      </div>
    </div>
  );
}
