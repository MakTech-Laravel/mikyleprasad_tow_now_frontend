// src/api/messages.ts
import { request } from '@/api/request';

export interface ApiMessageSender {
  id: number;
  name: string;
  email: string;
}

export interface ApiMessageAttachment {
  id: number;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  disk: string;
  path: string;
  url: string;
}

export interface ApiMessage {
  id: number;
  conversation_id: number;
  sender_id: number;
  body: string | null;
  read_at: string | null;
  created_at: string;
  sender: ApiMessageSender | null;
  attachments: ApiMessageAttachment[];
}

export interface MessagesMeta {
  per_page: number;
  before_id: number | null;
  has_more_older: boolean;
  next_before_id: number | null;
}

export interface MessagesResponse {
  success: boolean;
  message: string;
  data: ApiMessage[];
  meta: MessagesMeta;
}

export interface SendMessagePayload {
  body?: string;
  attachments?: File[];
}

/**
 * GET /api/v1/conversations/{id}/messages
 * Cursor-based: pass before_id to load older messages
 */
export async function fetchMessages(
  conversationId: string | number,
  beforeId?: number | null,
): Promise<MessagesResponse> {
  const params: Record<string, unknown> = {};
  if (beforeId) params.before_id = beforeId;

  const res = await request.get<MessagesResponse>(`/conversations/${conversationId}/messages`, {
    params,
  });
  return res.data;
}

/**
 * POST /api/v1/conversations/{id}/messages
 * Supports body text + file attachments
 */
export async function sendMessage(
  conversationId: string | number,
  payload: SendMessagePayload,
): Promise<ApiMessage> {
  const form = new FormData();
  if (payload.body) form.append('body', payload.body);
  payload.attachments?.forEach((file, i) => {
    form.append(`attachments[${i}]`, file);
  });

  const res = await request.post<{ success: boolean; data: ApiMessage }>(
    `/conversations/${conversationId}/messages`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return res.data.data;
}
