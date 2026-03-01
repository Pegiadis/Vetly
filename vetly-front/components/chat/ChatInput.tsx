'use client';

import React, { useState, useRef, useEffect } from 'react';

const btnColorMap: Record<string, string> = {
  teal: 'bg-teal-600 hover:bg-teal-700',
  indigo: 'bg-indigo-600 hover:bg-indigo-700',
};

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  accentColor?: string;
}

export default function ChatInput({ onSend, disabled, accentColor = 'teal' }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [message]);

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const btnColor = btnColorMap[accentColor] || btnColorMap.teal;

  return (
    <div className="border-t border-slate-200 bg-white p-4">
      <div className="flex items-end gap-3">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Γράψτε ένα μήνυμα..."
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-slate-300 disabled:opacity-50 disabled:bg-slate-50"
        />
        <button
          onClick={handleSend}
          disabled={disabled || !message.trim()}
          className={`${btnColor} disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl p-3 transition-colors flex-shrink-0`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  );
}
