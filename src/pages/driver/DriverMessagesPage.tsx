import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { PageMeta } from '@/components/seo/PageMeta';
import { Button } from '@/components/ui/button';
import Section from '@/components/section';
import { useAuth } from '@/auth/useAuth';
import { ConversationChatPanel } from '@/features/chat/ConversationChatPanel';
import { useConversationChat } from '@/features/chat/useConversationChat';

export default function DriverMessagesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { conversationId: paramId } = useParams<{ conversationId: string }>();
  const conversationId = paramId?.trim() ?? '';

  const myUserId = user?.id ?? -1;
  const myDisplayName = user?.name ?? 'You';

  const chat = useConversationChat({
    conversationId,
    myUserId,
    myDisplayName,
  });

  if (!conversationId) {
    return (
      <>
        <PageMeta
          title="Messages"
          description="Chat with your customer in real-time."
          keywords={['driver', 'messages', 'chat']}
        />
        <Section className="mx-auto min-h-screen w-full space-y-4 p-5 font-sans md:w-3/4">
          <Button
            onClick={() => navigate(-1)}
            variant="link"
            className="h-auto cursor-pointer px-0 text-left hover:no-underline"
          >
            <ArrowLeft className="size-4" />
            Back
          </Button>
          <Section.Heading title="Messages" align="left" />
          <p className="text-sm text-muted-foreground">
            Choose a conversation from a ride to start chatting with your customer.
          </p>
          <Button asChild variant="default" className="w-fit">
            <Link to="/driver-app/bookings">Go to bookings</Link>
          </Button>
        </Section>
      </>
    );
  }

  return (
    <>
      <PageMeta
        title="Messages"
        description="Chat with your customer in real-time."
        keywords={['driver', 'messages', 'chat']}
      />
      <Section className="mx-auto min-h-screen w-full space-y-1 p-5 font-sans md:w-3/4">
        <Button
          onClick={() => navigate(-1)}
          variant="link"
          className="h-auto cursor-pointer px-0 text-left hover:no-underline"
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>

        <Section.Heading
          title="Messages"
          subtitle="Chat with your customer in real-time"
          align="left"
        />

        <ConversationChatPanel
          chat={chat}
          peerFallbackLabel="Customer"
          phoneHref={null}
          variant="driver"
        />
      </Section>
    </>
  );
}
