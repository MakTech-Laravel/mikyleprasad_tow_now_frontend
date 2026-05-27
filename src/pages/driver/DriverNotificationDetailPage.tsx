import { useParams } from 'react-router-dom';

import Section from '@/components/section';
import { PageMeta } from '@/components/seo/PageMeta';
import { NotificationDetailView } from '@/features/notifications/NotificationDetailView';

export default function DriverNotificationDetailPage() {
  const { id } = useParams<{ id: string }>();
  if (!id) return null;

  return (
    <>
      <PageMeta title="Notification" description="Driver notification details." keywords={['driver']} />
      <Section className="min-h-screen">
        <Section.Heading title="Notification" align="left" />
        <NotificationDetailView notificationId={id} listBasePath="/driver-app/notifications" />
      </Section>
    </>
  );
}
