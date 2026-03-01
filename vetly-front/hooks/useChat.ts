import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

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
