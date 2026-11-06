'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { useChatConversations, sendChatMessageStream, deleteChatConversation, type ChatMessage } from '@/hooks/useChat';
import ChatMessageView from '@/components/chat/ChatMessage';
import { ClinicButton, ClinicInput, ClinicTextarea, ClinicPagination } from './ClinicUI';

const starters = [
  ['Οργάνωση ημέρας', 'Βοήθησέ με να οργανώσω την ημέρα μου με βάση τα διαθέσιμα στοιχεία του ιατρείου.'],
  ['Επικοινωνία με κηδεμόνα', 'Βοήθησέ με να γράψω ένα ευγενικό μήνυμα προς κηδεμόνα. Ρώτησέ με πρώτα τι θέλω να επικοινωνήσω.'],
  ['Οργάνωση σημειώσεων', 'Θέλω να οργανώσω τις σημειώσεις μου σε ένα καθαρό κείμενο, χωρίς να προσθέσεις πληροφορίες. Θα σου τις δώσω στο επόμενο μήνυμα.'],
];

const ownerStarters = [
  ['Πριν από την επίσκεψη', 'Βοήθησέ με να ετοιμάσω τις ερωτήσεις μου για τον κτηνίατρο. Ρώτησέ με πρώτα τι με απασχολεί.'],
  ['Καθημερινή φροντίδα', 'Θέλω να οργανώσω τη φροντίδα του κατοικιδίου μου. Ρώτησέ με για το είδος, την ηλικία και τις ανάγκες του.'],
  ['Κατανόηση οδηγιών', 'Θα σου δώσω τις οδηγίες του κτηνιάτρου. Βοήθησέ με να τις οργανώσω χωρίς να αλλάξεις την αγωγή ή τη δοσολογία.'],
];

