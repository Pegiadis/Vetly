'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { sendChatMessageStream, type ChatMessage } from '@/hooks/useChat';
import { AssistantAvatar } from '@/components/AssistantAvatar';

export { AssistantAvatar };

// What changes between the two audiences: prompts, wording and where the full chat lives.
const audiences = {
  vet: {
    tagline: 'Ρώτησέ με για τη δουλειά του ιατρείου',
    hello: 'Γεια! Είμαι ο βοηθός του Vetly. Μπορώ να σε βοηθήσω με την οργάνωση της ημέρας, μηνύματα προς κηδεμόνες και σημειώσεις.',
    fullPage: '/vet/chat',
    starters: [
      ['Οργάνωση ημέρας', 'Βοήθησέ με να οργανώσω την ημέρα μου με βάση τα διαθέσιμα στοιχεία του ιατρείου.'],
      ['Μήνυμα σε κηδεμόνα', 'Βοήθησέ με να γράψω ένα ευγενικό μήνυμα προς κηδεμόνα. Ρώτησέ με πρώτα τι θέλω να επικοινωνήσω.'],
      ['Οργάνωση σημειώσεων', 'Θέλω να οργανώσω τις σημειώσεις μου σε ένα καθαρό κείμενο, χωρίς να προσθέσεις πληροφορίες. Θα σου τις δώσω στο επόμενο μήνυμα.'],
    ],
  },
  owner: {
    tagline: 'Ρώτησέ με για τη φροντίδα του κατοικιδίου σου',
    hello: 'Γεια! Είμαι ο βοηθός του Vetly. Μπορώ να σε βοηθήσω να ετοιμαστείς για την επίσκεψη και να οργανώσεις τη φροντίδα του κατοικιδίου σου. Δεν αντικαθιστώ τον κτηνίατρο.',
    fullPage: '/owner/chat',
    starters: [
      ['Πριν από την επίσκεψη', 'Βοήθησέ με να ετοιμάσω τις ερωτήσεις μου για τον κτηνίατρο. Ρώτησέ με πρώτα τι με απασχολεί.'],
      ['Καθημερινή φροντίδα', 'Θέλω να οργανώσω τη φροντίδα του κατοικιδίου μου. Ρώτησέ με για το είδος, την ηλικία και τις ανάγκες του.'],
      ['Κατανόηση οδηγιών', 'Θα σου δώσω τις οδηγίες του κτηνιάτρου. Βοήθησέ με να τις οργανώσω χωρίς να αλλάξεις την αγωγή ή τη δοσολογία.'],
    ],
  },
} as const;

/**
 * Compact assistant chat that stays mounted in the app shell, so a conversation
 * survives moving between pages. The full workspace lives at the audience's
 * chat page. `aboveTabBar` lifts it clear of the owner's phone tab bar.
 */
