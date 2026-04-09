'use client';

import React, { useState, useRef, useEffect } from 'react';
import ChatMessageComponent from './ChatMessage';
import ChatInput from './ChatInput';
import ChatConversationList from './ChatConversationList';
import {
  useChatConversations,
  useChatMessages,
  sendChatMessageStream,
  deleteChatConversation,
} from '@/hooks/useChat';
import type { ChatMessage } from '@/hooks/useChat';

// Messages use real UUIDs when persisted; we generate temporary ids for
// optimistic rendering before the server responds.
function makeTempId(prefix: 'user' | 'assistant'): string {
  return `pending-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const windowColorMap: Record<string, {
  spinner: string;
  avatarBg: string;
  avatarIcon: string;
  emptyBg: string;
  emptyIcon: string;
}> = {
  teal: {
    spinner: 'border-teal-600',
    avatarBg: 'bg-teal-100',
    avatarIcon: 'text-teal-600',
    emptyBg: 'bg-teal-100',
    emptyIcon: 'text-teal-600',
  },
  indigo: {
    spinner: 'border-indigo-600',
    avatarBg: 'bg-indigo-100',
    avatarIcon: 'text-indigo-600',
    emptyBg: 'bg-indigo-100',
    emptyIcon: 'text-indigo-600',
  },
};

interface ChatWindowProps {
  role: 'owner' | 'vet';
  accentColor?: string;
}

export default function ChatWindow({ role, accentColor = 'teal' }: ChatWindowProps) {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const colors = windowColorMap[accentColor] || windowColorMap.teal;

  const {
    conversations,
    loading: convsLoading,
    refetch: refetchConversations,
  } = useChatConversations(role);

  const {
    messages,
    title,
    loading: msgsLoading,
    setMessages,
  } = useChatMessages(role, activeConversationId);

  // Scroll to bottom only if the user is already near the bottom — prevents
  // yanking them away if they scrolled up to read older messages.
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    if (distanceFromBottom < 150) {
      // Use 'auto' (not 'smooth') during streaming so the browser doesn't
      // fight the token-by-token updates with chained smooth-scroll animations.
      messagesEndRef.current?.scrollIntoView({
        behavior: sending ? 'auto' : 'smooth',
      });
    }
  }, [messages, sending]);

  // Abort any in-flight stream when the user switches conversations or the
  // component unmounts — leaving an orphan stream in the background would
  // append chunks to a conversation the user isn't looking at anymore.
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      abortRef.current = null;
    };
  }, [activeConversationId]);

  const handleSend = async (text: string) => {
    if (sending) return;

    // Optimistic rows: show the user's message instantly and a placeholder
    // assistant message that we'll progressively fill in from the stream.
    const tempUserId = makeTempId('user');
    const tempAssistantId = makeTempId('assistant');
    const nowIso = new Date().toISOString();
    const optimisticConvId = activeConversationId || 'pending-conv';

    setMessages((prev: ChatMessage[]) => [
      ...prev,
      {
        id: tempUserId,
        conversation_id: optimisticConvId,
        role: 'user',
        content: text,
        created_at: nowIso,
      },
      {
        id: tempAssistantId,
        conversation_id: optimisticConvId,
        role: 'assistant',
        content: '',
        created_at: nowIso,
      },
    ]);

    setSending(true);
    const controller = new AbortController();
    abortRef.current = controller;

    await sendChatMessageStream(
      role,
      text,
      activeConversationId,
      {
        onStart: ({ conversation_id, user_message }) => {
          // Replace the optimistic user row with the real persisted one,
          // and store the real conversation id (especially important for
          // newly-created conversations).
          if (!activeConversationId) {
            setActiveConversationId(conversation_id);
          }
          setMessages((prev: ChatMessage[]) =>
            prev.map((m) => (m.id === tempUserId ? user_message : m)),
          );
        },
        onChunk: (chunkText) => {
          // Append chunk text to the placeholder assistant message.
          setMessages((prev: ChatMessage[]) =>
            prev.map((m) =>
              m.id === tempAssistantId
                ? { ...m, content: m.content + chunkText }
                : m,
            ),
          );
        },
        onDone: ({ assistant_message }) => {
          // Replace the placeholder with the real persisted assistant row.
          setMessages((prev: ChatMessage[]) =>
            prev.map((m) => (m.id === tempAssistantId ? assistant_message : m)),
          );
          refetchConversations();
        },
        onError: () => {
          // Leave the user message so they can retry without re-typing.
          // Drop the empty assistant placeholder.
          setMessages((prev: ChatMessage[]) =>
            prev.filter((m) => m.id !== tempAssistantId),
          );
        },
      },
      controller.signal,
    );

    setSending(false);
    if (abortRef.current === controller) {
      abortRef.current = null;
    }
  };

  const handleNewConversation = () => {
    abortRef.current?.abort();
    setActiveConversationId(null);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteChatConversation(role, id);
      if (activeConversationId === id) {
        abortRef.current?.abort();
        setActiveConversationId(null);
      }
      refetchConversations();
    } catch {
      // silent
    }
  };

  return (
    <div className="flex h-[calc(100vh-140px)] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Sidebar */}
      <div className="w-72 border-r border-slate-200 bg-slate-50 flex-shrink-0">
        {convsLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className={`animate-spin rounded-full h-6 w-6 border-b-2 ${colors.spinner}`} />
          </div>
        ) : (
          <ChatConversationList
            conversations={conversations}
            activeId={activeConversationId}
            onSelect={setActiveConversationId}
            onNew={handleNewConversation}
            onDelete={handleDelete}
            accentColor={accentColor}
          />
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="border-b border-slate-200 px-6 py-4 flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full ${colors.avatarBg} flex items-center justify-center`}>
            <svg className={`w-4 h-4 ${colors.avatarIcon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-2.47 2.47a2.25 2.25 0 01-1.59.659H9.06a2.25 2.25 0 01-1.591-.659L5 14.5m14 0V5a2 2 0 00-2-2H7a2 2 0 00-2 2v9.5" />
            </svg>
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-sm">
              {activeConversationId && title ? title : 'AI Βοηθός'}
            </h2>
            <p className="text-xs text-slate-400">Vetly AI</p>
          </div>
        </div>

        {/* Messages */}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-6 py-4 bg-slate-50/50">
          {msgsLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className={`animate-spin rounded-full h-6 w-6 border-b-2 ${colors.spinner}`} />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className={`w-16 h-16 ${colors.emptyBg} rounded-full flex items-center justify-center mb-4`}>
                <svg className={`w-8 h-8 ${colors.emptyIcon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">
                Ρωτήστε τον AI Βοηθό
              </h3>
              <p className="text-slate-500 text-sm max-w-md">
                Μπορείτε να ρωτήσετε οτιδήποτε σχετικά με την υγεία των κατοικιδίων,
                ραντεβού, φάρμακα και γενικές κτηνιατρικές συμβουλές.
              </p>
            </div>
          ) : (
            <>
              {messages.map((msg) => {
                // The assistant placeholder being actively streamed shows
                // a blinking cursor instead of the normal timestamp row.
                const isStreamingPlaceholder =
                  sending &&
                  msg.role === 'assistant' &&
                  msg.id.startsWith('pending-assistant-');
                return (
                  <ChatMessageComponent
                    key={msg.id}
                    role={msg.role}
                    content={msg.content}
                    createdAt={msg.created_at}
                    accentColor={accentColor}
                    streaming={isStreamingPlaceholder}
                  />
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <ChatInput onSend={handleSend} disabled={sending} accentColor={accentColor} />
      </div>
    </div>
  );
}
