import { QueryClientProvider } from '@tanstack/react-query';

import { AppBootstrap } from '@/AppBootstrap';
import { queryClient } from '@/lib/queryClient';
import { AuthProvider } from '@/auth/AuthProvider';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { useAppearance } from './hooks/useAppearance';
import { useEffect } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'sonner';
import { AlertTriangle, XCircle, CheckCircle, Info } from 'lucide-react';
import { EchoGate } from './components/EchoGate';
import ConnectionBanner from './components/network/ConnectionBanner';
import PwaInstallPrompt from './components/network/PwaInstallPrompt';
// import { useSiteSettings } from './hooks/useSiteSettings';
import { NotificationInboxProvider } from './contexts/NotificationInboxContext';

export default function App() {
  const { theme, toggleTheme } = useAppearance();


  // const { siteSettings } = useSiteSettings();

  // Force the theme to light mode on initial load
  useEffect(() => {
    if (theme !== 'light') {
      toggleTheme('light');
    }
  }, [theme, toggleTheme]);

  useEffect(() => {
    const onRefresh = () => {
      if (!navigator.onLine) return;
      void queryClient.invalidateQueries({ queryKey: ['driver-stats-home'] });
      void queryClient.invalidateQueries({ queryKey: ['featured-drivers-home'] });
      void queryClient.invalidateQueries({ queryKey: ['tow-drivers'] });
    };
    window.addEventListener('towtrack:refresh-data', onRefresh as EventListener);
    return () => window.removeEventListener('towtrack:refresh-data', onRefresh as EventListener);
  }, []);

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <EchoGate>
            <NotificationInboxProvider>
            <ErrorBoundary>
              <ConnectionBanner />
              <PwaInstallPrompt />
              <AppBootstrap />
              <Toaster
                position="top-right"
                richColors
                closeButton
                expand={true}
                duration={3000}
                icons={{
                  success: <CheckCircle className="h-4 w-4" />,
                  error: <XCircle className="h-4 w-4" />,
                  warning: <AlertTriangle className="h-4 w-4" />,
                  info: <Info className="h-4 w-4" />,
                }}
              />
            </ErrorBoundary>
            </NotificationInboxProvider>
          </EchoGate>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}
