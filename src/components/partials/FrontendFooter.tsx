import AppLogo from '@/components/app-logo';
import { Separator } from '@/components/ui/separator';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { buildSiteContactItems } from '@/lib/siteContact';
import { Link } from 'react-router-dom';

const footerLinks = {
  quickLinks: [
    { label: 'Home', to: '/' },
    { label: 'Find Drivers', to: '/find-drivers' },
    { label: 'How It Works', to: '/#how-it-works' },
    // { label: 'Contact', to: '/contact-us' },
  ],
  support: [
    { label: 'Terms of Service', to: '/terms' },
    { label: 'Privacy Policy', to: '/privacy' },
  ],
};



export function FrontendFooter() {
  const { siteSettings, isLoading } = useSiteSettings();
  const contactInfo = buildSiteContactItems(siteSettings);

  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container mx-auto py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          {/* Brand */}
          <div className="flex flex-col gap-4">
            <AppLogo />
            <p className="max-w-[220px] text-sm leading-relaxed text-secondary-foreground/70">
              Your trusted platform to find reliable tow truck drivers across Trinidad.
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-4">
            <h4 className="text-sm font-semibold tracking-wide">Quick Links</h4>
            <ul className="flex flex-col gap-3">
              {footerLinks.quickLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-secondary-foreground/70 transition-colors hover:text-secondary-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div className="flex flex-col gap-4">
            <h4 className="text-sm font-semibold tracking-wide">Support</h4>
            <ul className="flex flex-col gap-3">
              {footerLinks.support.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-secondary-foreground/70 transition-colors hover:text-secondary-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="flex flex-col gap-4">
            <h4 className="text-sm font-semibold tracking-wide">Contact</h4>
            <ul className="flex flex-col gap-3">
              {isLoading
                ? ['email', 'phone', 'address'].map((id) => (
                    <li key={id}>
                      <span className="block h-5 w-44 animate-pulse rounded bg-secondary-foreground/20" />
                    </li>
                  ))
                : contactInfo.map(({ id, icon: Icon, label, href }) => (
                    <li key={id}>
                      {href ? (
                        <a
                          href={href}
                          className="flex items-center gap-2 text-sm text-secondary-foreground/70 transition-colors hover:text-secondary-foreground"
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          {label}
                        </a>
                      ) : (
                        <span className="flex items-center gap-2 text-sm text-secondary-foreground/70">
                          <Icon className="h-4 w-4 shrink-0" />
                          {label}
                        </span>
                      )}
                    </li>
                  ))}
            </ul>
          </div>
        </div>

        <Separator className="my-8 bg-secondary-foreground/20" />

        <p className="text-center text-sm text-secondary-foreground/60">
          &copy; {new Date().getFullYear()} {import.meta.env.VITE_SITE_NAME}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
