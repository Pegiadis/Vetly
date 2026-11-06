'use client';
import Link from 'next/link';
import VetConversationChat from '@/components/vet/VetConversationChat';
export default function OwnerChatPage() {
  return <div className="flex h-[calc(100dvh-172px)] min-h-[480px] flex-col md:h-[calc(100dvh-112px)]">
    <header className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-2">
      <div><h1 className="text-xl font-semibold text-ink-900">AI Βοηθός</h1><p className="mt-1 hidden text-xs text-ink-500 sm:block">Οι ερωτήσεις σας, οι οδηγίες και οι συνομιλίες σας σε ένα μέρος.</p></div>
      <Link href="/owner/on-call" className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-xs font-medium text-clinic-700">Χρειάζομαι κτηνίατρο ↗</Link>
    </header>
    <div className="min-h-0 flex-1"><VetConversationChat role="owner" /></div>
  </div>;
}
