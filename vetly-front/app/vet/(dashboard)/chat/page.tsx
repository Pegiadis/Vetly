'use client';
import { useState } from 'react';
import VetConversationChat from '@/components/vet/VetConversationChat';
import VetAssistantWorkspace from '@/components/vet/VetAssistantWorkspace';

export default function VetChatPage() {
  const [view, setView] = useState<'patient' | 'chat'>('chat');
  return <div className="flex h-[calc(100dvh-3.5rem)] min-h-0 flex-col overflow-hidden px-3 pb-3 pt-3 sm:px-5 sm:pb-4">
    <header className="mb-3 flex shrink-0 flex-wrap items-baseline gap-x-4 gap-y-1"><h1 className="text-xl font-semibold text-ink-900">AI Βοηθός</h1><p className="hidden text-xs text-ink-500 sm:block">Ιστορικό ασθενή, προσχέδια οδηγιών και συνομιλίες.</p></header>
    <div role="group" aria-label="Χώρος εργασίας βοηθού" className="mb-3 flex shrink-0 gap-1 border-b border-ink-200 pb-2">{(['patient', 'chat'] as const).map(value => <button key={value} type="button" aria-pressed={view === value} onClick={() => setView(value)} className={`rounded-lg px-3 py-2 text-xs font-medium ${view === value ? 'bg-clinic-100 text-clinic-700' : 'text-ink-500 hover:bg-ink-100'}`}>{value === 'patient' ? 'Φάκελος ασθενή' : 'Γενικές συνομιλίες'}</button>)}</div>
    <div hidden={view !== 'patient'} className={view === 'patient' ? 'min-h-0 flex-1 overflow-y-auto' : 'hidden'}><VetAssistantWorkspace /></div>
    <div hidden={view !== 'chat'} className={view === 'chat' ? 'min-h-0 flex-1' : 'hidden'}><VetConversationChat /></div>
  </div>;
}
