'use client';

import { useState, useRef, useEffect, useSyncExternalStore } from 'react';
import { ClinicButton, ClinicInput, ClinicSelect, ClinicStatusBadge, ClinicLoading } from '@/components/vet/ClinicUI';
import { useWeekAppointments, useVetAvailableSlots, approveAppointment, rejectAppointment, rescheduleAppointment, updateAppointmentStatus, type VetAppointment } from '@/hooks/useVetData';
import CreateAppointmentDialog from '@/components/vet/CreateAppointmentDialog';
import ExaminationDialog from '@/components/vet/ExaminationDialog';

import ClinicAvatar from '@/components/vet/ClinicAvatar';
import ScheduleTimeline from '@/components/vet/ScheduleTimeline';

const subscribeMobile = (callback: () => void) => { const media = window.matchMedia('(max-width: 767px)'); media.addEventListener('change', callback); return () => media.removeEventListener('change', callback); };
const dark = 'border-clinic-700! bg-clinic-600! text-white! hover:bg-clinic-700!';
const labels: Record<string, string> = { confirmed: 'Επιβεβαιωμένο', pending: 'Αναμονή', completed: 'Ολοκληρωμένο', cancelled: 'Ακυρωμένο', rejected: 'Απορρίφθηκε' };
function iso(d: Date) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function monday(d: Date) { const v = new Date(d); v.setDate(v.getDate() - (v.getDay()+6)%7); v.setHours(0,0,0,0); return v; }
function time(d: string) { return new Date(d).toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }); }

// A keyed form keeps availability and unsaved choices isolated to one appointment/date.
function SlotField({ appointment, date, busy, onSave }: { appointment: VetAppointment; date: string; busy: boolean; onSave: (value: string) => void }) {
  const { slots, loading, error } = useVetAvailableSlots(appointment.vet_id, date, appointment.duration_minutes, appointment.id);
  const [slot, setSlot] = useState('');
  return <><label className="block text-xs font-medium">Διαθέσιμη ώρα<ClinicSelect aria-label="Διαθέσιμη ώρα" className="mt-2 w-full" value={slot} disabled={busy || loading} onChange={e => setSlot(e.target.value)}><option value="">Επιλογή ώρας</option>{slots.map(s => <option key={s}>{s}</option>)}</ClinicSelect></label>{loading && <p role="status" className="text-xs text-ink-500">Αναζήτηση διαθεσιμότητας…</p>}{error && <p role="alert" className="text-sm text-red-700">{error}</p>}{!loading && !error && !slots.length && <p className="text-xs text-ink-500">Δεν υπάρχουν διαθέσιμες ώρες για αυτή την ημέρα.</p>}<ClinicButton className={`${dark} w-full`} disabled={busy || loading || !!error || !slots.includes(slot)} onClick={() => onSave(`${date}T${slot}:00`)}>{busy ? 'Αποθήκευση…' : 'Αποθήκευση αλλαγής'}</ClinicButton></>;
}

