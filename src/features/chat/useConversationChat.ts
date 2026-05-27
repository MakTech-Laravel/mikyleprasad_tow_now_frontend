import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';

import {
  fetchMessages,
  sendMessage,
  type ApiMessage,
} from '@/api/messages';
import { useChatChannel, type IncomingMessage } from '@/hooks/useChatChannel';

export function formatChatTime(isoOrDate: string): string {
  return new Date(isoOrDate).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getChatInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');
}

export type DisplayMessage = {
  id: number;
  side: 'left' | 'right';
  text: string;
  time: string;
  senderId: number;
  senderName: string;
};

export function toDisplayMessage(
  msg: ApiMessage | IncomingMessage,
  myUserId: number,
): DisplayMessage {
  const senderId = msg.sender_id;

  let senderName = 'Unknown';
  if (msg.sender) {
    if ('name' in msg.sender && msg.sender.name) {
      senderName = msg.sender.name as string;
    } else if ('first_name' in msg.sender) {
      senderName =
        `${(msg.sender as { first_name?: string; last_name?: string }).first_name ?? ''} ${(msg.sender as { first_name?: string; last_name?: string }).last_name ?? ''}`.trim();
    }
  }

  return {
    id: Number(msg.id),
    side: senderId === myUserId ? 'right' : 'left',
    text: msg.body ?? '',
    time: formatChatTime(msg.created_at),
    senderId,
    senderName,
  };
}

export type UseConversationChatOptions = {
  conversationId: string;
  myUserId: number;
  myDisplayName: string;
};

export function useConversationChat({
  conversationId,
  myUserId,
  myDisplayName,
}: UseConversationChatOptions) {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [nextBeforeId, setNextBeforeId] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [input, setInput] = useState('');
  const [isDesktopLikeInput, setIsDesktopLikeInput] = useState(true);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const shouldAutoScrollRef = useRef(false);

  useEffect(() => {
    if (!shouldAutoScrollRef.current) return;
    shouldAutoScrollRef.current = false;
    const el = scrollAreaRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!conversationId) {
      setIsInitialLoading(false);
      setMessages([]);
      setHasMore(false);
      setNextBeforeId(null);
      return;
    }

    let cancelled = false;
    setIsInitialLoading(true);

    fetchMessages(conversationId)
      .then((res) => {
        if (cancelled) return;
        const mapped = [...res.data]
          .reverse()
          .map((m) => toDisplayMessage(m, myUserId));

        shouldAutoScrollRef.current = true;
        setMessages(mapped);
        setHasMore(res.meta.has_more_older);
        setNextBeforeId(res.meta.next_before_id);
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setIsInitialLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [conversationId, myUserId]);

  useEffect(() => {
    const sentinel = topSentinelRef.current;
    const container = scrollAreaRef.current;
    if (!sentinel || !container || !conversationId) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (
          !entry.isIntersecting ||
          isLoadingRef.current ||
          !hasMore ||
          !nextBeforeId ||
          !conversationId
        )
          return;

        isLoadingRef.current = true;
        setIsLoadingMore(true);
        const prevScrollHeight = container.scrollHeight;

        fetchMessages(conversationId, nextBeforeId)
          .then((res) => {
            const older = [...res.data]
              .reverse()
              .map((m) => toDisplayMessage(m, myUserId));

            setMessages((prev) => [...older, ...prev]);
            setHasMore(res.meta.has_more_older);
            setNextBeforeId(res.meta.next_before_id);

            requestAnimationFrame(() => {
              container.scrollTop = container.scrollHeight - prevScrollHeight;
            });
          })
          .catch(console.error)
          .finally(() => {
            isLoadingRef.current = false;
            setIsLoadingMore(false);
          });
      },
      { root: container, threshold: 1.0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [conversationId, hasMore, nextBeforeId, myUserId]);

  const handleIncomingMessage = useCallback(
    (msg: IncomingMessage) => {
      const display = toDisplayMessage(msg as unknown as ApiMessage, myUserId);

      setMessages((prev) => {
        if (prev.some((m) => m.id === display.id)) return prev;
        shouldAutoScrollRef.current = true;
        return [...prev, display];
      });
    },
    [myUserId],
  );

  useChatChannel({
    conversationId: conversationId || null,
    onMessage: handleIncomingMessage,
  });

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isSending || !conversationId) return;

    const tempId: number = -Date.now();
    const optimistic: DisplayMessage = {
      id: tempId,
      side: 'right',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      senderId: myUserId,
      senderName: myDisplayName || 'You',
    };

    shouldAutoScrollRef.current = true;
    setMessages((prev) => [...prev, optimistic]);
    setInput('');
    setIsSending(true);

    try {
      const sent = await sendMessage(conversationId, { body: text });
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? toDisplayMessage(sent, myUserId) : m)),
      );
    } catch (err) {
      console.error('Failed to send message:', err);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setInput(text);
    } finally {
      setIsSending(false);
    }
  }, [input, isSending, conversationId, myUserId, myDisplayName]);

  useEffect(() => {
    if (typeof window?.matchMedia !== 'function') return;
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    const update = () => setIsDesktopLikeInput(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key !== 'Enter' || e.nativeEvent.isComposing) return;
      const wantsLineBreak =
        e.ctrlKey || e.metaKey || e.shiftKey || !isDesktopLikeInput;
      if (wantsLineBreak) {
        e.preventDefault();
        const el = e.currentTarget;
        const start = el.selectionStart ?? input.length;
        const end = el.selectionEnd ?? input.length;
        setInput(`${input.slice(0, start)}\n${input.slice(end)}`);
        requestAnimationFrame(() => {
          composerRef.current?.setSelectionRange(start + 1, start + 1);
        });
        return;
      }
      e.preventDefault();
      void handleSend();
    },
    [handleSend, input, isDesktopLikeInput],
  );

  return {
    messages,
    input,
    setInput,
    isInitialLoading,
    isLoadingMore,
    hasMore,
    isSending,
    scrollAreaRef,
    topSentinelRef,
    composerRef,
    handleKeyDown,
    handleSend,
  };
}
