import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Car,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
  Star,
  Users,
  X,
  Zap,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { isActivePath } from '@/lib/nav.utils';
import { useActiveUrl } from '@/hooks/useActiveUrl';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/auth/useAuth';
import type { LucideIcon } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

interface NavItem {
  icon: LucideIcon;
  to: string;
  label: string;
  end?: boolean;
}

interface AdminSidebarProps {
  open: boolean;
  onClose: () => void;
}

// ── Nav items ──────────────────────────────────────────────────────────────────

const items: NavItem[] = [
  { icon: LayoutDashboard, to: '/admin', label: 'Dashboard', end: true },
  { icon: Car, to: '/admin/drivers', label: 'Drivers' },
  { icon: Users, to: '/admin/customers', label: 'Customers' },
  { icon: Zap, to: '/admin/rides', label: 'Rides' },
  { icon: Star, to: '/admin/reviews', label: 'Reviews' },
  { icon: MessageSquare, to: '/admin/contact-queries', label: 'Leads' },
  { icon: Settings, to: '/admin/settings', label: 'Settings' },
];

// ── Shared nav list ────────────────────────────────────────────────────────────

function SidebarNav({ pathname, onItemClick }: { pathname: string; onItemClick?: () => void }) {
  return (
    <nav className="grid gap-0.5 p-2">
      {items.map((item) => {
        const active = isActivePath(pathname, item.to, Boolean(item.end));
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onItemClick}
            className={() =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </NavLink>
        );
      })}
    </nav>
  );
}

// ── Logout button — shared between desktop + mobile ────────────────────────────

function LogoutButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="border-t border-border p-2">
      <Button
        variant="ghost"
        size="sm"
        type="button"
        onClick={onClick}
        className="w-full cursor-pointer justify-start gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground hover:no-underline"
      >
        <LogOut className="h-4 w-4 shrink-0" />
        Log out
      </Button>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function AdminSidebar({ open, onClose }: AdminSidebarProps) {
  const { pathname } = useActiveUrl();
  const { logout } = useAuth();

  const handleLogout = () => void logout();

  return (
    <>
      {/* ── Desktop sidebar ────────────────────────────────────────────────── */}
      <aside className="hidden h-full w-56 shrink-0 flex-col overflow-y-auto border-r border-border bg-background/80 md:flex lg:w-64">
        <div className="flex flex-1 flex-col">
          <SidebarNav pathname={pathname} />
        </div>
        <LogoutButton onClick={handleLogout} />
      </aside>

      {/* ── Mobile backdrop ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
            onClick={onClose}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* ── Mobile slide-in panel ──────────────────────────────────────────── */}
      <motion.aside
        initial={false}
        animate={{ x: open ? '0%' : '-100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="fixed inset-y-0 left-0 z-50 flex w-[min(280px,85vw)] flex-col border-r border-border bg-background shadow-xl md:hidden"
        aria-label="Mobile navigation"
      >
        {/* Header */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
          <span className="font-montserrat text-sm font-bold">Admin Menu</span>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close sidebar">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Nav items */}
        <div className="flex-1 overflow-y-auto">
          <SidebarNav pathname={pathname} onItemClick={onClose} />
        </div>

        {/* Logout — pinned to bottom of mobile drawer */}
        <LogoutButton onClick={handleLogout} />
      </motion.aside>
    </>
  );
}
