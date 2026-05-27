import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { useNotificationInbox } from '@/contexts/NotificationInboxContext';
import { cn } from '@/lib/utils';

type NotificationBellButtonProps = {
  to: string;
  className?: string;
  buttonClassName?: string;
};

export function NotificationBellButton({ to, className, buttonClassName }: NotificationBellButtonProps) {
  const { unreadCount } = useNotificationInbox();

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn('relative', buttonClassName, className)}
      asChild
      aria-label="Notifications"
    >
      <Link to={to}>
        <Bell className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground"
            aria-hidden
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </Link>
    </Button>
  );
}
