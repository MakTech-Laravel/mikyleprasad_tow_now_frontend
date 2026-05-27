import { Link, NavLink } from 'react-router-dom';

import { useAuth } from '@/auth/useAuth';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import AppLogo from '@/components/app-logo';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { motion, useScroll, useMotionValueEvent } from 'motion/react';
import { DRIVER_ONBOARDING_PATH, isDriverAwaitingApproval } from '@/auth/completePassportLogin';
import { getUserRoles, notificationsBasePathForUser, roleDashboards } from '@/auth/roles';
import { NotificationBellButton } from '@/features/notifications/NotificationBellButton';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useInitials } from '@/hooks/useInitials';
import { toast } from 'sonner';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

const navigation = [
  { name: 'Home', to: '/' },
  { name: 'Find Drivers', to: '/find-drivers' },
  { name: 'How It Works', to: '/#how-it-works' },
  { name: 'Contact', to: '/contact-us' },
];

let isFirstLoad = true;

export function FrontendHeader() {
  const { isAuthenticated, user } = useAuth();
  const userRoles = getUserRoles(user);
  const getInitials = useInitials();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosInstall, setShowIosInstall] = useState(() => {
    const nav = navigator as Navigator & { standalone?: boolean };
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches || Boolean(nav.standalone);
    if (standalone) return false;
    const ua = navigator.userAgent;
    const isIos = /iPad|iPhone|iPod/i.test(ua);
    const isSafari = /Safari/i.test(ua) && !/Chrome|CriOS|Android/i.test(ua);
    return isIos && isSafari;
  });

  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);

  useMotionValueEvent(scrollY, 'change', (current) => {
    const previous = scrollY.getPrevious() ?? 0;
    if (current > previous && current > 150) {
      setHidden(true);
    } else {
      setHidden(false);
    }
  });

  const shouldAnimate = isFirstLoad;

  useEffect(() => {
    isFirstLoad = false;
  }, []);

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setDeferredPrompt(null);
      setShowIosInstall(false);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result.outcome !== 'accepted') {
        toast.info('Install dismissed');
      }
      return;
    }

    if (showIosInstall) {
      toast.info('iPhone Safari: tap Share, then "Add to Home Screen".');
      return;
    }

    toast.info('Install is not available yet on this browser/session.');
  };
  const canShowInstallAction = Boolean(deferredPrompt) || showIosInstall;

  const awaitingDriverApproval = isDriverAwaitingApproval(user);
  const dashboardLink = awaitingDriverApproval
    ? DRIVER_ONBOARDING_PATH
    : (userRoles.map((role) => roleDashboards[role as keyof typeof roleDashboards]).find(Boolean) ??
      '#');

  return (
    <motion.header
      initial={shouldAnimate ? { opacity: 0, y: -10 } : false}
      animate={{
        y: hidden ? -140 : 0,
        opacity: hidden ? 0 : 1,
      }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur"
    >
      <div className="container flex items-center justify-between">
        <Link to="/" className="font-semibold tracking-tight">
          <AppLogo />
        </Link>

        <nav className="hidden items-center gap-5 text-sm md:flex">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              className={({ isActive }) =>
                cn('text-muted-foreground hover:text-foreground', isActive && 'text-foreground')
              }
            >
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="md:hidden">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button type="button" variant="outline" size="icon" className="cursor-pointer">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>

            <SheetContent
              side="right"
              className="w-[85vw] border-l border-border backdrop-blur-3xl sm:w-[380px]"
              hideCloseButton={true}
            >
              <SheetHeader className="border-b pb-6">
                <SheetTitle className="flex items-center justify-between text-xl font-bold text-primary">
                  <Link to="/" className="inline-flex font-semibold tracking-tight">
                    <AppLogo />
                  </Link>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setMobileMenuOpen(false)}
                    className="inline-flex cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </SheetTitle>
              </SheetHeader>
              <SheetDescription></SheetDescription>

              {/* Staggered Items */}
              <div className="mt-5 flex flex-col gap-4">
                {navigation.map((item) => (
                  <div key={item.name}>
                    <NavLink
                      to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          'text-muted-foreground hover:text-foreground',
                          isActive && 'text-foreground',
                        )
                      }
                    >
                      {item.name}
                    </NavLink>
                  </div>
                ))}
                {isAuthenticated && !awaitingDriverApproval ? (
                  <div>
                    <NavLink
                      to={notificationsBasePathForUser(user)}
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Notifications
                    </NavLink>
                  </div>
                ) : null}
                {canShowInstallAction ? (
                  <div>
                    <button
                      type="button"
                      onClick={() => void handleInstallClick()}
                      className="cursor-pointer text-left text-muted-foreground hover:text-foreground"
                    >
                      Install App
                    </button>
                  </div>
                ) : null}
              </div>
              <SheetFooter className="mt-5 flex items-center justify-center">
                {isAuthenticated ? (
                  <Link to={dashboardLink} className="mx-auto inline-flex">
                    <Button type="button" className="cursor-pointer">
                      Dashboard
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/login" className="mx-auto inline-flex">
                      <Button type="button" className="cursor-pointer">
                        Sign in
                      </Button>
                    </Link>
                  </>
                )}
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
        <div className="hidden items-center gap-2 md:flex">
          {isAuthenticated ? (
            <>
              {!awaitingDriverApproval ? (
                <NotificationBellButton to={notificationsBasePathForUser(user)} />
              ) : null}
              <Link to={dashboardLink}>
                <Avatar className="size-10">
                  <AvatarImage src={user?.avatar_url ?? ''} />
                  <AvatarFallback className="rounded-lg bg-primary font-montserrat text-lg font-semibold text-white">
                    {getInitials(user?.name ?? 'TowTruckTT')}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </>
          ) : (
            <Button asChild type="button">
              <Link to="/login">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </motion.header>
  );
}
