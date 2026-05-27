import { Mail, MapPin, Phone, type LucideIcon } from 'lucide-react';

import type { SiteSettings } from '@/hooks/useSiteSettings';

export type SiteContactItem = {
  id: 'email' | 'phone' | 'address';
  icon: LucideIcon;
  title: string;
  label: string;
  href: string | null;
};

export function buildSiteContactItems(siteSettings?: SiteSettings): SiteContactItem[] {
  if (!siteSettings) {
    return [];
  }

  const items: SiteContactItem[] = [];

  const email = siteSettings.site_email?.trim();
  if (email) {
    items.push({
      id: 'email',
      icon: Mail,
      title: 'Email',
      label: email,
      href: `mailto:${email}`,
    });
  }

  const phone = siteSettings.site_phone?.trim();
  if (phone) {
    items.push({
      id: 'phone',
      icon: Phone,
      title: 'Phone',
      label: phone,
      href: `tel:${phone}`,
    });
  }

  const address = siteSettings.site_address?.trim();
  if (address) {
    items.push({
      id: 'address',
      icon: MapPin,
      title: 'Service area',
      label: address,
      href: null,
    });
  }

  return items;
}