export default function AssistantWidget({ open, onClose, role = 'vet', aboveTabBar = false }: { open: boolean; onClose: () => void; role?: 'vet' | 'owner'; aboveTabBar?: boolean }) {
  const audience = audiences[role];
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const abort = useRef<AbortController | null>(null);
  const generation = useRef(0);
  const pending = useRef(false);
  const sequence = useRef(0);
  const viewport = useRef<HTMLDivElement>(null);
  const composer = useRef<HTMLTextAreaElement>(null);

  useEffect(() => () => { generation.current++; abort.current?.abort(); }, []);
  useEffect(() => { if (open) composer.current?.focus(); }, [open]);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  useEffect(() => { const el = viewport.current; if (el) el.scrollTop = el.scrollHeight; }, [messages, open]);

  function reset() {
    if (busy) return;
    generation.current++;
    setConversationId(null); setMessages([]); setText(''); setError('');
    composer.current?.focus();
  }

  async function send(preset?: string) {
    const value = (preset ?? text).trim();
    if (!value || value.length > 5000 || pending.current) return;
    pending.current = true;
    setBusy(true); setError(''); setText('');
    const version = generation.current;
    const controller = new AbortController(); abort.current = controller;
    const stamp = ++sequence.current;
    const userId = `local-user-${stamp}`;
    const assistantId = `local-assistant-${stamp}`;
    const now = new Date().toISOString();
    let completed = false, startedId = conversationId;
    setMessages(previous => [...previous,
      { id: userId, conversation_id: conversationId || '', role: 'user', content: value, created_at: now },
      { id: assistantId, conversation_id: conversationId || '', role: 'assistant', content: '', created_at: now }]);
    try {
      await sendChatMessageStream(role, value, conversationId, {
        onStart: ({ conversation_id, user_message }) => {
          if (generation.current !== version) return;
          startedId = conversation_id; setConversationId(conversation_id);
          setMessages(previous => previous.map(m => m.id === userId ? user_message : m));
        },
        onChunk: chunk => { if (generation.current === version) setMessages(previous => previous.map(m => m.id === assistantId ? { ...m, content: m.content + chunk } : m)); },
        onDone: ({ assistant_message }) => { completed = true; if (generation.current === version) setMessages(previous => previous.map(m => m.id === assistantId ? assistant_message : m)); },
        onError: () => { /* Finalised below, keeping the user's text. */ },
      }, controller.signal);
    } catch {
      // Handled by the same recovery below.
    } finally {
      if (generation.current === version) {
        if (!completed) {
          setMessages(previous => previous.filter(m => m.id !== assistantId && (startedId || m.id !== userId)));
          setText(value);
          setError(controller.signal.aborted ? 'Η απάντηση σταμάτησε. Το μήνυμά σας έμεινε στο πεδίο.' : 'Δεν λάβαμε απάντηση από τον βοηθό. Το μήνυμά σας έμεινε στο πεδίο· δοκιμάστε ξανά.');
        }
        setBusy(false); pending.current = false; abort.current = null;
      }
    }
  }

  return <section role="dialog" aria-label="Βοηθός Vetly" aria-hidden={!open}
    className={`${open ? 'flex' : 'hidden'} fixed inset-x-3 ${aboveTabBar ? 'bottom-[76px] h-[min(560px,calc(100dvh-148px))]' : 'bottom-3 h-[min(560px,calc(100dvh-84px))]'} z-50 flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.18)] sm:inset-x-auto sm:right-5 sm:w-[380px] md:bottom-5 md:h-[min(560px,calc(100dvh-84px))]`}>
    <header className="flex shrink-0 items-center gap-2.5 border-b border-ink-100 px-3 py-2.5">
      <AssistantAvatar size={32} mood={busy ? 'thinking' : 'idle'} />
      <div className="min-w-0 flex-1"><h2 className="truncate text-sm font-semibold text-ink-900">Βοηθός Vetly</h2><p className="truncate text-xs text-ink-500">{busy ? 'Γράφει…' : audience.tagline}</p></div>
      <button type="button" onClick={reset} disabled={busy || messages.length === 0} className="h-8 rounded-[10px] px-2.5 text-xs font-medium text-ink-700 hover:bg-black/[0.06] disabled:opacity-40">Νέα</button>
      <Link href={audience.fullPage} onClick={onClose} aria-label="Άνοιγμα σε πλήρη οθόνη" title="Πλήρης οθόνη" className="grid h-8 w-8 place-items-center rounded-[10px] text-ink-600 hover:bg-black/[0.06]"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 4h6v6M20 4l-7 7M10 20H4v-6M4 20l7-7" /></svg></Link>
      <button type="button" onClick={onClose} aria-label="Κλείσιμο βοηθού" className="grid h-8 w-8 place-items-center rounded-[10px] text-ink-600 hover:bg-black/[0.06]"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg></button>
    </header>

    <div ref={viewport} className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-3 py-3">
      {messages.length === 0 ? <div className="flex min-h-full flex-col justify-end gap-2">
        <div className="mb-1 flex items-start gap-2"><AssistantAvatar size={28} animated={false} /><p className="rounded-2xl rounded-tl-md bg-ink-50 px-3 py-2 text-sm leading-5 text-ink-800">{audience.hello}</p></div>
        {audience.starters.map(([label, prompt]) => <button key={label} type="button" disabled={busy} onClick={() => void send(prompt)} className="ml-9 rounded-[10px] border border-ink-200 px-3 py-2 text-left text-[13px] font-medium text-ink-800 hover:bg-ink-50 focus-visible:outline-2 focus-visible:outline-clinic-600">{label}</button>)}
      </div> : messages.map(message => message.role === 'user'
        ? <div key={message.id} className="flex justify-end"><p className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-tr-md bg-clinic-600 px-3 py-2 text-sm leading-5 text-white">{message.content}</p></div>
        : <div key={message.id} className="flex items-start gap-2"><AssistantAvatar size={28} animated={false} /><div className="min-w-0 max-w-[85%] break-words rounded-2xl rounded-tl-md bg-ink-50 px-3 py-2 text-sm leading-5 text-ink-800 [&_a]:text-clinic-700 [&_a]:underline [&_code]:rounded [&_code]:bg-black/[0.06] [&_code]:px-1 [&_li]:ml-4 [&_ol]:list-decimal [&_p+p]:mt-2 [&_table]:text-xs [&_td]:border [&_td]:border-ink-200 [&_td]:px-1.5 [&_td]:py-1 [&_th]:border [&_th]:border-ink-200 [&_th]:px-1.5 [&_th]:py-1 [&_ul]:list-disc">
          {message.content ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown> : <span className="inline-flex gap-1 py-1.5" aria-label="Ο βοηθός γράφει"><i className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink-400" /><i className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink-400 [animation-delay:150ms]" /><i className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink-400 [animation-delay:300ms]" /></span>}
        </div></div>)}
    </div>

    {error && <p role="alert" className="mx-3 mb-2 rounded-[10px] bg-red-50 px-3 py-2 text-xs leading-5 text-red-700">{error}</p>}
    <form onSubmit={event => { event.preventDefault(); void send(); }} className="shrink-0 border-t border-ink-100 p-2.5">
      <div className="flex items-end gap-2 rounded-xl border border-ink-300 bg-white py-1.5 pl-3 pr-1.5 focus-within:border-clinic-600">
        <label htmlFor="assistant-widget-message" className="sr-only">Μήνυμα στον βοηθό</label>
        <textarea id="assistant-widget-message" ref={composer} rows={1} maxLength={5000} value={text} placeholder="Γράψε ένα μήνυμα…"
          onChange={event => setText(event.target.value)}
          onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void send(); } }}
          className="max-h-28 min-h-8 flex-1 resize-none bg-transparent py-1.5 text-sm text-ink-900 outline-none placeholder:text-ink-400" />
        {busy
          ? <button type="button" onClick={() => abort.current?.abort()} className="h-8 shrink-0 rounded-[10px] bg-black/[0.06] px-3 text-[13px] font-medium text-ink-900 hover:bg-black/10">Διακοπή</button>
          : <button type="submit" disabled={!text.trim()} aria-label="Αποστολή" className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-clinic-600 text-white hover:bg-clinic-700 disabled:opacity-40"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7" /></svg></button>}
      </div>
      <p className="mt-1.5 px-1 text-[11px] text-ink-500">Ο βοηθός μπορεί να κάνει λάθη. Έλεγξε τις απαντήσεις πριν τις χρησιμοποιήσεις.</p>
    </form>
  </section>;
}
