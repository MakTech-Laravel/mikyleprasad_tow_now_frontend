import { useParams } from 'react-router-dom';

import { PageMeta } from '@/components/seo/PageMeta';
import { NotificationDetailView } from '@/features/notifications/NotificationDetailView';

export default function AdminNotificationDetailPage() {
  const { id } = useParams<{ id: string }>();
  if (!id) return null;

  return (
    <>
      <PageMeta
        title="Admin — Notification"
        description="Notification details."
        keywords={['admin', 'notifications']}
      />
      <NotificationDetailView notificationId={id} listBasePath="/admin/notifications" />
    </>
  );
}
