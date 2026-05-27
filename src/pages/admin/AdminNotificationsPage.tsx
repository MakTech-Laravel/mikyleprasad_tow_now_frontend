import { PageMeta } from '@/components/seo/PageMeta';
import { NotificationListView } from '@/features/notifications/NotificationListView';

export default function AdminNotificationsPage() {
  return (
    <>
      <PageMeta
        title="Admin — Notifications"
        description="Real-time system notifications."
        keywords={['admin', 'notifications']}
      />

      <div className="space-y-6">
        <div>
          <h1 className="font-montserrat text-2xl font-bold tracking-tight">System Notifications</h1>
          <p className="text-sm text-muted-foreground">Real-time notifications for your account</p>
        </div>

        <NotificationListView listBasePath="/admin/notifications" variant="card" audience="admin" />
      </div>
    </>
  );
}
