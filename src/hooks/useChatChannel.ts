// src/hooks/useChatChannel.ts
import { useCallback } from 'react';
import { usePrivateChannel } from './usePrivateChannel';

export interface IncomingMessage {
  id: string;
  conversation_id: string;
  sender_id: number;
  body: string | null;
  read_at: string | null;
  created_at: string;
  sender: {
    id: number;
    first_name: string;
    last_name: string;
  } | null;
  attachments: Array<{
    id: string;
    original_name: string;
    mime_type: string;
    size_bytes: number;
    disk: string;
    path: string;
    url: string;
  }>;
}

interface UseChatChannelOptions {
  conversationId: string | null;
  onMessage: (message: IncomingMessage) => void;
}

export function useChatChannel({ conversationId, onMessage }: UseChatChannelOptions) {
  const channelName = conversationId ? `chat.room.${conversationId}` : null;

  const handleMessage = useCallback(
    (data: unknown) => {
      onMessage(data as IncomingMessage);
    },
    [onMessage],
  );

  usePrivateChannel(channelName, {
    'message.sent': handleMessage,
  });
}