function AppointmentPanel({ appointment: a, onClose, onChanged, onExamine }: { appointment: VetAppointment; onClose: () => void; onChanged: (message: string, moved?: string) => void; onExamine: () => void }) {
  const [mode, setMode] = useState<'details'|'edit'|'cancel'|'reject'>('details');
  const [date, setDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function run(action: () => Promise<unknown>, message: string, moved?: string) {
    if (busy) return;
    setBusy(true); setError('');
    try { await action(); onChanged(message, moved); }
    catch (e) { setError(e instanceof Error ? e.message : 'Δεν ολοκληρώθηκε η ενέργεια. Δοκιμάστε ξανά.'); }
    finally { setBusy(false); }
  }
  return <section className="overflow-hidden rounded-xl border border-ink-200 bg-white shadow-xs" aria-label="Λεπτομέρειες ραντεβού">
    <div className="flex items-center justify-between border-b border-ink-200 p-5"><h2 className="font-semibold">{mode === 'edit' ? 'Αναπρογραμματισμός' : 'Ραντεβού'}</h2><ClinicButton variant="ghost" disabled={busy} aria-label="Κλείσιμο ραντεβού" onClick={onClose}>×</ClinicButton></div>
    <div className="space-y-5 p-5"><ClinicStatusBadge status={a.status}>{labels[a.status] || a.status}</ClinicStatusBadge><div className="flex items-center gap-3"><ClinicAvatar large name={a.pet?.name || 'Ασθενής'} imageUrl={a.pet?.image_url} /><div><h3 className="text-xl font-semibold">{a.pet?.name || 'Ασθενής'}</h3><p className="mt-1 text-xs text-ink-500">{[a.pet?.breed, a.pet?.type].filter(Boolean).join(' · ')}</p></div></div><div><p className="font-medium">{a.pet_owner?.name}</p>{a.pet_owner?.phone && <a className="text-xs text-ink-500 underline" href={`tel:${a.pet_owner.phone}`}>{a.pet_owner.phone}</a>}</div><div className="border-y border-ink-200 py-4"><p className="font-medium">{a.type}</p><p className="mt-2 text-sm text-ink-500">{new Date(a.scheduled_at).toLocaleDateString('el-GR', { weekday: 'short', day: 'numeric', month: 'long' })} · {time(a.scheduled_at)}</p><p className="mt-1 text-xs text-ink-500">Διάρκεια {a.duration_minutes} λεπτά</p></div>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {mode === 'edit' ? <div className="space-y-4"><p className="text-xs leading-5 text-ink-500">Άλλαξε ημέρα και ώρα. Ο ασθενής, η υπηρεσία και η διάρκεια διατηρούνται.</p><label className="block text-xs font-medium">Νέα ημερομηνία<ClinicInput aria-label="Νέα ημερομηνία" type="date" min={iso(new Date())} value={date} disabled={busy} onChange={e => setDate(e.target.value)} className="mt-2 w-full" /></label>{date && date >= iso(new Date()) && <SlotField key={date} appointment={a} date={date} busy={busy} onSave={value => run(() => rescheduleAppointment(a.id, value), 'Το ραντεβού μεταφέρθηκε.', value)} />}<ClinicButton disabled={busy} onClick={() => { setMode('details'); setError(''); }}>Πίσω</ClinicButton></div>
    : mode === 'cancel' || mode === 'reject' ? <div className="space-y-3"><p className="text-sm">{mode === 'cancel' ? 'Να ακυρωθεί αυτό το ραντεβού;' : 'Να απορριφθεί αυτό το αίτημα;'}</p><div className="flex gap-2"><ClinicButton disabled={busy} onClick={() => setMode('details')}>Πίσω</ClinicButton><ClinicButton variant="danger" disabled={busy} onClick={() => run(() => mode === 'cancel' ? updateAppointmentStatus(a.id, 'cancelled') : rejectAppointment(a.id), mode === 'cancel' ? 'Το ραντεβού ακυρώθηκε.' : 'Το αίτημα απορρίφθηκε.')}>{busy ? 'Αποθήκευση…' : 'Επιβεβαίωση'}</ClinicButton></div></div>
    : <><div><h4 className="mb-2 text-xs font-semibold">Σημειώσεις ραντεβού</h4><p className="whitespace-pre-wrap text-sm leading-6 text-ink-500">{a.notes || 'Δεν υπάρχουν σημειώσεις.'}</p></div><div className="flex flex-wrap gap-2 border-t border-ink-200 pt-4">{a.status === 'pending' && <><ClinicButton className={dark} disabled={busy} onClick={() => run(() => approveAppointment(a.id), 'Το ραντεβού εγκρίθηκε.')}>Έγκριση</ClinicButton><ClinicButton variant="danger" disabled={busy} onClick={() => setMode('reject')}>Απόρριψη</ClinicButton></>}{a.status === 'confirmed' && <><ClinicButton className={`${dark} w-full`} disabled={busy} onClick={onExamine}>Καταγραφή εξέτασης</ClinicButton><ClinicButton disabled={busy} onClick={() => setMode('edit')}>Αναπρογραμματισμός</ClinicButton><ClinicButton variant="danger" disabled={busy} onClick={() => setMode('cancel')}>Ακύρωση</ClinicButton></>}</div></>}
    </div>
  </section>;
}

function MoveConfirmation({ appointment, target, onClose, onSaved }: { appointment: VetAppointment; target: string; onClose: () => void; onSaved: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const { slots, loading, error: availabilityError } = useVetAvailableSlots(appointment.vet_id, target.slice(0,10), appointment.duration_minutes, appointment.id);
  const available = slots.includes(target.slice(11,16));
  useEffect(() => { dialog.current?.showModal(); }, []);
  const label = (value: string) => new Date(value).toLocaleString('el-GR', {day:'numeric',month:'long',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
  return <dialog ref={dialog} onCancel={e => { e.preventDefault(); if(!busy)onClose(); }} aria-labelledby="move-title" className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-md overflow-auto rounded-xl border border-ink-200 bg-white p-5 text-ink-900 shadow-xl backdrop:bg-black/40">
    <h2 id="move-title" className="text-base font-semibold">Επιβεβαίωση μεταφοράς</h2><p className="mt-2 text-sm">{appointment.pet?.name} · {appointment.type} · {appointment.duration_minutes} λεπτά</p><dl className="my-4 space-y-3 rounded-lg bg-clinic-50 p-4 text-sm"><div><dt className="text-xs text-ink-500">Από</dt><dd>{label(appointment.scheduled_at)}</dd></div><div><dt className="text-xs text-ink-500">Σε</dt><dd className="font-semibold">{label(target)}</dd></div></dl>
    {appointment.group_id && <p className="mb-3 text-sm">Η αλλαγή εφαρμόζεται σύμφωνα με τους κανόνες της ομαδικής επίσκεψης.</p>}
    {loading ? <p role="status" className="mb-3 text-sm">Έλεγχος διαθέσιμης ώρας…</p> : (availabilityError || !available) && <p role="alert" className="mb-3 text-sm text-red-700">{availabilityError || 'Η ώρα δεν είναι διαθέσιμη για αυτή τη διάρκεια. Επιλέξτε άλλη ώρα.'}</p>}
    {error && <p role="alert" className="mb-3 text-sm text-red-700">{error}</p>}
    <div className="flex flex-wrap gap-2"><ClinicButton disabled={busy} onClick={onClose}>Ακύρωση μεταφοράς</ClinicButton><ClinicButton variant="primary" disabled={busy || loading || !!availabilityError || !available} onClick={async () => { if(lock.current)return;lock.current=true;setBusy(true);setError('');try { await rescheduleAppointment(appointment.id,target);onSaved(); } catch(e) {setError(e instanceof Error?e.message:'Η μεταφορά δεν ολοκληρώθηκε.');} finally {lock.current=false;setBusy(false);} }}>{busy?'Αποθήκευση…':'Επιβεβαίωση μεταφοράς'}</ClinicButton></div>
  </dialog>;
}

export default function VetSchedulePage() {
  const [anchor, setAnchor] = useState(() => new Date());
  const [preferredView, setView] = useState<'week'|'day'>('week');
  const mobile = useSyncExternalStore(subscribeMobile, () => window.matchMedia('(max-width: 767px)').matches, () => false);
  const view = mobile ? 'day' : preferredView;
  const [filter, setFilter] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createAt, setCreateAt] = useState<{date:string;time:string}|null>(null);
  const [move, setMove] = useState<{appointment:VetAppointment;target:string}|null>(null);
  const [exam, setExam] = useState<VetAppointment | null>(null);
  const [message, setMessage] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);
  const start = monday(anchor);
  const { appointments, loading, error, refetch } = useWeekAppointments(iso(start));
  const selected = appointments.find(a => a.id === selectedId);
  const dates = view === 'day' ? [anchor] : Array.from({length:7}, (_, i) => { const d = new Date(start); d.setDate(d.getDate()+i); return d; });
  const dateKeys = dates.map(iso);
  const visible = appointments.filter(a => dateKeys.includes(iso(new Date(a.scheduled_at))) && (filter === 'all' || a.status === filter));
  const todayAppointments = appointments.filter(a => iso(new Date(a.scheduled_at)) === iso(new Date()));

  useEffect(() => { if (selectedId || creating) { panelRef.current?.focus({ preventScroll: true }); if (window.innerWidth < 1280) panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }, [selectedId, creating]);
  function navigate(delta: number) { const d = new Date(anchor); d.setDate(d.getDate()+delta); setAnchor(d); setSelectedId(null); setCreating(false); setExam(null); }
  function changed(text: string, moved?: string) { setMessage(text); setSelectedId(null); if (moved) setAnchor(new Date(moved)); void refetch(); }
  return <div className="-mx-1 text-sm sm:-mx-3">
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><p className="mb-1 text-xs text-ink-500">ΗΜΕΡΟΛΟΓΙΟ ΚΤΗΝΙΑΤΡΕΙΟΥ</p><h1 className="text-xl font-semibold tracking-tight">Πρόγραμμα</h1></div><ClinicButton className={dark} onClick={() => { setCreateAt(null); setCreating(true); setSelectedId(null); setExam(null); setMessage(''); }}>+ Νέο Ραντεβού</ClinicButton></div>
    <div className="mb-4 flex flex-wrap gap-x-6 gap-y-2 rounded-xl border border-ink-200 bg-white px-4 py-3 text-xs text-ink-500"><strong className="text-ink-900">{anchor.toLocaleDateString('el-GR', { weekday: 'long', day: 'numeric', month: 'long' })}</strong><span>{loading ? '…' : visible.length} ραντεβού στην προβολή</span>{iso(start) === iso(monday(new Date())) && <span>{loading ? '…' : todayAppointments.filter(a => a.status === 'pending').length} αιτήματα σήμερα</span>}</div>
    {message && <p role="status" className="mb-4 rounded-lg border border-clinic-200 bg-clinic-50 p-3">{message}</p>}
    <div className={`grid items-start gap-4 ${selected || creating ? 'xl:grid-cols-[minmax(0,1fr)_360px]' : ''}`}>
      <section aria-label="Ημερολόγιο ραντεβού" className="order-2 min-w-0 overflow-hidden rounded-xl xl:order-1 border border-ink-200 bg-white shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-200 p-4"><h2 className="font-semibold">{dates[0].toLocaleDateString('el-GR', {day:'numeric',month:'short'})}{view === 'week' ? ` – ${dates[6].toLocaleDateString('el-GR', {day:'numeric',month:'short'})}` : ''} {anchor.getFullYear()}</h2><div className="flex flex-wrap gap-1"><ClinicButton aria-label="Προηγούμενη περίοδος" onClick={() => navigate(view === 'week' ? -7 : -1)}>←</ClinicButton><ClinicButton onClick={() => { setAnchor(new Date()); setSelectedId(null); }}>Σήμερα</ClinicButton><ClinicButton aria-label="Επόμενη περίοδος" onClick={() => navigate(view === 'week' ? 7 : 1)}>→</ClinicButton></div></div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-200 px-4 py-2"><ClinicSelect aria-label="Κατάσταση ραντεβού" value={filter} onChange={e => { setFilter(e.target.value); setSelectedId(null); setCreating(false); setExam(null); }}><option value="all">Όλα τα ραντεβού</option>{Object.entries(labels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</ClinicSelect><label className="flex items-center gap-2 text-xs text-ink-500">Μετάβαση<ClinicInput aria-label="Μετάβαση σε ημερομηνία" type="date" value={iso(anchor)} onChange={e => { if(e.target.value) { setAnchor(new Date(`${e.target.value}T12:00:00`)); setSelectedId(null); setCreating(false); setExam(null); } }} /></label><div className="flex rounded-lg bg-ink-100 p-1">{(mobile ? ['day'] as const : ['week','day'] as const).map(value => <button key={value} aria-pressed={view === value} onClick={() => setView(value)} className={`rounded-md px-3 py-1.5 text-xs ${view === value ? 'bg-white font-semibold shadow-xs' : 'text-ink-500'}`}>{value === 'week' ? 'Εβδομάδα' : 'Ημέρα'}</button>)}</div></div>
        {loading ? <ClinicLoading /> : error ? <div role="alert" className="p-6 text-red-700">{error}<ClinicButton className="ml-3" onClick={refetch}>Δοκιμή ξανά</ClinicButton></div> : <><ScheduleTimeline onCreate={(date,time) => {setCreateAt({date,time});setCreating(true);setSelectedId(null);setExam(null);}} onMove={(appointment,date,time) => {const target=`${date}T${time}:00`;if(new Date(target).getTime()!==new Date(appointment.scheduled_at).getTime())setMove({appointment,target});}} dates={dates} appointments={visible} selectedId={selectedId} onSelect={a => { setSelectedId(a.id); setCreating(false); setExam(null); setMessage(''); }} onDay={d => { setAnchor(d); setView('day'); setSelectedId(null); }} /><p className="border-t border-ink-200 px-4 py-3 text-xs text-ink-500">{!visible.length ? 'Δεν υπάρχουν ραντεβού σε αυτή την προβολή.' : 'Επίλεξε ραντεβού για λεπτομέρειες. Τα ταυτόχρονα ραντεβού εμφανίζονται δίπλα δίπλα.'}</p></>}
      </section>
      {(selected || creating) && <div ref={panelRef} tabIndex={-1} className="order-1 min-w-0 scroll-mt-20 outline-none xl:order-2 xl:sticky xl:top-20 xl:max-h-[calc(100dvh-6rem)] xl:overflow-y-auto">{exam ? <ExaminationDialog embedded key={exam.id} appointment={exam} onClose={() => setExam(null)} onSuccess={() => { setExam(null); changed('Η εξέταση καταγράφηκε.'); }} /> : creating ? <CreateAppointmentDialog key={createAt ? `${createAt.date}-${createAt.time}` : 'new'} initialDate={createAt?.date} initialTime={createAt?.time} embedded open onClose={() => setCreating(false)} onSuccess={() => { setCreating(false); setMessage('Το ραντεβού δημιουργήθηκε.'); void refetch(); }} /> : selected && !loading && <AppointmentPanel key={selected.id} appointment={selected} onClose={() => setSelectedId(null)} onChanged={changed} onExamine={() => setExam(selected)} />}</div>}
    </div>
    {move && <MoveConfirmation key={`${move.appointment.id}-${move.target}`} appointment={move.appointment} target={move.target} onClose={() => setMove(null)} onSaved={() => { setMove(null); changed('Το ραντεβού μεταφέρθηκε.',move.target); }} />}
  </div>;
}
