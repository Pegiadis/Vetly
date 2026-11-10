'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMyPets, useUpcomingAppointments, useMyMedications, useOwnerReminders } from '@/hooks/useOwnerData';
import { ClinicButton, ClinicPanel, ClinicLoading, ClinicStatusBadge } from '@/components/vet/ClinicUI';
import ClinicAvatar from '@/components/vet/ClinicAvatar';

const textLink = 'text-xs font-medium text-clinic-700 hover:underline underline-offset-4';
const primary = 'inline-flex min-h-8 items-center justify-center rounded-[10px] bg-clinic-600 px-3 py-1 text-[13px] font-medium text-white hover:bg-clinic-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clinic-600';
const secondary = 'inline-flex min-h-8 items-center justify-center rounded-[10px] bg-black/[0.06] px-3 py-1 text-[13px] font-medium text-ink-900 hover:bg-black/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clinic-600';
const species: Record<string,string> = { Dog: 'Σκύλος', Cat: 'Γάτα', Other: 'Άλλο' };
// Appointment values are Athens wall-clock timestamps, without an offset.
const dateLabel = (value: string) => new Intl.DateTimeFormat('el-GR', { day:'numeric', month:'long' }).format(new Date(`${value.slice(0,10)}T12:00:00`));
function Content({ query, children }: { query: { loading: boolean; error: string | null; refetch: () => unknown }; children: ReactNode }) {
  if (query.loading) return <ClinicLoading />;
  if (query.error) return <div role="alert" className="p-5 text-sm text-ink-600"><p>Δεν φορτώθηκαν τα στοιχεία.</p><ClinicButton className="mt-3" onClick={() => void query.refetch()}>Επανάληψη</ClinicButton></div>;
  return children;
}
function SectionTitle({ title, href, action='Δες όλα' }: { title: string; href: string; action?: string }) {
  return <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-100 px-5 py-4"><h2 className="text-sm font-semibold text-ink-900">{title}</h2><Link href={href} className={textLink}>{action} →</Link></div>;
}

