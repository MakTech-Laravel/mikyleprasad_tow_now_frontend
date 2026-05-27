import { Outlet } from 'react-router-dom';

import { FrontendFooter } from '@/components/partials/FrontendFooter';
import { FrontendHeader } from '@/components/partials/FrontendHeader';

export function AuthLayout({
  showHeader = true,
  showFooter = true,
}: {
  showHeader?: boolean;
  showFooter?: boolean;
}) {
  return (
    <div className="min-h-dvh bg-background">
      {showHeader ? <FrontendHeader /> : null}
      <main className="flex min-h-[65vh] items-center justify-center">
        <Outlet />
      </main>
      {showFooter ? <FrontendFooter /> : null}
    </div>
  );
}
