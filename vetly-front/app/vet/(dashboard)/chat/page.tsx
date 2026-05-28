'use client';

import ChatWindow from '@/components/chat/ChatWindow';

export default function VetChatPage() {
  return (
    <div className="flex min-h-0 flex-col">
      <div className="mb-3 sm:mb-6">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">AI Βοηθός</h1>
        <p className="mt-1 text-sm text-slate-500 sm:text-base">
          Κτηνιατρικές πληροφορίες και βοήθεια με AI
        </p>
      </div>
      <ChatWindow role="vet" accentColor="indigo" />
    </div>
  );
}
