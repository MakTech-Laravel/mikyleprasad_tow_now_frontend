import { Phone, Send } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

import { getChatInitials, type DisplayMessage } from '@/features/chat/useConversationChat';

type ChatHookReturn = ReturnType<
  typeof import('@/features/chat/useConversationChat').useConversationChat
>;

export type ConversationChatPanelProps = {
  chat: ChatHookReturn;
  peerFallbackLabel: string;
  phoneHref?: string | null;
  variant: 'user' | 'driver';
};

export function ConversationChatPanel({
  chat,
  peerFallbackLabel,
  phoneHref,
  variant,
}: ConversationChatPanelProps) {
  const {
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
  } = chat;

  const otherPersonMessage = messages.find((m) => m.side === 'left');
  const otherName = otherPersonMessage?.senderName ?? peerFallbackLabel;
  const otherInitials = getChatInitials(otherName);

  const isUser = variant === 'user';

  if (isUser) {
    return (
      <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/50 font-semibold">
                {isInitialLoading ? '…' : otherInitials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{isInitialLoading ? '—' : otherName}</p>
              <p className="text-xs text-muted">Active now</p>
            </div>
          </div>
          {phoneHref ? (
            <a href={phoneHref}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 cursor-pointer rounded-lg hover:bg-primary/20"
              >
                <Phone className="h-4 w-4" />
              </Button>
            </a>
          ) : null}
        </div>

        <div
          ref={scrollAreaRef}
          className="flex h-[420px] flex-col overflow-y-auto px-4 py-4"
        >
          <div ref={topSentinelRef} className="mb-2 flex justify-center">
            {isLoadingMore ? (
              <span className="text-[11px] text-muted">Loading older messages…</span>
            ) : hasMore ? (
              <span className="text-[11px] text-muted">Scroll up to load older messages</span>
            ) : (
              <span className="text-[11px] text-muted">
                {isInitialLoading ? 'Loading…' : 'Beginning of conversation'}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} variant="user" />
            ))}
          </div>
        </div>

        <div className="border-t border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Textarea
              ref={composerRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message…"
              rows={1}
              disabled={isSending}
              className="min-h-12 pt-3 resize-none rounded-xl border-border bg-input text-sm placeholder:text-muted-foreground focus-visible:ring-primary disabled:opacity-60"
            />
            <Button
              type="button"
              onClick={() => void handleSend()}
              disabled={isSending || !input.trim()}
              className="h-10 cursor-pointer gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold shadow-none hover:bg-primary/90 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {isSending ? 'Sending…' : 'Send'}
            </Button>
          </div>
        </div>
      </div>

        <div className="rounded-xl border border-border bg-input px-4 py-3 text-sm text-muted-foreground/80">
          <span className="font-semibold text-card-foreground">Privacy Notice: </span>
          All messages are encrypted and stored securely. TowTruckTT acts as a directory platform
          connecting you with independent drivers. Please keep all communication professional
          and related to your service request.
        </div>
      </div>
    );
  }

  /* driver variant — matches driver bookings chat styling */
  return (
    <div className="overflow-hidden rounded-xl border border-[#e8e2d8] bg-white shadow-none">
      <div className="flex items-center justify-between border-b border-[#ede8de] px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 bg-[#c8b89a]">
            <AvatarFallback className="bg-[#c8b89a] text-[13px] font-semibold text-[#6b5c45]">
              {isInitialLoading ? '…' : otherInitials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-[15px] font-semibold text-[#2c2c2c]">
              {isInitialLoading ? '—' : otherName}
            </p>
            <p className="text-xs text-muted-foreground">Active now</p>
          </div>
        </div>
        {phoneHref ? (
          <a href={phoneHref}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-[#2c2c2c] hover:bg-[#f0ebe0]"
            >
              <Phone className="h-4 w-4" />
            </Button>
          </a>
        ) : null}
      </div>

      <div
        ref={scrollAreaRef}
        className="flex h-[420px] flex-col overflow-y-auto px-4 py-4"
      >
        <div ref={topSentinelRef} className="mb-2 flex justify-center">
          {isLoadingMore ? (
            <span className="text-[11px] text-[#999]">Loading older messages…</span>
          ) : hasMore ? (
            <span className="text-[11px] text-[#999]">Scroll up to load older messages</span>
          ) : (
            <span className="text-[11px] text-[#999]">
              {isInitialLoading ? 'Loading…' : 'Beginning of conversation'}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-3.5">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} variant="driver" />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2.5 border-t border-[#ede8de] bg-white px-3.5 py-2.5">
        <Textarea
          ref={composerRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message…"
          rows={1}
          disabled={isSending}
          className="min-h-10 resize-none rounded-lg border-0 bg-[#f5f0e8] py-2.5 text-sm text-[#555] placeholder:text-[#bbb] focus-visible:ring-0 disabled:opacity-60"
        />
        <Button
          type="button"
          onClick={() => void handleSend()}
          disabled={isSending || !input.trim()}
          className="h-10 shrink-0 gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-[#3a2a00] hover:bg-primary/90 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          {isSending ? '…' : 'Send'}
        </Button>
      </div>

      <div className="bg-[#f5f0e8] px-4 py-3">
        <p className="text-[11px] leading-relaxed text-[#999]">
          <span className="font-semibold text-muted-foreground">Privacy Notice:</span> All messages
          are encrypted and stored securely. TowTruckTT acts as a directory platform connecting you with
          independent drivers. Please keep all communication professional and related to your
          service request.
        </p>
      </div>
    </div>
  );
}

function MessageBubble({
  msg,
  variant,
}: {
  msg: DisplayMessage;
  variant: 'user' | 'driver';
}) {
  if (variant === 'user') {
    if (msg.side === 'left') {
      return (
        <div className="flex justify-start gap-2">
          <Avatar className="mt-1 h-7 w-7 shrink-0">
            <AvatarFallback className="bg-primary/30 text-[10px] font-semibold">
              {getChatInitials(msg.senderName)}
            </AvatarFallback>
          </Avatar>
          <div className="max-w-[72%]">
            <p className="mb-1 text-[10px] text-muted-foreground">{msg.senderName}</p>
            <div className="rounded-2xl rounded-tl-sm bg-input px-4 py-2.5 text-sm">
              <p className="wrap-break-word whitespace-pre-wrap">{msg.text}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">{msg.time}</p>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="flex justify-end">
        <div
          className={cn(
            'max-w-[72%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm transition-opacity duration-300',
            msg.id < 0 ? 'opacity-50' : 'opacity-100',
          )}
        >
          <p className="wrap-break-word whitespace-pre-wrap">{msg.text}</p>
          <p className="mt-1 text-[10px] text-muted-foreground">{msg.time}</p>
        </div>
      </div>
    );
  }

  /* driver bubbles */
  if (msg.side === 'right') {
    return (
      <div className="flex justify-end">
        <div
          className={cn(
            'max-w-[75%] rounded-xl rounded-br-sm bg-primary px-3.5 py-3 text-sm text-[#3a2a00] transition-opacity duration-300',
            msg.id < 0 ? 'opacity-50' : 'opacity-100',
          )}
        >
          <p className="leading-snug whitespace-pre-wrap">{msg.text}</p>
          <p className="mt-1 text-right text-[10px] text-[#3a2a00]/60">{msg.time}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[75%] rounded-xl rounded-bl-sm bg-[#f0ebe0] px-3.5 py-3 text-sm text-[#2c2c2c]">
        <p className="mb-0.5 text-[10px] font-medium text-[#6b5c45]">{msg.senderName}</p>
        <p className="leading-snug whitespace-pre-wrap">{msg.text}</p>
        <p className="mt-1 text-[10px] text-[#999]">{msg.time}</p>
      </div>
    </div>
  );
}
