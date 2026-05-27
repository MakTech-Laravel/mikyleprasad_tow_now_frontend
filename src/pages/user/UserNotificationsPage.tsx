import Section from '@/components/section';
import { PageMeta } from '@/components/seo/PageMeta';
import { NotificationListView } from '@/features/notifications/NotificationListView';

export default function UserNotificationsPage() {
  return (
    <>
      <PageMeta
        title="Notifications"
        description="Your Tow Now notifications."
        keywords={['notifications', 'alerts']}
      />
      <Section className="min-h-[55vh]">
        <Section.Heading title="Notifications" align="left" />
        <NotificationListView listBasePath="/notifications" variant="plain" audience="user" />
      </Section>
    </>
  );
}
