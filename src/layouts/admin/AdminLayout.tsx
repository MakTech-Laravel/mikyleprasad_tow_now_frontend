import { Outlet } from 'react-router-dom';

import { useNav } from '@/hooks/useNav';
import { AdminHeader } from '@/components/partials/AdminHeader';
import { AdminSidebar } from '@/components/partials/AdminSidebar';

export function AdminLayout() {
  const nav = useNav();

  return (
    <div className="dashboard-app-shell fixed inset-0 z-0 flex flex-col overflow-hidden bg-background">
      <header className="z-50 w-full shrink-0">
        <AdminHeader onToggleSidebar={nav.toggle} />
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <AdminSidebar open={nav.open} onClose={nav.close} />

        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-4 md:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
