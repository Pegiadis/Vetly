'use client';

import React from 'react';

const colorMap: Record<string, { bubble: string; avatarBg: string; avatarIcon: string }> = {
  teal: {
    bubble: 'bg-teal-600 text-white',
    avatarBg: 'bg-teal-100',
    avatarIcon: 'text-teal-600',
  },
  indigo: {
    bubble: 'bg-indigo-600 text-white',
    avatarBg: 'bg-indigo-100',
    avatarIcon: 'text-indigo-600',
  },
};

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  accentColor?: string;
}

export default function ChatMessage({
  role,
  content,
  createdAt,
  accentColor = 'teal',
}: ChatMessageProps) {
  const isUser = role === 'user';
  const colors = colorMap[accentColor] || colorMap.teal;

  const time = new Date(createdAt).toLocaleTimeString('el-GR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      {!isUser && (
        <div className={`w-8 h-8 rounded-full ${colors.avatarBg} flex items-center justify-center mr-3 flex-shrink-0 mt-1`}>
          <svg className={`w-4 h-4 ${colors.avatarIcon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-2.47 2.47a2.25 2.25 0 01-1.59.659H9.06a2.25 2.25 0 01-1.591-.659L5 14.5m14 0V5a2 2 0 00-2-2H7a2 2 0 00-2 2v9.5" />
          </svg>
        </div>
      )}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 ${
          isUser
            ? colors.bubble
            : 'bg-white border border-slate-200 text-slate-800'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{content}</p>
        <p
          className={`text-xs mt-1 ${
            isUser ? 'text-white/70' : 'text-slate-400'
          }`}
        >
          {time}
        </p>
      </div>
    </div>
  );
}
