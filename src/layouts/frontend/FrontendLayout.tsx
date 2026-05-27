import { Outlet } from 'react-router-dom';

import { FrontendFooter } from '@/components/partials/FrontendFooter';
import { FrontendHeader } from '@/components/partials/FrontendHeader';

export function FrontendLayout() {
  return (
    <div className="min-h-dvh bg-background">
      <FrontendHeader />
      <main>
        <Outlet />
      </main>
      <FrontendFooter />
    </div>
  );
}
