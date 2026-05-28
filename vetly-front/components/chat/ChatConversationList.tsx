'use client';

import React from 'react';
import type { ChatConversation } from '@/hooks/useChat';

const listColorMap: Record<string, { btn: string; active: string }> = {
  teal: {
    btn: 'bg-teal-600 hover:bg-teal-700',
    active: 'bg-teal-50 text-teal-700',
  },
  indigo: {
    btn: 'bg-indigo-600 hover:bg-indigo-700',
    active: 'bg-indigo-50 text-indigo-700',
  },
};

interface ChatConversationListProps {
  conversations: ChatConversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  accentColor?: string;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins} λεπτά πριν`;
  if (diffHours < 24) return `${diffHours} ώρες πριν`;
  if (diffDays < 7) return `${diffDays} ημέρες πριν`;
  return date.toLocaleDateString('el-GR', { day: 'numeric', month: 'short' });
}

export default function ChatConversationList({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  accentColor = 'teal',
}: ChatConversationListProps) {
  const colors = listColorMap[accentColor] || listColorMap.teal;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 p-3 sm:p-4">
        <button
          type="button"
          onClick={onNew}
          className={`w-full flex items-center justify-center gap-2 ${colors.btn} text-white rounded-xl px-4 py-2.5 text-sm font-bold transition-colors`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Νέα συνομιλία
        </button>
      </div>
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
        {conversations.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-8">
            Δεν υπάρχουν συνομιλίες
          </p>
        )}
        {conversations.map((conv) => (
          <div
            key={conv.id}
            className={`group flex items-center gap-1 rounded-xl text-sm transition-all ${
              activeId === conv.id ? colors.active : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <button
              type="button"
              onClick={() => onSelect(conv.id)}
              className={`flex min-w-0 flex-1 items-center gap-2 rounded-xl px-3 py-3 text-left ${
                activeId === conv.id ? 'font-medium' : ''
              }`}
            >
              <svg className="w-4 h-4 flex-shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="min-w-0 flex-1">
                <span className="block truncate">{conv.title}</span>
                <span className="mt-0.5 block text-xs text-slate-400">{formatDate(conv.updated_at)}</span>
              </span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(conv.id);
              }}
              className="mr-2 rounded-lg p-1 text-slate-400 opacity-100 transition-all hover:bg-red-50 hover:text-red-500 sm:opacity-0 sm:group-hover:opacity-100"
              aria-label="Διαγραφή συνομιλίας"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
