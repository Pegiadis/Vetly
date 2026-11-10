'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAllAppointments, useFullAnalytics, useVetProfile, useVetReminders, useVetReviewStats, type VetAppointment, type VetReminder } from '@/hooks/useVetData';
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
function nextDay(value: string) { return new Date(Date.parse(`${value.slice(0, 10)}T12:00:00Z`) + 86_400_000).toISOString().slice(0, 10); }
function minutesOfDay(value: string) { return Number(value.slice(11, 13)) * 60 + Number(value.slice(14, 16)); }
function daysBetween(from: string, to: string) { return Math.round((Date.parse(`${to.slice(0, 10)}T12:00:00Z`) - Date.parse(`${from.slice(0, 10)}T12:00:00Z`)) / 86_400_000); }
function greeting(now: string) { const hour = Number(now.slice(11, 13)); return hour < 12 ? 'Καλημέρα' : hour < 18 ? 'Καλησπέρα' : 'Καλό βράδυ'; }
function inWords(minutes: number) {
  if (minutes < 60) return `σε ${minutes}′`;
  const rest = minutes % 60;
  return `σε ${Math.floor(minutes / 60)} ώρ.${rest ? ` ${rest}′` : ''}`;
}

function Card({ title, action, children }: { title: ReactNode; action?: ReactNode; children: ReactNode }) {
  return <ClinicPanel className="flex h-full flex-col overflow-hidden">
    <div className="flex h-11 shrink-0 items-center justify-between gap-2 border-b border-ink-100 px-4"><h2 className="min-w-0 truncate text-sm font-semibold text-ink-900">{title}</h2>{action && <div className="shrink-0">{action}</div>}</div>
    <div className="flex min-h-0 flex-1 flex-col">{children}</div>
  </ClinicPanel>;
}

/** The one row shape used by every list on this page: lead, two lines of text, trailing. */
function Row({ lead, title, subtitle, trailing, href, stripe, stackTrailing = false }: { lead?: ReactNode; title: ReactNode; subtitle?: ReactNode; trailing?: ReactNode; href?: string; stripe?: string; stackTrailing?: boolean }) {
  const shape = `flex min-h-[54px] min-w-0 items-center gap-x-3 gap-y-2 border-b border-ink-100 py-2 pr-4 last:border-b-0 ${stripe ? `border-l-[3px] pl-[13px] ${stripe}` : 'pl-4'} ${stackTrailing ? 'flex-wrap' : ''}`;
  const body = <>
    {lead}
    <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-ink-900">{title}</p>{subtitle && <p className="truncate text-xs text-ink-500">{subtitle}</p>}</div>
    {trailing && <div className={stackTrailing ? 'w-full pl-[104px] sm:w-auto sm:pl-0' : 'shrink-0'}>{trailing}</div>}
  </>;
  return href
    ? <Link href={href} className={`${shape} hover:bg-ink-50 focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-clinic-600`}>{body}</Link>
    : <div className={shape}>{body}</div>;
}

function Lead({ time, name, imageUrl }: { time: string; name: string; imageUrl?: string | null }) {
  return <><time className="w-11 shrink-0 text-sm font-semibold tabular-nums text-ink-900">{time}</time><ClinicAvatar name={name} imageUrl={imageUrl} /></>;
}

function Count({ value }: { value: number }) {
  return <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#ffe0c7] text-sm font-semibold tabular-nums text-[#622700]">{value}</span>;
}

