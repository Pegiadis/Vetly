'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { sendChatMessageStream, type ChatMessage } from '@/hooks/useChat';

/**
 * Vetly's assistant mascot, from the brand avatar pack (public/branding/assistant):
 * a floppy dog ear, a pointed cat ear and a clinic tag. The four pack states are
 * layered here so the parts can move on their own: it breathes, blinks, glances
 * and twitches an ear (keyframes in globals.css, off under prefers-reduced-motion).
 * `mood="thinking"` looks up and talks while a reply is written; `animated={false}`
 * keeps it still; `framed` sits it inside a pale round badge for small sizes.
 */
export function AssistantAvatar({ size = 36, className = '', mood = 'idle', animated = true, framed = true }: { size?: number; className?: string; mood?: 'idle' | 'thinking'; animated?: boolean; framed?: boolean }) {
  return <svg width={size} height={size} viewBox="0 0 1024 1024" data-mood={mood} className={`${animated ? 'assistant-avatar' : ''} shrink-0 ${className}`} aria-hidden="true">
    {framed && <circle cx="512" cy="512" r="512" fill="#def5ed" />}
    <g transform={framed ? 'translate(512 530) scale(0.8) translate(-512 -512)' : undefined}>
      <path fill="#006064" d="M205 940 Q235 830 350 803 H674 Q789 830 819 940 Q825 962 802 962 H222 Q199 962 205 940Z" />
      <path fill="#004E52" d="M340 750 H684 V838 Q512 891 340 838Z" />
      <g className="aa-head">
        <path className="aa-ear-cat" fill="#004E52" d="M640 219 L867 82 Q902 61 916 103 Q945 232 867 428Z" />
        <ellipse cx="512" cy="492" rx="350" ry="325" fill="#006064" />
        <path className="aa-ear-dog" fill="#004E52" d="M386 199 Q331 141 250 175 Q151 220 83 345 Q17 472 39 529 Q61 578 114 562 Q175 539 208 455 L268 327 Q300 255 365 243 Q407 235 386 199Z" />
        <path fill="#DEF5ED" d="M411 524 Q512 459 613 524 C788 509 814 671 729 742 C635 828 393 828 295 742 C209 671 235 509 411 524Z" />
        <path fill="#002E32" d="M463 537 Q512 518 561 537 Q583 547 565 572 L537 603 Q512 628 487 603 L459 572 Q441 547 463 537Z" />
        <g className="aa-eyes-open" fill="#002E32">
          <ellipse cx="363" cy="437" rx="55" ry="58" />
          <ellipse cx="661" cy="437" rx="55" ry="58" />
          <g className="aa-highlights" fill="#fff"><circle cx="380" cy="415" r="15" /><circle cx="678" cy="415" r="15" /></g>
        </g>
        <g className="aa-eyes-closed" opacity="0" fill="none" stroke="#002E32" strokeWidth="24" strokeLinecap="round">
          <path d="M318 437 Q363 488 408 437" />
          <path d="M616 437 Q661 488 706 437" />
        </g>
        <path className="aa-mouth-smile" d="M425 651 Q512 733 599 651" fill="none" stroke="#002E32" strokeWidth="27" strokeLinecap="round" />
        <path className="aa-mouth-open" opacity="0" fill="#002E32" d="M434 642 H590 Q608 642 601 665 Q581 729 512 729 Q443 729 423 665 Q416 642 434 642Z" />
      </g>
      <g className="aa-tag">
        <circle cx="512" cy="886" r="70" fill="#4CC9A6" />
        <path fill="#fff" d="M500 848 H524 V874 H550 V898 H524 V924 H500 V898 H474 V874 H500Z" />
      </g>
    </g>
  </svg>;
}

const starters = [
  ['Οργάνωση ημέρας', 'Βοήθησέ με να οργανώσω την ημέρα μου με βάση τα διαθέσιμα στοιχεία του ιατρείου.'],
  ['Μήνυμα σε κηδεμόνα', 'Βοήθησέ με να γράψω ένα ευγενικό μήνυμα προς κηδεμόνα. Ρώτησέ με πρώτα τι θέλω να επικοινωνήσω.'],
  ['Οργάνωση σημειώσεων', 'Θέλω να οργανώσω τις σημειώσεις μου σε ένα καθαρό κείμενο, χωρίς να προσθέσεις πληροφορίες. Θα σου τις δώσω στο επόμενο μήνυμα.'],
];

/**
 * Compact assistant chat that stays mounted in the vet shell, so a conversation
 * survives moving between pages. The full workspace lives at /vet/chat.
 */
export default function AssistantWidget({ open, onClose }: { open: boolean; onClose: () => void }) {
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
      await sendChatMessageStream('vet', value, conversationId, {
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
    className={`${open ? 'flex' : 'hidden'} fixed inset-x-3 bottom-3 z-50 h-[min(560px,calc(100dvh-84px))] flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.18)] sm:inset-x-auto sm:bottom-5 sm:right-5 sm:w-[380px]`}>
    <header className="flex shrink-0 items-center gap-2.5 border-b border-ink-100 px-3 py-2.5">
      <AssistantAvatar size={32} mood={busy ? 'thinking' : 'idle'} />
      <div className="min-w-0 flex-1"><h2 className="truncate text-sm font-semibold text-ink-900">Βοηθός Vetly</h2><p className="truncate text-xs text-ink-500">{busy ? 'Γράφει…' : 'Ρώτησέ με για τη δουλειά του ιατρείου'}</p></div>
      <button type="button" onClick={reset} disabled={busy || messages.length === 0} className="h-8 rounded-[10px] px-2.5 text-xs font-medium text-ink-700 hover:bg-black/[0.06] disabled:opacity-40">Νέα</button>
      <Link href="/vet/chat" onClick={onClose} aria-label="Άνοιγμα σε πλήρη οθόνη" title="Πλήρης οθόνη" className="grid h-8 w-8 place-items-center rounded-[10px] text-ink-600 hover:bg-black/[0.06]"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 4h6v6M20 4l-7 7M10 20H4v-6M4 20l7-7" /></svg></Link>
      <button type="button" onClick={onClose} aria-label="Κλείσιμο βοηθού" className="grid h-8 w-8 place-items-center rounded-[10px] text-ink-600 hover:bg-black/[0.06]"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg></button>
    </header>

    <div ref={viewport} className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-3 py-3">
      {messages.length === 0 ? <div className="flex min-h-full flex-col justify-end gap-2">
        <div className="mb-1 flex items-start gap-2"><AssistantAvatar size={28} animated={false} /><p className="rounded-2xl rounded-tl-md bg-ink-50 px-3 py-2 text-sm leading-5 text-ink-800">Γεια! Είμαι ο βοηθός του Vetly. Μπορώ να σε βοηθήσω με την οργάνωση της ημέρας, μηνύματα προς κηδεμόνες και σημειώσεις.</p></div>
        {starters.map(([label, prompt]) => <button key={label} type="button" disabled={busy} onClick={() => void send(prompt)} className="ml-9 rounded-[10px] border border-ink-200 px-3 py-2 text-left text-[13px] font-medium text-ink-800 hover:bg-ink-50 focus-visible:outline-2 focus-visible:outline-clinic-600">{label}</button>)}
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
