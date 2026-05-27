import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import { PageMeta } from '@/components/seo/PageMeta';
import { Button } from '@/components/ui/button';
import Section from '@/components/section';
import { useAuth } from '@/auth/useAuth';
import { ConversationChatPanel } from '@/features/chat/ConversationChatPanel';
import { useConversationChat } from '@/features/chat/useConversationChat';

interface MessagesPageProps {
  /** Pass explicitly (e.g. demo route) or leave undefined to read from route params */
  conversationId?: string;
}

export default function MessagesPage({ conversationId: propId }: MessagesPageProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const params = useParams<{ conversationId?: string; converstationId?: string }>();
  const conversationId =
    propId ?? params.conversationId ?? params.converstationId ?? '';

  const myUserId = user?.id ?? -1;
  const myDisplayName = user?.name ?? 'You';

  const chat = useConversationChat({
    conversationId,
    myUserId,
    myDisplayName,
  });

  return (
    <>
      <PageMeta
        title="Messages"
        description="Chat with your tow driver in real-time."
        keywords={['messages', 'chat']}
      />

      <Section applyContainer containerClassName="space-y-4">
        <Button
          onClick={() => navigate(-1)}
          variant="link"
          className="cursor-pointer px-0 text-left hover:no-underline"
        >
          <ArrowLeft className="size-4" />
          Back to driver profile
        </Button>

        <Section.Heading
          title="Messages"
          subtitle="Communicate with your drivers in real-time"
          className="mb-0"
          align="left"
        />

        <ConversationChatPanel
          chat={chat}
          peerFallbackLabel="Driver"
          phoneHref="tel:+1234567890"
          variant="user"
        />
      </Section>
    </>
  );
}
