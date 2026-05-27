import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AppLogo from '@/components/app-logo';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { NotificationBellButton } from '@/features/notifications/NotificationBellButton';
import { useAuth } from '@/auth/useAuth';
import AppIcon from '../app-icon';

// ── Types ──────────────────────────────────────────────────
interface DriverHeaderProps {
  onToggleSidebar: () => void;
}

// ── Component ──────────────────────────────────────────────
export function DriverHeader({ onToggleSidebar }: DriverHeaderProps) {
  const { user } = useAuth();

  return (
    <header className="w-full border-b border-border bg-background/80 backdrop-blur-md supports-backdrop-filter:bg-background/80">
      <div className="flex h-14 items-center gap-3 px-4 lg:px-6">
        {/* ── Sidebar toggle (visible on mobile only) ── */}
        <Button
          variant="outline"
          size="icon"
          className="shrink-0 md:hidden"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <span className="hidden md:block">
          <AppLogo />
        </span>
        <span className="md:hidden">
          <AppIcon />
        </span>

        {/* ── Right slot: notifications, user info, etc. ── */}
        <div className="ml-auto flex items-center gap-2">
          <NotificationBellButton to="/driver-app/notifications" />
          <Separator orientation="vertical" className="h-5" />
          <div className="flex items-center gap-2">
            <div className="flex flex-col text-left">
              <span className="truncate text-sm font-medium">{user?.name}</span>
              <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
            </div>
            <Avatar>
              <AvatarImage src={user?.avatar_url || ''} />
              <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </header>
  );
}
