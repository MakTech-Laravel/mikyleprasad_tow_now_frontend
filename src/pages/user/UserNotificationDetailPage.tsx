import { useParams } from 'react-router-dom';

import Section from '@/components/section';
import { PageMeta } from '@/components/seo/PageMeta';
import { NotificationDetailView } from '@/features/notifications/NotificationDetailView';

export default function UserNotificationDetailPage() {
  const { id } = useParams<{ id: string }>();
  if (!id) return null;

  return (
    <>
      <PageMeta
        title="Notification"
        description="Notification details."
        keywords={['notifications']}
      />
      <Section className="min-h-[55vh]">
        <NotificationDetailView notificationId={id} listBasePath="/notifications" />
      </Section>
    </>
  );
}
