'use client';

import ChatWindow from '@/components/chat/ChatWindow';

export default function VetChatPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">AI Βοηθός</h1>
        <p className="text-slate-500 mt-1">
          Κτηνιατρικές πληροφορίες και βοήθεια με AI
        </p>
      </div>
      <ChatWindow role="vet" accentColor="indigo" />
    </div>
  );
}
