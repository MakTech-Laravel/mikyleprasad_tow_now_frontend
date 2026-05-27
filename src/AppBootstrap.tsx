import { Suspense } from 'react';
import { RouterProvider } from 'react-router-dom';

import Loading from '@/components/loading';
import { useFavicon } from '@/hooks/useFavicon';
import { router } from '@/routes/router';

function Fallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">
      <Loading />
    </div>
  );
}

export function AppBootstrap() {
  useFavicon({
    apiUrl: import.meta.env.VITE_FAVICON_API_URL as string | undefined,
    responsePath:
      (import.meta.env.VITE_FAVICON_RESPONSE_PATH as string | undefined) ?? 'data.favicon',
    ttlMs: Number(import.meta.env.VITE_FAVICON_CACHE_TTL_MS || 0) || undefined,
  });

  return (
    <Suspense fallback={<Fallback />}>
      <RouterProvider router={router} />
    </Suspense>
  );
}
