'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useVetProfile, useServiceTypes, type VetAppointment } from '@/hooks/useVetData';
import { ClinicButton, ClinicPanel, ClinicPageHeader, ClinicLoading, ClinicStatusBadge } from './ClinicUI';
import ClinicAvatar from './ClinicAvatar';
import CreateAppointmentDialog from './CreateAppointmentDialog';
import ExaminationDialog from './ExaminationDialog';

type Overview = {
  date: string; next_appointment: VetAppointment | null;
  today_confirmed: number; today_completed: number; pending_total: number;
  pending_today: number; earlier_today: number;
  today_items: VetAppointment[]; pending_items: VetAppointment[];
};
const linkStyle = 'text-xs font-medium text-clinic-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-clinic-600';
const buttonStyle = 'inline-flex min-h-9 items-center justify-center rounded-lg border border-ink-200 bg-white px-3 py-2 text-xs font-medium hover:bg-ink-50';
// The booking API uses Athens wall time without an offset. Preserve that clock.
function clock(value: string) { return value.slice(11, 16); }
function day(value: string) { return new Intl.DateTimeFormat('el-GR', { day: 'numeric', month: 'long' }).format(new Date(`${value.slice(0, 10)}T12:00:00`)); }
function appointmentLink(apt: VetAppointment) { return `/vet/${apt.status === 'pending' ? 'pending' : 'appointments'}?appointmentId=${encodeURIComponent(apt.id)}`; }

