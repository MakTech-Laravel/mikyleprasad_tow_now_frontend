import { SidebarProvider } from '@/components/ui/sidebar';
import { useLocation } from 'react-router-dom';

interface AppShellProps {
  children: React.ReactNode;
  variant?: 'header' | 'sidebar';
}

export function AppShell({ children, variant = 'header' }: AppShellProps) {
  const location = useLocation();
  const isOpen = location.pathname.includes('/dashboard') ? true : false;

  if (variant === 'header') {
    return <div className="flex min-h-screen w-full flex-col">{children}</div>;
  }

  return <SidebarProvider defaultOpen={isOpen}>{children}</SidebarProvider>;
}
