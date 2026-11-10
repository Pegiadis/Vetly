'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useVetProfile, useVetReminders, useVetReviews, useVetReviewStats, type VetAppointment, type VetReminder } from '@/hooks/useVetData';
import { ClinicButton, ClinicPanel, ClinicLoading, ClinicStatusBadge } from './ClinicUI';
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
const buttonLink = 'inline-flex min-h-8 items-center justify-center whitespace-nowrap rounded-[10px] px-3 py-1 text-[13px] font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clinic-600';
const secondaryLink = `${buttonLink} bg-black/[0.06] text-ink-900 hover:bg-black/10`;
const primaryLink = `${buttonLink} bg-clinic-600 text-white hover:bg-clinic-700`;

// The booking API uses Athens wall time without an offset. Preserve that clock.
function clock(value: string) { return value.slice(11, 16); }
function day(value: string) { return new Intl.DateTimeFormat('el-GR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(`${value.slice(0, 10)}T12:00:00`)); }
function appointmentLink(apt: VetAppointment) { return `/vet/${apt.status === 'pending' ? 'pending' : 'appointments'}?appointmentId=${encodeURIComponent(apt.id)}`; }
/** Current Athens wall time in the API's own format, so the two compare as strings. */
function athensNow() { return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Athens', dateStyle: 'short', timeStyle: 'medium' }).format(new Date()).replace(' ', 'T'); }
function minutesOfDay(value: string) { return Number(value.slice(11, 13)) * 60 + Number(value.slice(14, 16)); }
function daysBetween(from: string, to: string) { return Math.round((Date.parse(`${to.slice(0, 10)}T12:00:00Z`) - Date.parse(`${from.slice(0, 10)}T12:00:00Z`)) / 86_400_000); }
function greeting(now: string) { const hour = Number(now.slice(11, 13)); return hour < 12 ? 'Καλημέρα' : hour < 18 ? 'Καλησπέρα' : 'Καλό βράδυ'; }
function inWords(minutes: number) {
  if (minutes < 60) return `σε ${minutes}′`;
  const rest = minutes % 60;
  return `σε ${Math.floor(minutes / 60)} ώρ.${rest ? ` ${rest}′` : ''}`;
}

function Card({ title, action, children }: { title: ReactNode; action?: ReactNode; children: ReactNode }) {
  return <ClinicPanel className="overflow-hidden">
    <div className="flex min-h-11 flex-wrap items-center justify-between gap-2 border-b border-ink-100 px-4 py-2.5"><h2 className="text-sm font-semibold text-ink-900">{title}</h2>{action}</div>
    {children}
  </ClinicPanel>;
}

function Flow({ href, tone, label, value, hint, alert = false }: { href: string; tone: string; label: string; value: number; hint: string; alert?: boolean }) {
  return <Link href={href} className={`block min-w-0 rounded-xl border border-ink-200 border-t-[3px] bg-white px-4 py-3 hover:bg-ink-50 focus-visible:outline-2 focus-visible:outline-clinic-600 ${tone}`}>
    <span className="block truncate text-xs text-ink-500">{label}</span>
    <strong className="mt-1 block text-2xl font-semibold leading-8 tabular-nums text-ink-900">{value}</strong>
    <span className={`block truncate text-xs ${alert ? 'font-medium text-[#8a3f0c]' : 'text-ink-500'}`}>{hint}</span>
  </Link>;
}

export default function ClinicHome() {
  const profileQuery = useVetProfile();
  const remindersQuery = useVetReminders(1, 20);
  const reviewStats = useVetReviewStats();
  const latestReview = useVetReviews(1, 1);
  const [data, setData] = useState<Overview | null>(null);
  const [now, setNow] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [exam, setExam] = useState<VetAppointment | null>(null);
  const version = useRef(0);
  const refresh = useCallback(async () => {
    const request = ++version.current;
    try {
      const result = await api.get<Overview>('/vet/dashboard/home');
      if (request === version.current) { setData(result); setNow(athensNow()); setError(false); }
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
  const next = data?.next_appointment;
  const today = data?.date ?? '';
  const nextIsToday = Boolean(next && next.scheduled_at.slice(0, 10) === today);

  // One list for the day: confirmed visits and today's requests, by time.
  const timeline = data ? [...data.today_items, ...data.pending_items].sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at)) : [];
  const firstUpcoming = now ? timeline.findIndex(apt => apt.scheduled_at >= now) : -1;
  const remaining = data ? Math.max(data.today_confirmed - data.earlier_today, 0) : 0;

  const reminders = remindersQuery.reminders.filter(reminder => !reminder.is_dismissed);
  const overdue = today ? reminders.filter(reminder => reminder.due_date < today) : [];
  const dueSoon = today ? reminders.filter(reminder => reminder.due_date >= today && daysBetween(today, reminder.due_date) <= 14) : [];
  const review = latestReview.reviews[0];

  function reminderChip(reminder: VetReminder) {
    const days = daysBetween(today, reminder.due_date);
    if (days < 0) return <ClinicStatusBadge status="pending">Εκπρόθεσμη</ClinicStatusBadge>;
    return <span className="whitespace-nowrap rounded-full border border-ink-200 px-2 text-xs leading-5 text-ink-600">{days === 0 ? 'Σήμερα' : days === 1 ? 'Αύριο' : `σε ${days} ημ.`}</span>;
  }

  function row(apt: VetAppointment) {
    const pending = apt.status === 'pending';
    const late = !pending && Boolean(now) && apt.scheduled_at < now!;
    const isNext = Boolean(next && next.id === apt.id);
    const tone = pending ? 'border-l-ink-200' : late ? 'border-l-[#e9690b]' : 'border-l-clinic-600';
    const name = apt.pet?.name || 'Ασθενής';
    return <div key={apt.id} className={`flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 border-b border-l-[3px] border-b-ink-100 py-2.5 pl-3 pr-4 last:border-b-0 ${tone}`}>
      <time className="w-11 shrink-0 text-sm font-semibold tabular-nums text-ink-900">{clock(apt.scheduled_at)}</time>
      <ClinicAvatar name={name} imageUrl={apt.pet?.image_url} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm"><Link href={appointmentLink(apt)} className="font-semibold text-ink-900 underline-offset-4 hover:underline">{name}</Link> <span className="text-ink-500">· {apt.type}</span></p>
        <p className="mt-0.5 truncate text-xs text-ink-500">{apt.notes ? `«${apt.notes}»` : `${apt.pet_owner?.name || 'Κηδεμόνας'} · ${apt.duration_minutes} λεπτά`}</p>
      </div>
      <div className="w-full pl-[104px] sm:w-auto sm:pl-0">{pending ? <Link href={appointmentLink(apt)} className={primaryLink}>Έλεγχος αιτήματος</Link>
        : late ? <ClinicButton onClick={() => setExam(apt)}>Καταχώριση εξέτασης</ClinicButton>
          : isNext ? <ClinicStatusBadge status="completed">Επόμενο</ClinicStatusBadge>
            : <ClinicStatusBadge status="confirmed">Επιβεβαιωμένο</ClinicStatusBadge>}</div>
    </div>;
  }

  return <div className="mx-auto max-w-[1400px] px-4 py-5 text-ink-800 sm:px-6">
    <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs text-ink-500">{data ? day(data.date) : ' '}</p>
        <h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-ink-900">{now ? greeting(now) : 'Αρχική'}{profile?.name ? `, ${profile.name}` : ''}</h1>
        {data && <p className="mt-1 text-sm text-ink-600">
          {remaining > 0 ? `${remaining === 1 ? 'Απομένει 1 επίσκεψη' : `Απομένουν ${remaining} επισκέψεις`} σήμερα.` : 'Δεν απομένουν επιβεβαιωμένες επισκέψεις σήμερα.'}
          {next && nextIsToday && ` Η επόμενη είναι ${next.pet?.name || 'ασθενής'} στις ${clock(next.scheduled_at)}.`}
        </p>}
      </div>
      <div className="flex flex-wrap gap-2"><Link className={secondaryLink} href="/vet/schedule">Ημερολόγιο</Link><ClinicButton variant="primary" onClick={() => setShowCreate(true)}>+ Νέο ραντεβού</ClinicButton></div>
    </header>

    {error && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm">Δεν ανανεώθηκε η εικόνα της ημέρας. {data && 'Τα στοιχεία μπορεί να έχουν αλλάξει.'}<ClinicButton className="ml-2" onClick={() => void refresh()}>Επανάληψη</ClinicButton></div>}

    {loading ? <ClinicLoading label="Φόρτωση ημέρας…" /> : data && <>
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Flow href="/vet/pending" tone="border-t-[#e9690b]" label="Αιτήματα προς έγκριση" value={data.pending_total} alert={data.pending_today > 0}
          hint={data.pending_today > 0 ? `${data.pending_today} για σήμερα` : data.pending_total > 0 ? 'Για επόμενες ημέρες' : 'Κανένα εκκρεμές'} />
        <Flow href="/vet/schedule" tone="border-t-clinic-600" label="Επιβεβαιωμένα σήμερα" value={data.today_confirmed} alert={data.earlier_today > 0}
          hint={data.earlier_today > 0 ? `${data.earlier_today} πέρασε η ώρα τους` : 'Όλα στην ώρα τους'} />
        <Flow href="/vet/appointments" tone="border-t-emerald-600" label="Ολοκληρώθηκαν σήμερα" value={data.today_completed}
          hint={`από ${data.today_completed + data.today_confirmed} επισκέψεις της ημέρας`} />
        <Flow href="/vet/reminders" tone="border-t-ink-400" label="Υπενθυμίσεις που λήγουν" value={overdue.length + dueSoon.length} alert={overdue.length > 0}
          hint={overdue.length > 0 ? `${overdue.length} ${overdue.length === 1 ? 'εκπρόθεσμη' : 'εκπρόθεσμες'}` : 'Στις επόμενες 14 ημέρες'} />
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-2 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,0.85fr)]">
        <div className="min-w-0 lg:col-span-2 xl:col-span-1">
          <Card title="Σήμερα στο κτηνιατρείο" action={<Link href="/vet/schedule" className={linkStyle}>Όλο το ημερολόγιο →</Link>}>
            {timeline.length === 0 && <p className="p-4 text-sm text-ink-500">Δεν υπάρχουν επιβεβαιωμένες επισκέψεις ή αιτήματα για σήμερα.</p>}
            {timeline.map((apt, index) => <div key={apt.id}>
              {index === firstUpcoming && index > 0 && now && <p className="flex items-center gap-2 bg-[#fff1e4] px-4 text-[11px] font-semibold leading-5 text-[#8a3f0c] after:h-px after:flex-1 after:bg-[#e9690b]/50">Τώρα {clock(now)}</p>}
              {row(apt)}
            </div>)}
            {data.today_confirmed > data.today_items.length && <p className="border-t border-ink-100 px-4 py-2.5 text-xs text-ink-500">Προβολή {data.today_items.length} από {data.today_confirmed} επιβεβαιωμένες · <Link href="/vet/schedule" className={linkStyle}>Δες όλες</Link></p>}
          </Card>
        </div>

        <div className="min-w-0 space-y-4">
          <Card title="Επόμενο ραντεβού" action={next && now && nextIsToday && next.scheduled_at > now ? <ClinicStatusBadge status="completed">{inWords(minutesOfDay(next.scheduled_at) - minutesOfDay(now))}</ClinicStatusBadge> : undefined}>
            {next ? <div className="p-4">
              <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1"><time className="text-3xl font-semibold leading-none tracking-tight tabular-nums text-ink-900">{clock(next.scheduled_at)}</time><p className="text-xs text-ink-500">{nextIsToday ? 'Σήμερα' : day(next.scheduled_at)} · {next.duration_minutes} λεπτά</p></div>
              <div className="mt-3 flex min-w-0 items-center gap-3"><ClinicAvatar name={next.pet?.name || 'Ασθενής'} imageUrl={next.pet?.image_url} /><div className="min-w-0"><h3 className="truncate text-[15px] font-semibold text-ink-900">{next.pet?.name || 'Ασθενής'}</h3><p className="truncate text-xs text-ink-500">{next.type} · {next.pet_owner?.name}</p></div></div>
              {next.notes && <p className="mt-3 line-clamp-3 break-words rounded-[10px] bg-ink-50 px-3 py-2 text-xs leading-5 text-ink-600">{next.notes}</p>}
              <div className="mt-4 flex flex-wrap gap-2"><Link href={appointmentLink(next)} className={primaryLink}>Άνοιγμα ραντεβού</Link><ClinicButton onClick={() => setExam(next)}>Καταχώριση εξέτασης</ClinicButton></div>
            </div> : <div className="p-4"><p className="text-sm font-medium">Δεν υπάρχει επόμενο επιβεβαιωμένο ραντεβού.</p><p className="mt-1.5 text-xs leading-5 text-ink-500">Τα νέα αιτήματα εμφανίζονται ξεχωριστά, μέχρι να τα εγκρίνεις.</p></div>}
          </Card>

          <Card title="Χρειάζονται ενέργεια">
            {data.earlier_today > 0 && <Link href="/vet/schedule" className="block border-b border-ink-100 px-4 py-3 last:border-0 hover:bg-ink-50"><p className="text-sm font-semibold text-[#8a3f0c]">{data.earlier_today === 1 ? '1 επίσκεψη χωρίς καταχώριση' : `${data.earlier_today} επισκέψεις χωρίς καταχώριση`}</p><p className="mt-0.5 text-xs leading-5 text-ink-500">Η ώρα τους πέρασε και παραμένουν επιβεβαιωμένες.</p></Link>}
            {data.pending_total > 0 && <Link href="/vet/pending" className="block border-b border-ink-100 px-4 py-3 last:border-0 hover:bg-ink-50"><p className="text-sm font-semibold text-[#8a3f0c]">{data.pending_total === 1 ? '1 αίτημα προς έγκριση' : `${data.pending_total} αιτήματα προς έγκριση`}</p><p className="mt-0.5 text-xs leading-5 text-ink-500">{data.pending_today > 0 ? `${data.pending_today === 1 ? 'Το 1 είναι' : `Τα ${data.pending_today} είναι`} για σήμερα.` : 'Έλεγξε τη διαθεσιμότητα και απάντησε στους κηδεμόνες.'}</p></Link>}
            {overdue.length > 0 && <Link href="/vet/reminders" className="block border-b border-ink-100 px-4 py-3 last:border-0 hover:bg-ink-50"><p className="text-sm font-semibold text-[#8a3f0c]">{overdue.length === 1 ? '1 εκπρόθεσμη υπενθύμιση' : `${overdue.length} εκπρόθεσμες υπενθυμίσεις`}</p><p className="mt-0.5 truncate text-xs leading-5 text-ink-500">{overdue[0].pet_name ? `${overdue[0].pet_name} · ` : ''}{overdue[0].title}</p></Link>}
            {data.pending_total === 0 && data.earlier_today === 0 && overdue.length === 0 && <p className="p-4 text-sm leading-6 text-ink-500">Δεν εκκρεμεί τίποτα αυτή τη στιγμή.</p>}
          </Card>
        </div>

        <div className="min-w-0 space-y-4">
          <Card title="Υπενθυμίσεις" action={<Link href="/vet/reminders" className={linkStyle}>Όλες →</Link>}>
            {remindersQuery.loading && reminders.length === 0 ? <p className="p-4 text-sm text-ink-500">Φόρτωση…</p>
              : remindersQuery.error ? <p className="p-4 text-sm text-ink-500">Δεν φορτώθηκαν οι υπενθυμίσεις.</p>
                : reminders.length === 0 ? <p className="p-4 text-sm text-ink-500">Δεν υπάρχουν ενεργές υπενθυμίσεις.</p>
                  : reminders.slice(0, 4).map(reminder => <div key={reminder.id} className="flex items-center justify-between gap-3 border-b border-ink-100 px-4 py-2.5 last:border-0">
                    <div className="min-w-0"><p className="truncate text-sm font-semibold text-ink-900">{reminder.pet_name || 'Ασθενής'}</p><p className="truncate text-xs text-ink-500">{reminder.title}</p></div>
                    {reminderChip(reminder)}
                  </div>)}
          </Card>

          <Card title="Αξιολογήσεις" action={<Link href="/vet/reviews" className={linkStyle}>{reviewStats.stats ? `${reviewStats.stats.total_reviews} συνολικά →` : 'Όλες →'}</Link>}>
            {reviewStats.stats && reviewStats.stats.total_reviews > 0 ? <div className="p-4">
              <p className="flex items-baseline gap-2"><strong className="text-2xl font-semibold tabular-nums text-ink-900">{reviewStats.stats.average_rating.toLocaleString('el-GR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</strong><span className="text-xs text-ink-500">μέση βαθμολογία στα 5</span></p>
              {review && <p className="mt-2 line-clamp-3 text-xs leading-5 text-ink-600">«{review.comment}»{review.pet_owner?.name ? ` — ${review.pet_owner.name}` : ''}</p>}
            </div> : <p className="p-4 text-sm text-ink-500">{reviewStats.loading ? 'Φόρτωση…' : 'Δεν υπάρχουν αξιολογήσεις ακόμα.'}</p>}
          </Card>
        </div>
      </div>
    </>}
    <CreateAppointmentDialog open={showCreate} onClose={() => setShowCreate(false)} onSuccess={() => { setShowCreate(false); void refresh(); }} />
    {exam && <ExaminationDialog appointment={exam} onClose={() => setExam(null)} onSuccess={() => { setExam(null); void refresh(); }} />}
  </div>;
}
