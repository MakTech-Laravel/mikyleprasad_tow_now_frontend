import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { motion } from 'motion/react';

import Section from '@/components/section';
import { UserSidebar } from '@/components/partials/UserSidebar';
import { useAuth } from '@/auth/useAuth';
import { useInitials } from '@/hooks/useInitials';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function UserLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const getInitials = useInitials();

  return (
    <Section applyContainer containerClassName="flex gap-5 relative max-w-5xl min-h-[55vh]">
      {/* Sidebar: desktop sticky panel + mobile drawer overlay */}
      <UserSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Content column */}
      <div className="min-w-0 flex-1">
        {/* Mobile-only trigger bar — sits at the top of the content column */}
        <div className="mb-4 flex items-center justify-between rounded-xl border border-border bg-input px-3 py-2 md:hidden">
          <div className="flex items-center gap-2.5">
            <Avatar className="size-8">
              <AvatarImage src={user?.avatar_url ?? ''} className="object-cover" alt={user?.name} />
              <AvatarFallback className="bg-primary font-montserrat text-xs font-semibold text-white">
                {getInitials(user?.name ?? 'TN')}
              </AvatarFallback>
            </Avatar>
            <span className="max-w-[160px] truncate text-sm font-semibold text-secondary">
              {user?.name ?? 'My Account'}
            </span>
          </div>

          <motion.button
            type="button"
            onClick={() => setSidebarOpen(true)}
            whileTap={{ scale: 0.9 }}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-primary/20 hover:text-foreground"
            aria-label="Open account menu"
          >
            <Menu className="h-4 w-4" />
          </motion.button>
        </div>

        <Outlet />
      </div>
    </Section>
  );
}
