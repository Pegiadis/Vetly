import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { getStoredToken } from '@/contexts/AuthContext';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface ChatConversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface ChatConversationDetail extends ChatConversation {
  messages: ChatMessage[];
}

interface ChatConversationListResponse {
  items: ChatConversation[];
  total: number;
  page: number;
  page_size: number;
}

interface ChatSendMessageResponse {
  conversation_id: string;
  user_message: ChatMessage;
  assistant_message: ChatMessage;
}

export function useChatConversations(
  role: 'owner' | 'vet',
  page = 1,
  pageSize = 20,
) {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const prefix = role === 'owner' ? '/owner/chat' : '/vet/chat';

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<ChatConversationListResponse>(
        `${prefix}/conversations?page=${page}&page_size=${pageSize}`,
      );
      setConversations(data.items);
      setTotal(data.total);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch conversations');
    } finally {
      setLoading(false);
    }
  }, [prefix, page, pageSize]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return {
    conversations,
    total,
    totalPages: Math.ceil(total / pageSize),
    loading,
    error,
    refetch: fetchConversations,
  };
}

export function useChatMessages(role: 'owner' | 'vet', conversationId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const prefix = role === 'owner' ? '/owner/chat' : '/vet/chat';

  const fetchMessages = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      setTitle('');
      return;
    }
    try {
      setLoading(true);
      const data = await api.get<ChatConversationDetail>(
        `${prefix}/conversations/${conversationId}`,
      );
      setMessages(data.messages);
      setTitle(data.title);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  }, [prefix, conversationId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  return { messages, title, loading, error, setMessages, refetch: fetchMessages };
}

export async function sendChatMessage(
  role: 'owner' | 'vet',
  message: string,
  conversationId?: string | null,
): Promise<ChatSendMessageResponse> {
  const prefix = role === 'owner' ? '/owner/chat' : '/vet/chat';
  const body: { message: string; conversation_id?: string } = { message };
  if (conversationId) {
    body.conversation_id = conversationId;
  }
  return api.post<ChatSendMessageResponse>(`${prefix}/send`, body);
}

export async function deleteChatConversation(
  role: 'owner' | 'vet',
  conversationId: string,
): Promise<void> {
  const prefix = role === 'owner' ? '/owner/chat' : '/vet/chat';
  return api.delete<void>(`${prefix}/conversations/${conversationId}`);
}

// --- Streaming chat (Server-Sent Events) ---

export interface StreamStartPayload {
  conversation_id: string;
  user_message: ChatMessage;
}

export interface StreamDonePayload {
  assistant_message: ChatMessage;
}

export interface StreamHandlers {
  onStart: (payload: StreamStartPayload) => void;
  onChunk: (text: string) => void;
  onDone: (payload: StreamDonePayload) => void;
  onError: (code: string) => void;
}

/**
 * Send a message and consume the streaming SSE response from the backend.
 *
 * Returns void (not the full response) — all data is delivered via the
 * handlers callback. Supports cancellation via AbortSignal.
 */
export async function sendChatMessageStream(
  role: 'owner' | 'vet',
  message: string,
  conversationId: string | null | undefined,
  handlers: StreamHandlers,
  signal?: AbortSignal,
): Promise<void> {
  const prefix = role === 'owner' ? '/owner/chat' : '/vet/chat';
  const url = `${API_BASE_URL}${prefix}/send/stream`;

  const token = getStoredToken();
  const body: { message: string; conversation_id?: string } = { message };
  if (conversationId) {
    body.conversation_id = conversationId;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
      signal,
    });
  } catch (err) {
    // Includes AbortError — caller handles via signal if needed
    if ((err as Error).name === 'AbortError') return;
    handlers.onError('network_error');
    return;
  }

  if (!response.ok || !response.body) {
    handlers.onError(`http_${response.status}`);
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // SSE frames are separated by a blank line (\n\n)
      let sepIndex: number;
      while ((sepIndex = buffer.indexOf('\n\n')) !== -1) {
        const frame = buffer.slice(0, sepIndex);
        buffer = buffer.slice(sepIndex + 2);

        // Each frame has one or more "data: ..." lines; we only emit one
        // "data:" line per frame from the backend.
        const line = frame.split('\n').find((l) => l.startsWith('data:'));
        if (!line) continue;
        const json = line.slice(5).trim();
        if (!json) continue;

        try {
          const payload = JSON.parse(json) as {
            type: 'start' | 'chunk' | 'done' | 'error';
            [k: string]: unknown;
          };
          switch (payload.type) {
            case 'start':
              handlers.onStart({
                conversation_id: payload.conversation_id as string,
                user_message: payload.user_message as ChatMessage,
              });
              break;
            case 'chunk':
              handlers.onChunk(payload.text as string);
              break;
            case 'done':
              handlers.onDone({
                assistant_message: payload.assistant_message as ChatMessage,
              });
              break;
            case 'error':
              handlers.onError((payload.code as string) || 'unknown');
              break;
          }
        } catch {
          // Malformed frame — skip it
        }
      }
    }
  } catch (err) {
    if ((err as Error).name !== 'AbortError') {
      handlers.onError('stream_read_error');
    }
  }
}
