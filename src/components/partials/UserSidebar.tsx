import { Bell, Clock3, LogOut, TrendingUp, User, X, type LucideIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { NavLink } from 'react-router-dom';

import { useAuth } from '@/auth/useAuth';
import { useInitials } from '@/hooks/useInitials';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';

interface NavItem {
  icon: LucideIcon;
  to: string;
  label: string;
  end?: boolean;
}

const navItems: NavItem[] = [
  { icon: TrendingUp, to: '/dashboard', label: 'Overview', end: true },
  { icon: Bell, to: '/notifications', label: 'Notifications' },
  { icon: User, to: '/profile', label: 'Profile Info' },
  { icon: Clock3, to: '/rides', label: 'Ride history' },
];

// ─── Shared nav content ───────────────────────────────────────────────────────

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { logout, user } = useAuth();
  const getInitials = useInitials();

  return (
    <>
      <div className="mt-4 flex flex-col items-center justify-center space-y-2">
        <Avatar className="size-16 ring-2 ring-primary/20 ring-offset-2">
          <AvatarImage
            src={user?.avatar_url ?? ''}
            className="object-cover"
            alt={user?.name ?? 'TowTruckTT'}
          />
          <AvatarFallback className="rounded-lg bg-primary font-montserrat text-lg font-semibold text-white">
            {getInitials(user?.name ?? 'TT')}
          </AvatarFallback>
        </Avatar>
        <p className="truncate font-montserrat text-base font-semibold text-secondary">
          {user?.name ?? 'TowTruckTT User'}
        </p>
        <p className="text-sm text-muted">{user?.email ?? ''}</p>
        {user?.phone && <p className="text-sm text-muted">{user.phone}</p>}
      </div>

      <nav className="mt-8 space-y-1.5">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary text-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-primary/20 hover:text-foreground',
              )
            }
          >
            <item.icon className="mr-2.5 h-4 w-4 shrink-0" />
            {item.label}
          </NavLink>
        ))}

        <Button
          variant="link"
          size="sm"
          type="button"
          onClick={() => {
            void logout();
            onClose?.();
          }}
          className="w-full cursor-pointer justify-start rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:no-underline"
        >
          <LogOut className="mr-2.5 h-4 w-4 shrink-0" />
          Log out
        </Button>
      </nav>
    </>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface UserSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function UserSidebar({ isOpen, onClose }: UserSidebarProps) {
  return (
    <>
      {/* Desktop: sticky sidebar — hidden below md */}
      <aside className="sticky top-14 left-0 hidden h-fit min-h-[55vh] w-52 shrink-0 space-y-2 rounded-xl border border-border bg-input p-3 md:block">
        <SidebarContent />
      </aside>

      {/* Mobile: slide-in drawer + backdrop — rendered as a portal-like fixed overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="sidebar-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
              onClick={onClose}
              aria-hidden="true"
            />

            {/* Drawer panel */}
            <motion.aside
              key="sidebar-drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 340, damping: 34, mass: 0.85 }}
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-background px-4 pb-8 pt-4 shadow-2xl md:hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="font-montserrat text-sm font-semibold text-foreground">
                  My Account
                </span>
                <motion.button
                  type="button"
                  onClick={onClose}
                  whileTap={{ scale: 0.88 }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-input text-muted-foreground transition-colors hover:bg-primary/20 hover:text-foreground"
                  aria-label="Close menu"
                >
                  <X className="h-4 w-4" />
                </motion.button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <SidebarContent onClose={onClose} />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}