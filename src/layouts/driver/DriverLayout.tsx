import { Outlet } from 'react-router-dom';

import { DriverHeader } from '@/components/partials/DriverHeader';
import { DriverSidebar } from '@/components/partials/DriverSidebar';
import { useNav } from '@/hooks/useNav';

export function DriverLayout() {
  const nav = useNav();

  return (
    <div className="dashboard-app-shell fixed inset-0 z-0 flex flex-col overflow-hidden bg-background">
      <header className="z-50 w-full shrink-0">
        <DriverHeader onToggleSidebar={nav.toggle} />
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <DriverSidebar open={nav.open} onClose={nav.close} />

        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-4 md:p-6 lg:p-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
