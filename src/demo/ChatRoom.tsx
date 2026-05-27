import { useCallback } from 'react';
import { useChatChannel, type IncomingMessage } from '@/hooks/useChatChannel';

interface ChatRoomProps {
  conversationId: string;
}

export default function ChatRoom({ conversationId }: ChatRoomProps) {
  const handleMessage = useCallback((msg: IncomingMessage) => {
    console.log('New message:', msg);
    // Push to your messages state or invalidate React Query cache
  }, []);

  useChatChannel({ conversationId, onMessage: handleMessage });

  return <div>{/* your chat UI */}</div>;
}