export default function ClinicHome() {
  const profileQuery = useVetProfile();
  const services = useServiceTypes();
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [exam, setExam] = useState<VetAppointment | null>(null);
  const version = useRef(0);
  const refresh = useCallback(async () => {
    const request = ++version.current;
    try {
      const result = await api.get<Overview>('/vet/dashboard/home');
      if (request === version.current) { setData(result); setError(false); }
    } catch { if (request === version.current) setError(true); }
    finally { if (request === version.current) setLoading(false); }
  }, []);
  useEffect(() => {
    void refresh();
    const update = () => { if (document.visibilityState === 'visible') void refresh(); };
    const timer = window.setInterval(update, 60_000);
    window.addEventListener('focus', update);
    document.addEventListener('visibilitychange', update);
    window.addEventListener('vetly:pending-updated', update);
    return () => {
      version.current++;
      clearInterval(timer);
      window.removeEventListener('focus', update);
      document.removeEventListener('visibilitychange', update);
      window.removeEventListener('vetly:pending-updated', update);
    };
  }, [refresh]);
  const profile = profileQuery.profile;
  const setup = profile ? [
    { done: Boolean(profile.description?.trim() && profile.image_url), label: 'Φωτογραφία και περιγραφή', href: '/vet/settings' },
    { done: Boolean(profile.address?.trim() && profile.city?.trim()), label: 'Διεύθυνση κτηνιατρείου', href: '/vet/settings' },
    { done: Object.values(profile.hours || {}).some(d => !d.closed && Boolean(d.morning?.open && d.morning?.close || d.afternoon?.open && d.afternoon?.close)), label: 'Ωράριο λειτουργίας', href: '/vet/settings#working-hours' },
    ...(!services.loading && !services.error ? [{ done: services.total > 0, label: 'Υπηρεσίες και τιμές', href: '/vet/services' }] : []),
  ] : [];
  const incomplete = setup.filter(item => !item.done);
  const next = data?.next_appointment;

  function row(apt: VetAppointment) {
    return <Link key={apt.id} href={appointmentLink(apt)} className="flex min-w-0 items-center gap-3 border-b border-ink-100 px-4 py-4 last:border-0 hover:bg-ink-50 focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-clinic-600 sm:px-5">
      <time className="w-11 shrink-0 text-sm font-semibold tabular-nums text-ink-900">{clock(apt.scheduled_at)}</time>
      <ClinicAvatar name={apt.pet?.name || 'Ασθενής'} imageUrl={apt.pet?.image_url} />
      <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-ink-900">{apt.pet?.name || 'Ασθενής'} <span className="font-normal text-ink-500">· {apt.type}</span></p><p className="mt-1 truncate text-xs text-ink-500">{apt.pet_owner?.name || 'Κηδεμόνας'} · {apt.duration_minutes} λεπτά</p></div>
      <span className="text-clinic-700" aria-hidden="true">→</span>
    </Link>;
  }

  return <div className="mx-auto max-w-[1280px] px-4 py-6 text-ink-800 sm:px-8">
    <ClinicPageHeader title="Αρχική" description={`${profile?.name || 'Το κτηνιατρείο σου'}${data ? ` · ${day(data.date)}` : ''}`} actions={<div className="flex flex-wrap gap-2"><Link className={buttonStyle} href="/vet/schedule">Ημερολόγιο</Link><ClinicButton variant="primary" onClick={() => setShowCreate(true)}>+ Νέο ραντεβού</ClinicButton></div>} />
    {error && <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm">Δεν ανανεώθηκε η εικόνα της ημέρας. {data && 'Τα στοιχεία μπορεί να έχουν αλλάξει.'}<ClinicButton className="ml-2" onClick={() => void refresh()}>Επανάληψη</ClinicButton></div>}
    {loading ? <ClinicLoading label="Φόρτωση ημέρας…" /> : data && <>
      <ClinicPanel className="mb-5 grid grid-cols-2 overflow-hidden sm:grid-cols-4">
        {[
          { label: 'Επιβεβαιωμένα σήμερα', value: data.today_confirmed, href: '/vet/schedule' },
          { label: 'Ολοκληρώθηκαν σήμερα', value: data.today_completed, href: '/vet/appointments' },
          { label: 'Αιτήματα για σήμερα', value: data.pending_today, href: '/vet/pending' },
          { label: 'Αιτήματα συνολικά', value: data.pending_total, href: '/vet/pending' },
        ].map(item => <Link key={item.label} href={item.href} className="min-w-0 border-b border-r border-ink-100 p-4 hover:bg-ink-50 sm:border-b-0 sm:p-5"><span className="block text-xs leading-5 text-ink-500">{item.label}</span><strong className="mt-2 block text-2xl font-semibold tabular-nums text-ink-900">{item.value}</strong></Link>)}
      </ClinicPanel>
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]">
        <div className="min-w-0 space-y-5">
          <ClinicPanel className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-100 px-5 py-3"><h2 className="text-sm font-semibold">Επόμενο ραντεβού</h2>{next && <ClinicStatusBadge status="confirmed">Επιβεβαιωμένο</ClinicStatusBadge>}</div>
            {next ? <div className="p-5">
              <div className="mb-5 flex flex-wrap items-baseline gap-x-3 gap-y-1"><time className="text-3xl font-semibold tracking-tight text-clinic-800">{clock(next.scheduled_at)}</time><p className="text-sm text-ink-500">{next.scheduled_at.slice(0, 10) === data.date ? 'Σήμερα' : day(next.scheduled_at)} · {next.duration_minutes} λεπτά</p></div>
              <div className="flex min-w-0 items-center gap-3"><ClinicAvatar large name={next.pet?.name || 'Ασθενής'} imageUrl={next.pet?.image_url} /><div className="min-w-0"><h3 className="break-words text-lg font-semibold text-ink-900">{next.pet?.name || 'Ασθενής'}</h3><p className="mt-1 break-words text-sm text-ink-600">{next.type} · {next.pet_owner?.name}</p></div></div>
              {next.notes && <p className="mt-4 line-clamp-3 break-words rounded-lg bg-ink-50 px-3 py-2 text-xs leading-5 text-ink-600">{next.notes}</p>}
              <div className="mt-5 flex flex-wrap gap-2"><Link href={appointmentLink(next)} className={`${buttonStyle} !border-clinic-700 !bg-clinic-600 !text-white`}>Άνοιγμα ραντεβού</Link><ClinicButton onClick={() => setExam(next)}>Καταχώριση εξέτασης</ClinicButton></div>
            </div> : <div className="p-5"><p className="text-sm font-medium">Δεν υπάρχει επόμενο επιβεβαιωμένο ραντεβού.</p><p className="mt-2 text-xs leading-5 text-ink-500">Τα νέα αιτήματα εμφανίζονται ξεχωριστά, μέχρι να τα εγκρίνεις.</p></div>}
          </ClinicPanel>
          <ClinicPanel className="overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-100 px-5 py-4"><h2 className="text-sm font-semibold">Σήμερα στο κτηνιατρείο</h2><Link href="/vet/schedule" className={linkStyle}>Όλο το ημερολόγιο →</Link></div>
            <p className="border-b border-ink-100 px-5 py-3 text-xs text-ink-500">Επιβεβαιωμένες επισκέψεις · κατά ώρα</p>
            {data.today_items.length ? data.today_items.map(row) : <p className="p-5 text-sm text-ink-500">Δεν απομένουν επιβεβαιωμένες επισκέψεις για σήμερα.</p>}
            {data.today_confirmed > data.today_items.length && <p className="border-t border-ink-100 px-5 py-3 text-xs text-ink-500">Προβολή {data.today_items.length} από {data.today_confirmed} · <Link href="/vet/schedule" className={linkStyle}>Δες όλες</Link></p>}
          </ClinicPanel>
        </div>
        <div className="min-w-0 space-y-5">
          <ClinicPanel className="overflow-hidden"><div className="border-b border-ink-100 px-5 py-4"><h2 className="text-sm font-semibold">Χρειάζονται ενέργεια</h2></div>
            {data.pending_total > 0 && <Link href="/vet/pending" className="block border-b border-ink-100 p-5 hover:bg-ink-50"><p className="text-sm font-semibold text-clinic-800">{data.pending_total} αιτήματα προς έγκριση →</p><p className="mt-1 text-xs leading-5 text-ink-500">Έλεγξε τη διαθεσιμότητα και απάντησε στους κηδεμόνες.</p></Link>}
            {data.earlier_today > 0 && <Link href="/vet/schedule" className="block border-b border-ink-100 p-5 hover:bg-ink-50"><p className="text-sm font-semibold">{data.earlier_today} σημερινές επισκέψεις για έλεγχο →</p><p className="mt-1 text-xs leading-5 text-ink-500">Η ώρα έναρξης πέρασε και παραμένουν επιβεβαιωμένες. Έλεγξε αν χρειάζεται καταχώριση εξέτασης ή αλλαγή κατάστασης.</p></Link>}
            {data.pending_total === 0 && data.earlier_today === 0 && <p className="p-5 text-sm leading-6 text-ink-500">Δεν υπάρχουν αιτήματα ή σημερινές επισκέψεις που χρειάζονται έλεγχο κατάστασης.</p>}
          </ClinicPanel>
          <ClinicPanel className="overflow-hidden"><div className="border-b border-ink-100 px-5 py-4"><h2 className="text-sm font-semibold">Αιτήματα για σήμερα <span className="ml-1 text-ink-400">{data.pending_today}</span></h2><p className="mt-1 text-xs leading-5 text-ink-500">Αναμένουν έγκριση για επίσκεψη σήμερα.</p></div>
            {data.pending_items.length ? data.pending_items.map(row) : <p className="p-5 text-sm text-ink-500">Δεν υπάρχουν εκκρεμή αιτήματα για σήμερα.</p>}
            <div className="border-t border-ink-100 px-5 py-3"><Link className={linkStyle} href="/vet/pending">Όλα τα αιτήματα{data.pending_today > data.pending_items.length ? ` · ${data.pending_today - data.pending_items.length} ακόμη για σήμερα` : ''} →</Link></div>
          </ClinicPanel>
          {!profileQuery.loading && !profileQuery.error && incomplete.length > 0 && <ClinicPanel className="p-4"><details><summary className="cursor-pointer text-sm font-medium">Ολοκλήρωση προφίλ · {incomplete.length} βήματα</summary><div className="mt-3 space-y-1">{incomplete.map(item => <Link key={item.label} href={item.href} className="block rounded-lg px-2 py-2 text-xs text-clinic-700 hover:bg-clinic-50">{item.label} →</Link>)}</div></details></ClinicPanel>}
        </div>
      </div>
    </>}
    <CreateAppointmentDialog open={showCreate} onClose={() => setShowCreate(false)} onSuccess={() => { setShowCreate(false); void refresh(); }} />
    {exam && <ExaminationDialog appointment={exam} onClose={() => setExam(null)} onSuccess={() => { setExam(null); void refresh(); }} />}
  </div>;
}