function Note({ children }: { children: ReactNode }) { return <p className="px-4 py-4 text-sm text-ink-500">{children}</p>; }
function Foot({ children }: { children: ReactNode }) { return <p className="mt-auto border-t border-ink-100 px-4 py-2.5 text-xs text-ink-500">{children}</p>; }
function Fact({ label, children }: { label: string; children: ReactNode }) {
  return <div className="flex min-h-9 items-center justify-between gap-3 border-b border-ink-100 px-4 py-1.5 text-sm last:border-b-0"><dt className="truncate text-ink-500">{label}</dt><dd className="truncate font-semibold tabular-nums text-ink-900">{children}</dd></div>;
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
  const [tomorrow] = useState(() => nextDay(athensNow()));
  const tomorrowQuery = useAllAppointments(1, 8, { dateFrom: tomorrow, dateTo: tomorrow, sort: 'asc' });
  const analyticsQuery = useFullAnalytics();
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
  const tomorrowItems = tomorrowQuery.appointments.filter(apt => apt.status === 'confirmed' || apt.status === 'pending');
  const analytics = analyticsQuery.analytics;
  const trend = analytics?.appointment_trends.items ?? [];
  const trendMax = Math.max(1, ...trend.map(item => item.count));

  function reminderBadge(reminder: VetReminder) {
    const days = daysBetween(today, reminder.due_date);
    return days < 0
      ? <ClinicStatusBadge status="pending">Εκπρόθεσμη</ClinicStatusBadge>
      : <ClinicStatusBadge status="confirmed">{days === 0 ? 'Σήμερα' : days === 1 ? 'Αύριο' : `σε ${days} ημ.`}</ClinicStatusBadge>;
  }

  function todayRow(apt: VetAppointment) {
    const pending = apt.status === 'pending';
    const late = !pending && Boolean(now) && apt.scheduled_at < now!;
    const name = apt.pet?.name || 'Ασθενής';
    return <Row key={apt.id} stackTrailing
      stripe={pending ? 'border-l-ink-200' : late ? 'border-l-[#e9690b]' : 'border-l-clinic-600'}
      lead={<Lead time={clock(apt.scheduled_at)} name={name} imageUrl={apt.pet?.image_url} />}
      title={<><Link href={appointmentLink(apt)} className="underline-offset-4 hover:underline">{name}</Link> <span className="font-normal text-ink-500">· {apt.type}</span></>}
      subtitle={apt.notes ? `«${apt.notes}»` : `${apt.pet_owner?.name || 'Κηδεμόνας'} · ${apt.duration_minutes} λεπτά`}
      trailing={pending ? <Link href={appointmentLink(apt)} className={primaryLink}>Έλεγχος αιτήματος</Link>
        : late ? <ClinicButton onClick={() => setExam(apt)}>Καταχώριση εξέτασης</ClinicButton>
          : next?.id === apt.id ? <ClinicStatusBadge status="completed">Επόμενο</ClinicStatusBadge>
            : <ClinicStatusBadge status="confirmed">Επιβεβαιωμένο</ClinicStatusBadge>} />;
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
      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Flow href="/vet/pending" tone="border-t-[#e9690b]" label="Αιτήματα προς έγκριση" value={data.pending_total} alert={data.pending_today > 0}
          hint={data.pending_today > 0 ? `${data.pending_today} για σήμερα` : data.pending_total > 0 ? 'Για επόμενες ημέρες' : 'Κανένα εκκρεμές'} />
        <Flow href="/vet/schedule" tone="border-t-clinic-600" label="Επιβεβαιωμένα σήμερα" value={data.today_confirmed} alert={data.earlier_today > 0}
          hint={data.earlier_today > 0 ? `${data.earlier_today} πέρασε η ώρα τους` : 'Όλα στην ώρα τους'} />
        <Flow href="/vet/appointments" tone="border-t-emerald-600" label="Ολοκληρώθηκαν σήμερα" value={data.today_completed}
          hint={`από ${data.today_completed + data.today_confirmed} επισκέψεις της ημέρας`} />
        <Flow href="/vet/reminders" tone="border-t-ink-400" label="Υπενθυμίσεις που λήγουν" value={overdue.length + dueSoon.length} alert={overdue.length > 0}
          hint={overdue.length > 0 ? `${overdue.length} ${overdue.length === 1 ? 'εκπρόθεσμη' : 'εκπρόθεσμες'}` : 'Στις επόμενες 14 ημέρες'} />
      </div>

      {/* Six cards on one grid: each row of cards shares a height, each list shares one row shape. */}
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <Card title="Σήμερα στο κτηνιατρείο" action={<Link href="/vet/schedule" className={linkStyle}>Ημερολόγιο →</Link>}>
          {timeline.length === 0 && <Note>Δεν υπάρχουν επιβεβαιωμένες επισκέψεις ή αιτήματα για σήμερα.</Note>}
          {timeline.map((apt, index) => <div key={apt.id} className="border-b border-ink-100 last:border-b-0 [&>div:last-child]:border-b-0">
            {index === firstUpcoming && index > 0 && now && <p className="flex items-center gap-2 bg-[#fff1e4] px-4 text-[11px] font-semibold leading-5 text-[#8a3f0c] after:h-px after:flex-1 after:bg-[#e9690b]/50">Τώρα {clock(now)}</p>}
            {todayRow(apt)}
          </div>)}
          {data.today_confirmed > data.today_items.length && <Foot>Προβολή {data.today_items.length} από {data.today_confirmed} επιβεβαιωμένες · <Link href="/vet/schedule" className={linkStyle}>Δες όλες</Link></Foot>}
        </Card>

        <Card title="Επόμενο ραντεβού" action={next && now && nextIsToday && next.scheduled_at > now ? <ClinicStatusBadge status="completed">{inWords(minutesOfDay(next.scheduled_at) - minutesOfDay(now))}</ClinicStatusBadge> : undefined}>
          {next ? <div className="flex flex-1 flex-col p-4">
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1"><time className="text-3xl font-semibold leading-none tracking-tight tabular-nums text-ink-900">{clock(next.scheduled_at)}</time><p className="text-xs text-ink-500">{nextIsToday ? 'Σήμερα' : day(next.scheduled_at)} · {next.duration_minutes} λεπτά</p></div>
            <div className="mt-4 flex min-w-0 items-center gap-3"><ClinicAvatar name={next.pet?.name || 'Ασθενής'} imageUrl={next.pet?.image_url} /><div className="min-w-0"><h3 className="truncate text-sm font-semibold text-ink-900">{next.pet?.name || 'Ασθενής'}</h3><p className="truncate text-xs text-ink-500">{next.type} · {next.pet_owner?.name}</p></div></div>
            {next.notes && <p className="mt-3 line-clamp-3 break-words rounded-[10px] bg-ink-50 px-3 py-2 text-xs leading-5 text-ink-600">{next.notes}</p>}
            <div className="mt-auto flex flex-wrap gap-2 pt-4"><Link href={appointmentLink(next)} className={primaryLink}>Άνοιγμα ραντεβού</Link><ClinicButton onClick={() => setExam(next)}>Καταχώριση εξέτασης</ClinicButton></div>
          </div> : <Note>Δεν υπάρχει επόμενο επιβεβαιωμένο ραντεβού. Τα νέα αιτήματα εμφανίζονται ξεχωριστά, μέχρι να τα εγκρίνεις.</Note>}
        </Card>

        <Card title="Χρειάζονται ενέργεια">
          {data.earlier_today > 0 && <Row href="/vet/schedule" lead={<Count value={data.earlier_today} />} title={data.earlier_today === 1 ? 'Επίσκεψη χωρίς καταχώριση' : 'Επισκέψεις χωρίς καταχώριση'} subtitle="Η ώρα τους πέρασε και μένουν επιβεβαιωμένες." trailing={<span aria-hidden="true" className="text-ink-400">→</span>} />}
          {data.pending_total > 0 && <Row href="/vet/pending" lead={<Count value={data.pending_total} />} title={data.pending_total === 1 ? 'Αίτημα προς έγκριση' : 'Αιτήματα προς έγκριση'} subtitle={data.pending_today > 0 ? `${data.pending_today === 1 ? 'Το 1 είναι' : `Τα ${data.pending_today} είναι`} για σήμερα.` : 'Για τις επόμενες ημέρες.'} trailing={<span aria-hidden="true" className="text-ink-400">→</span>} />}
          {overdue.length > 0 && <Row href="/vet/reminders" lead={<Count value={overdue.length} />} title={overdue.length === 1 ? 'Εκπρόθεσμη υπενθύμιση' : 'Εκπρόθεσμες υπενθυμίσεις'} subtitle={`${overdue[0].pet_name ? `${overdue[0].pet_name} · ` : ''}${overdue[0].title}`} trailing={<span aria-hidden="true" className="text-ink-400">→</span>} />}
          {data.pending_total === 0 && data.earlier_today === 0 && overdue.length === 0 && <Note>Δεν εκκρεμεί τίποτα αυτή τη στιγμή.</Note>}
        </Card>

        <Card title={<>Αύριο <span className="ml-1.5 font-normal text-ink-500">{day(tomorrow)}</span></>} action={<Link href="/vet/schedule" className={linkStyle}>Ημερολόγιο →</Link>}>
          {tomorrowQuery.loading && tomorrowItems.length === 0 ? <Note>Φόρτωση…</Note>
            : tomorrowQuery.error ? <Note>Δεν φορτώθηκαν τα αυριανά ραντεβού.</Note>
              : tomorrowItems.length === 0 ? <Note>Δεν υπάρχουν ραντεβού για αύριο.</Note>
                : tomorrowItems.slice(0, 5).map(apt => <Row key={apt.id} href={appointmentLink(apt)}
                  lead={<Lead time={clock(apt.scheduled_at)} name={apt.pet?.name || 'Ασθενής'} imageUrl={apt.pet?.image_url} />}
                  title={<>{apt.pet?.name || 'Ασθενής'} <span className="font-normal text-ink-500">· {apt.type}</span></>}
                  subtitle={`${apt.pet_owner?.name || 'Κηδεμόνας'} · ${apt.duration_minutes} λεπτά`}
                  trailing={<ClinicStatusBadge status={apt.status}>{apt.status === 'pending' ? 'Αναμονή' : 'Επιβεβαιωμένο'}</ClinicStatusBadge>} />)}
          {tomorrowQuery.total > Math.min(tomorrowItems.length, 5) && tomorrowItems.length > 0 && <Foot>Προβολή {Math.min(tomorrowItems.length, 5)} από {tomorrowQuery.total} · <Link href="/vet/schedule" className={linkStyle}>Δες όλα</Link></Foot>}
        </Card>

        <Card title="Υπενθυμίσεις" action={<Link href="/vet/reminders" className={linkStyle}>Όλες →</Link>}>
          {remindersQuery.loading && reminders.length === 0 ? <Note>Φόρτωση…</Note>
            : remindersQuery.error ? <Note>Δεν φορτώθηκαν οι υπενθυμίσεις.</Note>
              : reminders.length === 0 ? <Note>Δεν υπάρχουν ενεργές υπενθυμίσεις.</Note>
                : reminders.slice(0, 5).map(reminder => <Row key={reminder.id} href="/vet/reminders"
                  lead={<ClinicAvatar name={reminder.pet_name || 'Ασθενής'} imageUrl={reminder.pet_image_url} />}
                  title={reminder.title} subtitle={reminder.pet_name || 'Ασθενής'} trailing={reminderBadge(reminder)} />)}
        </Card>

        <Card title="Τελευταίες 30 ημέρες" action={<Link href="/vet/analytics" className={linkStyle}>Στατιστικά →</Link>}>
          {analytics ? <>
            <div aria-hidden="true" className="flex h-[70px] shrink-0 items-end gap-px border-b border-ink-100 px-4 pb-3 pt-4">
              {trend.map(item => <span key={item.date} title={`${item.date.slice(8, 10)}/${item.date.slice(5, 7)}: ${item.count}`} className={`min-h-0.5 flex-1 rounded-t-sm ${item.count ? 'bg-clinic-600' : 'bg-ink-200'}`} style={{ height: `${(item.count / trendMax) * 100}%` }} />)}
            </div>
            <dl>
              <Fact label="Ραντεβού 30 ημερών">{analytics.appointment_trends.total}</Fact>
              <Fact label="Ολοκληρωμένα αυτόν τον μήνα">{analytics.dashboard.completed_this_month}</Fact>
              <Fact label="Ασθενείς συνολικά">{analytics.dashboard.total_patients}</Fact>
              {analytics.service_breakdown.items[0] && <Fact label="Συχνότερη υπηρεσία">{analytics.service_breakdown.items[0].service_type}</Fact>}
              {reviewStats.stats && reviewStats.stats.total_reviews > 0 && <Fact label={`Μέση βαθμολογία (${reviewStats.stats.total_reviews})`}>{reviewStats.stats.average_rating.toLocaleString('el-GR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} / 5</Fact>}
            </dl>
          </> : <Note>{analyticsQuery.loading ? 'Φόρτωση…' : 'Δεν φορτώθηκαν τα στατιστικά.'}</Note>}
        </Card>
      </div>
    </>}
    <CreateAppointmentDialog open={showCreate} onClose={() => setShowCreate(false)} onSuccess={() => { setShowCreate(false); void refresh(); }} />
    {exam && <ExaminationDialog appointment={exam} onClose={() => setExam(null)} onSuccess={() => { setExam(null); void refresh(); }} />}
  </div>;
}