export default function VetConversationChat({ role = 'vet' }: { role?: 'vet' | 'owner' }) {
  const isOwner = role === 'owner';
  const [page, setPage] = useState(1);
  const { conversations, totalPages, loading, error: listError, refetch } = useChatConversations(role, page);
  const [active, setActive] = useState<string | null>(null);
  const [title, setTitle] = useState('Νέα συνομιλία');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState('');
  const [readFailed, setReadFailed] = useState(false);
  const [mobileList, setMobileList] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);
  const generation = useRef(0);
  const pending = useRef(false);
  const viewport = useRef<HTMLDivElement>(null);
  const composer = useRef<HTMLTextAreaElement>(null);

  useEffect(() => () => { generation.current++; abort.current?.abort(); }, []);
  useEffect(() => {
    const el = viewport.current;
    if (el && el.scrollHeight - el.scrollTop - el.clientHeight < 220) el.scrollTop = el.scrollHeight;
  }, [messages]);

  async function choose(id: string | null) {
    if (busy || deleting) return;
    if (text.trim() && !window.confirm('Να καθαριστεί το μη απεσταλμένο μήνυμα;')) return;
    const version = ++generation.current;
    setActive(id); setMessages([]); setError(''); setText(''); setReadFailed(false); setMobileList(false);
    setTitle(conversations.find(c => c.id === id)?.title || 'Νέα συνομιλία');
    if (!id) { setReading(false); composer.current?.focus(); return; }
    setReading(true);
    try {
      const result = await api.get<{ title: string; messages: ChatMessage[] }>(`/${role}/chat/conversations/${id}`);
      if (generation.current === version) { setMessages(result.messages); setTitle(result.title); }
    } catch { if (generation.current === version) { setError('Δεν φορτώθηκε η συνομιλία. Επιλέξτε την ξανά για επανάληψη.'); setReadFailed(true); } }
    finally { if (generation.current === version) setReading(false); }
  }

  async function send() {
    const value = text.trim();
    if (!value || value.length > 5000 || pending.current || reading || readFailed) return;
    pending.current = true;
    setBusy(true); setError(''); setText('');
    const version = generation.current;
    const controller = new AbortController(); abort.current = controller;
    const userId = `local-user-${Date.now()}`;
    const assistantId = `local-assistant-${Date.now()}`;
    const now = new Date().toISOString();
    let completed = false, startedId = active;
    setMessages(previous => [...previous, { id: userId, conversation_id: active || '', role: 'user', content: value, created_at: now }, { id: assistantId, conversation_id: active || '', role: 'assistant', content: '', created_at: now }]);
    requestAnimationFrame(() => { if (viewport.current) viewport.current.scrollTop = viewport.current.scrollHeight; });
    try {
      await sendChatMessageStream(role, value, active, {
        onStart: ({ conversation_id, user_message }) => {
          if (generation.current !== version) return;
          startedId = conversation_id; setActive(conversation_id);
          if (!active) setTitle(value.slice(0, 50));
          setMessages(previous => previous.map(m => m.id === userId ? user_message : m));
        },
        onChunk: chunk => { if (generation.current === version) setMessages(previous => previous.map(m => m.id === assistantId ? { ...m, content: m.content + chunk } : m)); },
        onDone: ({ assistant_message }) => { completed = true; if (generation.current === version) { setMessages(previous => previous.map(m => m.id === assistantId ? assistant_message : m)); void refetch(); } },
        onError: () => { /* Finalize visibly below; preserve the user's text. */ },
      }, controller.signal);
    } catch {
      // The same recovery below handles unexpected transport failures.
    } finally {
      if (generation.current === version) {
        if (!completed) {
          setMessages(previous => previous.filter(m => m.id !== assistantId && (startedId || m.id !== userId)));
          setText(value);
          setError(controller.signal.aborted ? 'Η παραγωγή σταμάτησε. Το μήνυμά σας παραμένει διαθέσιμο για επεξεργασία.' : 'Δεν λάβαμε απάντηση από τον AI βοηθό. Το μήνυμά σας επανήλθε στο πεδίο σύνταξης για νέα προσπάθεια.');
          if (startedId) void refetch();
        }
        setBusy(false); pending.current = false; abort.current = null;
      }
    }
  }

  async function remove(id: string) {
    if (busy || deleting || !window.confirm('Να διαγραφεί οριστικά αυτή η συνομιλία;')) return;
    setDeleting(id); setError('');
    try {
      await deleteChatConversation(role, id);
      if (active === id) { generation.current++; setActive(null); setMessages([]); setTitle('Νέα συνομιλία'); setReadFailed(false); setReading(false); }
      await refetch();
    } catch { setError('Η συνομιλία δεν διαγράφηκε. Δοκιμάστε ξανά.'); }
    finally { setDeleting(null); }
  }

  return <section aria-label="Συνομιλία με τον AI βοηθό" className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-ink-200 bg-white shadow-xs">
    <div className="flex shrink-0 items-center justify-between border-b border-ink-200 p-2 md:hidden"><ClinicButton aria-expanded={mobileList} onClick={() => setMobileList(v => !v)}>Συνομιλίες</ClinicButton><ClinicButton disabled={busy || !!deleting} onClick={() => choose(null)}>+ Νέα</ClinicButton></div>
    <div className="flex min-h-0 flex-1 flex-col md:flex-row">
      <aside aria-label="Ιστορικό συνομιλιών" className={`${mobileList ? 'flex' : 'hidden'} max-h-44 w-full shrink-0 flex-col border-b border-ink-200 bg-ink-50/50 md:flex md:max-h-none md:w-60 md:border-b-0 md:border-r`}>
        <div className="space-y-3 border-b border-ink-200 p-3"><ClinicButton variant="primary" className="w-full" disabled={busy || !!deleting} onClick={() => choose(null)}>+ Νέα συνομιλία</ClinicButton><ClinicInput className="w-full text-xs!" aria-label="Αναζήτηση συνομιλιών" placeholder="Αναζήτηση στη σελίδα…" value={search} onChange={e => setSearch(e.target.value)} /></div>
        <div className="min-h-0 flex-1 overflow-auto p-2">
          <p className="px-2 py-2 text-[11px] font-medium text-ink-500">ΠΡΟΣΦΑΤΕΣ ΣΥΝΟΜΙΛΙΕΣ</p>
          {loading && <p role="status" className="p-3 text-xs text-ink-500">Φόρτωση…</p>}
          {listError && <div role="alert" className="p-2 text-xs text-red-700">Δεν φορτώθηκε το ιστορικό.<ClinicButton className="mt-2" onClick={refetch}>Επανάληψη</ClinicButton></div>}
          {!loading && !listError && !conversations.length && <p className="px-2 py-4 text-xs leading-5 text-ink-500">Οι συνομιλίες σας θα εμφανίζονται εδώ.</p>}
          {!loading && conversations.filter(c => c.title.toLocaleLowerCase('el').includes(search.toLocaleLowerCase('el'))).map(c => <div key={c.id} className={`mb-1 flex items-center rounded-lg ${c.id === active ? 'bg-clinic-100' : 'hover:bg-ink-100'}`}><button disabled={busy || !!deleting} aria-current={c.id === active ? 'true' : undefined} className="min-w-0 flex-1 px-3 py-3 text-left disabled:opacity-50" onClick={() => choose(c.id)}><span className="block truncate text-xs font-medium text-ink-800">{c.title}</span><time className="mt-1 block text-[11px] text-ink-500">{new Date(c.updated_at).toLocaleDateString('el-GR', { day: 'numeric', month: 'short' })}</time></button><button aria-label={`Διαγραφή: ${c.title}`} disabled={busy || !!deleting} onClick={() => remove(c.id)} className="mr-1 rounded-md p-2 text-ink-400 hover:bg-white hover:text-red-700 disabled:opacity-50">×</button></div>)}
          {!loading && search && !conversations.some(c => c.title.toLocaleLowerCase('el').includes(search.toLocaleLowerCase('el'))) && <p className="p-2 text-xs text-ink-500">Δεν βρέθηκαν συνομιλίες σε αυτή τη σελίδα.</p>}
        </div>
        <div className="px-2 pb-2"><ClinicPagination page={page} totalPages={totalPages} onPageChange={setPage} /></div>
      </aside>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center gap-3 border-b border-ink-200 px-4 py-3 sm:px-6"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-clinic-100 text-xs font-semibold text-clinic-700">AI</span><div className="min-w-0"><h2 className="truncate text-sm font-semibold text-ink-900">{title}</h2><p className="mt-0.5 text-[11px] text-ink-500">{isOwner ? 'Φροντίδα κατοικιδίων · Προετοιμασία επίσκεψης' : 'Γενική συνομιλία · Χωρίς επιλεγμένο φάκελο ασθενή'}</p></div></header>
        <div ref={viewport} className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
          {reading ? <p role="status" className="p-4 text-sm text-ink-500">Φόρτωση συνομιλίας…</p> : !messages.length && !readFailed ? <div className="mx-auto flex min-h-full max-w-xl flex-col justify-center py-4"><p className="text-xs font-medium text-clinic-600">{isOwner ? 'VETLY · ΔΙΠΛΑ ΣΑΣ ΣΤΗ ΦΡΟΝΤΙΔΑ' : 'VETLY · ΒΟΗΘΟΣ ΚΤΗΝΙΑΤΡΕΙΟΥ'}</p><h3 className="mt-3 text-2xl font-semibold tracking-tight text-ink-900">{isOwner ? 'Τι σας απασχολεί σήμερα;' : 'Τι θέλετε να ετοιμάσουμε;'}</h3><p className="mt-3 text-sm leading-6 text-ink-500">{isOwner ? 'Ένας χώρος για τις απορίες σας. Προετοιμάστε την επόμενη επίσκεψη ή βάλτε σε σειρά τις οδηγίες φροντίδας.' : 'Οργανώστε τη δουλειά σας, διαμορφώστε ένα μήνυμα ή βάλτε τις σημειώσεις σας σε σειρά.'}</p><div className="mt-6 space-y-2">{(isOwner ? ownerStarters : starters).map(([label, prompt]) => <button key={label} onClick={() => { setText(prompt); composer.current?.focus(); }} className="flex w-full items-center justify-between gap-3 rounded-lg border border-ink-200 px-4 py-3 text-left text-sm text-ink-800 transition-colors hover:border-clinic-300 hover:bg-clinic-50"><span>{label}</span><span aria-hidden="true" className="text-clinic-600">↗</span></button>)}</div><p className="mt-5 text-xs leading-5 text-ink-400">{isOwner ? 'Ο βοηθός δεν αντικαθιστά την εξέταση. Για επείγον περιστατικό, επικοινωνήστε με κτηνίατρο.' : 'Για σύνοψη συγκεκριμένου ιστορικού, χρησιμοποιήστε την καρτέλα «Φάκελος ασθενή».'}</p></div> : <div className="mx-auto max-w-3xl">{messages.map(m => <div key={m.id}><ChatMessageView role={m.role} content={m.content} createdAt={m.created_at} accentColor="indigo" streaming={busy && m.id.startsWith('local-assistant-')} />{m.role === 'assistant' && m.content && !m.id.startsWith('local-') && <button onClick={async () => { try { await navigator.clipboard.writeText(m.content); setCopied(m.id); } catch { setError('Η αντιγραφή δεν επιτράπηκε. Επιλέξτε το κείμενο χειροκίνητα.'); } }} className="mb-5 ml-11 text-xs text-ink-500 hover:text-clinic-700">{copied === m.id ? 'Αντιγράφηκε' : 'Αντιγραφή απάντησης'}</button>}</div>)}</div>}
        </div>
        {busy && <div role="status" className="flex items-center justify-between border-t border-ink-100 px-4 py-2 text-xs text-clinic-700"><span>Ο βοηθός γράφει…</span><ClinicButton onClick={() => abort.current?.abort()}>Διακοπή</ClinicButton></div>}
        {error && <p role="alert" className="mx-4 mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs leading-5 text-red-700">{error}</p>}
        <form onSubmit={e => { e.preventDefault(); void send(); }} className="shrink-0 border-t border-ink-200 bg-white p-3 sm:p-4"><label htmlFor="vet-chat-message" className="sr-only">Μήνυμα στον βοηθό</label><div className="rounded-xl border border-ink-300 bg-white p-2 focus-within:border-clinic-600"><ClinicTextarea ref={composer} id="vet-chat-message" className="max-h-32 w-full border-0! bg-transparent! shadow-none focus:outline-none!" rows={2} maxLength={5000} disabled={busy || reading || readFailed} value={text} onChange={e => setText(e.target.value)} placeholder="Γράψτε τι χρειάζεστε…" onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); void send(); } }} /><div className="flex items-center justify-between gap-2 px-1"><span className="text-[11px] text-ink-400">{text.length}/5000 <span className="hidden sm:inline">· Shift + Enter για νέα γραμμή</span></span><ClinicButton type="submit" variant="primary" disabled={!text.trim() || busy || reading || readFailed}>Αποστολή <span aria-hidden="true">↑</span></ClinicButton></div></div><p className="mt-2 text-center text-[10px] leading-4 text-ink-500">Το AI μπορεί να κάνει λάθη. Ελέγχετε τις απαντήσεις πριν τις χρησιμοποιήσετε.</p></form>
      </div>
    </div>
  </section>;
}
