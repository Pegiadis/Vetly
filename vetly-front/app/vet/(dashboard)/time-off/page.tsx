'use client';

import { greekDay } from '@/lib/dates';
import { useState } from 'react';
import Link from 'next/link';
import { ClinicButton, ClinicInput, ClinicLoading, ClinicPageHeader, ClinicPanel, ClinicEmptyState } from '@/components/vet/ClinicUI';
import { useVetTimeOff, createVetTimeOff, deleteVetTimeOff, type VetTimeOff, type TimeOffAffectedAppointment } from '@/hooks/useVetData';

const day = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString('el-GR', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
const hhmm = (value: string | null) => (value ? value.slice(0, 5) : '');
const when = (value: string) => new Date(value).toLocaleString('el-GR', { weekday: 'short', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

function describe(item: VetTimeOff) {
  const range = item.start_date === item.end_date ? day(item.start_date) : `${day(item.start_date)} – ${day(item.end_date)}`;
  const hours = item.start_time && item.end_time ? ` · ${hhmm(item.start_time)}–${hhmm(item.end_time)} κάθε ημέρα` : ' · Όλη την ημέρα';
  return `${range}${hours}`;
}

export default function VetTimeOffPage() {
  const { items, loading, error, refetch } = useVetTimeOff();
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [partial, setPartial] = useState(false);
  const [from, setFrom] = useState('13:00');
  const [to, setTo] = useState('15:00');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const [affected, setAffected] = useState<TimeOffAffectedAppointment[] | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setFormError(''); setAffected(null);
    if (!start) return setFormError('Επίλεξε ημερομηνία έναρξης.');
    const last = end || start;
    if (last < start) return setFormError('Η ημερομηνία λήξης δεν μπορεί να είναι πριν την έναρξη.');
    if (partial && to <= from) return setFormError('Η ώρα λήξης πρέπει να είναι μετά την ώρα έναρξης.');
    setBusy(true);
    try {
      const created = await createVetTimeOff({ start_date: start, end_date: last, start_time: partial ? `${from}:00` : null, end_time: partial ? `${to}:00` : null, reason: reason.trim() || null });
      setAffected(created.affected_appointments);
      setStart(''); setEnd(''); setReason(''); setPartial(false);
      await refetch();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Δεν αποθηκεύτηκε. Δοκίμασε ξανά.');
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (removing) return;
    setRemoving(id); setRemoveError('');
    try { await deleteVetTimeOff(id); await refetch(); }
    catch (err) { setRemoveError(err instanceof Error ? err.message : 'Δεν διαγράφηκε. Δοκίμασε ξανά.'); }
    finally { setRemoving(null); }
  }

  return <div className="mx-auto max-w-3xl space-y-5 text-sm text-ink-800">
    <ClinicPageHeader title="Άδειες και κλεισίματα" description="Ημέρες ή ώρες που το ιατρείο δεν δέχεται ραντεβού. Οι ιδιοκτήτες δεν μπορούν να κλείσουν ραντεβού σε αυτές." actions={<Link href="/vet/schedule" className="inline-flex min-h-8 items-center rounded-[10px] bg-black/[0.06] px-3 text-[13px] font-medium text-ink-900 hover:bg-black/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clinic-600">← Πρόγραμμα</Link>} />
    <ClinicPanel className="p-5">
      <h2 className="text-sm font-semibold">Νέο κλείσιμο</h2>
      <form onSubmit={submit} className="mt-4 space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-medium">Από<ClinicInput type="date" min={today()} value={start} onChange={e => { setStart(e.target.value); if (end && e.target.value > end) setEnd(''); }} disabled={busy} className="mt-2 w-full" required /></label>
          <label className="block text-xs font-medium">Έως (προαιρετικά, αλλιώς μία ημέρα)<ClinicInput type="date" min={start || today()} value={end} onChange={e => setEnd(e.target.value)} disabled={busy} className="mt-2 w-full" /></label>
        </div>
        {start && <p role="status" className="rounded-[10px] bg-ink-50 px-3 py-2 text-xs text-ink-700">{end && end !== start ? <>Κλειστά από <strong>{greekDay(start)}</strong> έως <strong>{greekDay(end)}</strong>.</> : <>Κλειστά: <strong>{greekDay(start)}</strong>.</>}</p>}
        <label className="flex items-center gap-2 text-xs font-medium"><input type="checkbox" checked={partial} onChange={e => setPartial(e.target.checked)} disabled={busy} className="h-4 w-4 accent-clinic-600" />Μόνο συγκεκριμένες ώρες (κάθε ημέρα της περιόδου)</label>
        {partial && <div className="grid gap-3 sm:grid-cols-2"><label className="block text-xs font-medium">Από ώρα<ClinicInput type="time" step={900} value={from} onChange={e => setFrom(e.target.value)} disabled={busy} className="mt-2 w-full" /></label><label className="block text-xs font-medium">Έως ώρα<ClinicInput type="time" step={900} value={to} onChange={e => setTo(e.target.value)} disabled={busy} className="mt-2 w-full" /></label></div>}
        <label className="block text-xs font-medium">Αιτιολογία (προαιρετικά, φαίνεται μόνο σε εσένα)<ClinicInput maxLength={255} value={reason} onChange={e => setReason(e.target.value)} disabled={busy} placeholder="π.χ. Διακοπές, σεμινάριο" className="mt-2 w-full" /></label>
        {formError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{formError}</p>}
        <ClinicButton type="submit" variant="primary" disabled={busy}>{busy ? 'Αποθήκευση…' : 'Αποθήκευση κλεισίματος'}</ClinicButton>
      </form>
    </ClinicPanel>
    {affected && (affected.length ? <div role="status" className="rounded-xl border border-[#f6c9a3] bg-[#ffe0c7] p-4 text-[#622700]"><p className="font-semibold">Το κλείσιμο αποθηκεύτηκε, αλλά υπάρχουν {affected.length} ραντεβού σε αυτό το διάστημα.</p><p className="mt-1 text-xs">Δεν ακυρώθηκαν αυτόματα. Επικοινώνησε με τους ιδιοκτήτες ή άλλαξε/ακύρωσε τα ραντεβού από το πρόγραμμα.</p><ul className="mt-3 space-y-1">{affected.map(a => <li key={a.id}>{when(a.scheduled_at)} · {a.pet_name || 'Ασθενής'}{a.owner_name ? ` (${a.owner_name})` : ''} · {a.status === 'pending' ? 'Αναμονή' : 'Επιβεβαιωμένο'}</li>)}</ul><Link href="/vet/schedule" className="mt-3 inline-block text-xs font-medium underline">Μετάβαση στο πρόγραμμα</Link></div> : <p role="status" className="rounded-lg border border-clinic-200 bg-clinic-50 p-3">Το κλείσιμο αποθηκεύτηκε. Δεν υπάρχουν ραντεβού σε αυτό το διάστημα.</p>)}
    <ClinicPanel className="overflow-hidden">
      <div className="border-b border-ink-200 px-5 py-4"><h2 className="text-sm font-semibold">Τρέχοντα και επερχόμενα</h2></div>
      {removeError && <p role="alert" className="m-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{removeError}</p>}
      {loading ? <ClinicLoading /> : error ? <div role="alert" className="p-5 text-red-700">{error}<ClinicButton className="ml-3" onClick={() => void refetch()}>Δοκιμή ξανά</ClinicButton></div> : items.length ? <ul>{items.map(item => <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 px-5 py-3 last:border-0"><div className="min-w-0"><p className="font-medium">{describe(item)}</p>{item.reason && <p className="mt-0.5 break-words text-xs text-ink-500">{item.reason}</p>}</div><ClinicButton variant="danger" disabled={removing === item.id} onClick={() => void remove(item.id)}>{removing === item.id ? 'Διαγραφή…' : 'Διαγραφή'}</ClinicButton></li>)}</ul> : <ClinicEmptyState title="Δεν υπάρχουν προγραμματισμένα κλεισίματα." description="Πρόσθεσε άδεια ή κλείσιμο από τη φόρμα παραπάνω." />}
    </ClinicPanel>
  </div>;
}
