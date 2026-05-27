import Section from '@/components/section';
import { PageMeta } from '@/components/seo/PageMeta';
import { NotificationListView } from '@/features/notifications/NotificationListView';

export default function DriverNotificationsPage() {
  return (
    <>
      <PageMeta title="Notifications" description="Driver alerts." keywords={['driver', 'notifications']} />
      <Section className="min-h-screen">
        <Section.Heading title="Notifications" align="left" />
        <NotificationListView
          listBasePath="/driver-app/notifications"
          variant="plain"
          audience="driver"
        />
      </Section>
    </>
  );
}