export default function OwnerDashboardPage() {
  const { user } = useAuth();
  const pets = useMyPets();
  const visits = useUpcomingAppointments();
  const medications = useMyMedications(true, 1, 1);
  const reminders = useOwnerReminders(1, 3);
  const athensNow = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Athens', year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit', hourCycle:'h23' }).format(new Date()).replace(' ', 'T');
  const upcoming = visits.appointments.filter(a => a.scheduled_at >= athensNow).sort((a,b) => a.scheduled_at.localeCompare(b.scheduled_at));
  const next = upcoming.find(a => a.status === 'confirmed');
  const pending = upcoming.filter(a => a.status === 'pending');
  const hour = Number(athensNow.slice(11, 13));
  const greeting = hour < 12 ? 'Καλημέρα' : hour < 18 ? 'Καλησπέρα' : 'Καλό βράδυ';
  const firstName = (user?.name || '').trim().split(/\s+/)[0] || '';
  const today = new Intl.DateTimeFormat('el-GR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(`${athensNow.slice(0, 10)}T12:00:00`));
  const count = (query: { loading: boolean; error: string | null }, value: number) => query.loading || query.error ? '—' : value;

  return <div className="space-y-4 text-ink-800">
    <header><p className="text-xs text-ink-500">{today}</p><h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-ink-900">{greeting}{firstName ? `, ${firstName}` : ''}</h1><p className="mt-1 text-sm text-ink-600">{visits.loading || visits.error ? 'Η φροντίδα τους, συγκεντρωμένη εδώ.' : next ? `Το επόμενο ραντεβού είναι ${next.scheduled_at.slice(0, 10) === athensNow.slice(0, 10) ? 'σήμερα' : `στις ${dateLabel(next.scheduled_at)}`}, ${next.scheduled_at.slice(11, 16)}.` : 'Δεν έχεις επιβεβαιωμένο ραντεβού αυτή τη στιγμή.'}</p></header>
    <ClinicPanel className="grid grid-cols-2 overflow-hidden lg:grid-cols-4">
      {[
        { label:'Τα κατοικίδιά μου', value:count(pets,pets.total), href:'/owner/pets' },
        { label:'Επερχόμενα ραντεβού', value:count(visits,upcoming.length), href:'/owner/appointments' },
        { label:'Ενεργές αγωγές', value:count(medications,medications.total), href:'/owner/medications' },
        { label:'Υπενθυμίσεις φροντίδας', value:count(reminders,reminders.total), href:'/owner/reminders' },
      ].map(item => <Link key={item.label} href={item.href} className="min-w-0 border-b border-r border-ink-100 p-4 hover:bg-ink-50 lg:border-b-0"><span className="block text-xs leading-5 text-ink-500">{item.label}</span><strong className="mt-2 block text-2xl font-semibold tabular-nums text-ink-900">{item.value}</strong></Link>)}
    </ClinicPanel>
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]">
      <div className="min-w-0 space-y-5">
        <ClinicPanel className="overflow-hidden"><SectionTitle title="Το επόμενο ραντεβού" href="/owner/appointments" action="Όλα τα ραντεβού" />
          <Content query={visits}>{next ? <div className="p-5">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs text-ink-500">{dateLabel(next.scheduled_at)}</p><time className="mt-1 block text-3xl font-semibold tracking-tight text-clinic-800">{next.scheduled_at.slice(11,16)}</time></div><ClinicStatusBadge status="completed">Επιβεβαιωμένο</ClinicStatusBadge></div>
            <div className="flex items-center gap-3"><ClinicAvatar large name={next.pet?.name || 'Κατοικίδιο'} imageUrl={next.pet?.image_url} /><div className="min-w-0"><h3 className="break-words text-lg font-semibold">{next.pet?.name || 'Κατοικίδιο'}</h3><p className="mt-1 break-words text-sm text-ink-500">{next.type} · {next.duration_minutes} λεπτά</p></div></div>
            <div className="mt-5 border-t border-ink-100 pt-4"><p className="text-sm font-medium">{next.vet?.name || 'Κτηνίατρος'}</p><p className="mt-1 break-words text-xs leading-5 text-ink-500">{[next.vet?.address,next.vet?.city].filter(Boolean).join(', ') || 'Δες τις πληροφορίες στην κράτησή σου.'}</p></div>
            <Link href={`/owner/appointments/${next.id}`} className={`${primary} mt-5`}>Προβολή ραντεβού</Link>
          </div> : <div className="p-5"><p className="text-sm font-medium">Δεν έχεις επιβεβαιωμένο επερχόμενο ραντεβού.</p><p className="mt-2 text-xs leading-5 text-ink-500">Βρες κτηνίατρο και διάλεξε μια διαθέσιμη ώρα για το κατοικίδιό σου.</p><Link href="/owner/book" className={`${secondary} mt-4`}>Αναζήτηση κτηνιάτρου</Link></div>}</Content>
        </ClinicPanel>
        {!visits.loading && !visits.error && pending.length > 0 && <ClinicPanel className="overflow-hidden"><SectionTitle title={`Αναμονή έγκρισης · ${pending.length}`} href="/owner/appointments" /><p className="px-5 pt-3 text-xs leading-5 text-ink-500">Αυτά τα αιτήματα δεν έχουν επιβεβαιωθεί ακόμη από τον κτηνίατρο.</p>{pending.slice(0,3).map(a => <Link key={a.id} href={`/owner/appointments/${a.id}`} className="flex items-center gap-3 border-b border-ink-100 p-5 last:border-0 hover:bg-ink-50"><ClinicAvatar name={a.pet?.name || 'Κατοικίδιο'} imageUrl={a.pet?.image_url} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{a.pet?.name} · {a.type}</p><p className="mt-1 text-xs text-ink-500">{dateLabel(a.scheduled_at)} · {a.scheduled_at.slice(11,16)}</p><p className="mt-1 truncate text-xs text-ink-500">{a.vet?.name}</p></div><span aria-hidden="true">→</span></Link>)}</ClinicPanel>}
        <ClinicPanel className="overflow-hidden"><SectionTitle title="Τα κατοικίδιά μου" href="/owner/pets" />
          <Content query={pets}>{pets.pets.length ? <>{pets.pets.map(pet => <Link href={`/owner/pets?selected=${encodeURIComponent(pet.id)}`} key={pet.id} className="flex items-center gap-3 border-b border-ink-100 px-5 py-4 hover:bg-ink-50"><ClinicAvatar name={pet.name} imageUrl={pet.image_url} /><div className="min-w-0 flex-1"><h3 className="truncate text-sm font-semibold">{pet.name}</h3><p className="mt-1 truncate text-xs text-ink-500">{species[pet.type] || pet.type}{pet.breed ? ` · ${pet.breed}` : ''}</p></div><span aria-hidden="true">→</span></Link>)}{pets.total > pets.pets.length && <p className="px-5 py-3 text-xs text-ink-500">Προβολή {pets.pets.length} από {pets.total} κατοικίδια.</p>}</> : <p className="px-5 py-6 text-sm text-ink-500">Πρόσθεσε το πρώτο σου κατοικίδιο για να οργανώσεις τη φροντίδα του.</p>}</Content>
          <div className="p-4"><Link href="/owner/pets?action=new" className={secondary}>+ Προσθήκη κατοικιδίου</Link></div>
        </ClinicPanel>
      </div>
      <div className="min-w-0 space-y-5">
        <ClinicPanel className="overflow-hidden"><SectionTitle title="Υπενθυμίσεις φροντίδας" href="/owner/reminders" /><Content query={reminders}>{reminders.reminders.length ? reminders.reminders.map(r => <Link key={r.id} href="/owner/reminders" className="flex items-start gap-3 border-b border-ink-100 p-5 last:border-0 hover:bg-ink-50"><ClinicAvatar name={r.pet_name || 'Κατοικίδιο'} imageUrl={r.pet_image_url} /><div className="min-w-0"><h3 className="break-words text-sm font-semibold">{r.title}</h3><p className="mt-1 text-xs text-ink-500">{r.pet_name}</p><p className={`mt-2 text-xs font-medium ${r.due_date.slice(0,10) < athensNow.slice(0,10) ? 'text-amber-800' : 'text-clinic-700'}`}>{dateLabel(r.due_date)}{r.due_date.slice(0,10) < athensNow.slice(0,10) ? ' · Η ημερομηνία πέρασε' : ''}</p></div></Link>) : <p className="p-5 text-sm leading-6 text-ink-500">Δεν υπάρχουν εκκρεμείς υπενθυμίσεις.</p>}</Content></ClinicPanel>
        <ClinicPanel className="p-5"><h2 className="text-sm font-semibold">Αγωγές και ιστορικό</h2><Content query={medications}><p className="mt-2 text-xs leading-5 text-ink-500">{medications.total > 0 ? `${medications.total} ενεργές αγωγές. Δες τις καταχωρημένες οδηγίες του κτηνιάτρου σου.` : 'Δεν υπάρχουν καταχωρημένες ενεργές αγωγές.'}</p></Content><div className="mt-4 flex flex-wrap gap-2"><Link href="/owner/medications" className={secondary}>Οι αγωγές μου</Link><Link href="/owner/medical" className={secondary}>Ιατρικό ιστορικό</Link></div></ClinicPanel>
        <ClinicPanel className="border-clinic-100 !bg-clinic-50 p-5"><h2 className="text-sm font-semibold text-clinic-800">Χρειάζεσαι εφημερεύοντα;</h2><p className="mt-2 text-xs leading-5 text-ink-600">Δες τους κτηνιάτρους που δηλώνουν διαθέσιμοι για εφημερία και τα στοιχεία επικοινωνίας τους.</p><Link href="/owner/on-call" className={`${secondary} mt-4`}>Εφημερεύοντες κτηνίατροι →</Link></ClinicPanel>
      </div>
    </div>
  </div>;
}
