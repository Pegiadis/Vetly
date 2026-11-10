'use client';

import { use } from 'react';
import Link from 'next/link';
import { useAppointmentDetail } from '@/hooks/useOwnerData';
import { ClinicPanel, ClinicLoading, ClinicStatusBadge } from '@/components/vet/ClinicUI';
import ClinicAvatar from '@/components/vet/ClinicAvatar';
import { ErrorBlock, formatDay, speciesLabels, textLink } from '@/components/owner/OwnerUI';

const appointmentTypeLabels: Record<string, string> = {
  'Checkup': 'Εξέταση',
  'Vaccination': 'Εμβολιασμός',
  'Surgery': 'Χειρουργείο',
  'Emergency': 'Έκτακτη Ανάγκη',
  'Dental': 'Οδοντιατρικά',
  'Grooming': 'Καλλωπισμός',
  'Consultation': 'Συμβουλευτική',
  'Follow-up': 'Επανεξέταση',
  'Deworming': 'Αποπαρασίτωση',
  'Lab Tests': 'Εργαστηριακές Εξετάσεις',
};

const statusLabels: Record<string, string> = {
  confirmed: 'Επιβεβαιωμένο',
  pending: 'Αναμονή',
  completed: 'Ολοκληρώθηκε',
  cancelled: 'Ακυρώθηκε',
};

const eventTypeLabels: Record<string, string> = {
  'Vaccination': 'Εμβολιασμός',
  'Surgery': 'Χειρουργείο',
  'Checkup': 'Εξέταση',
  'Lab Test': 'Εργαστηριακή Εξέταση',
  'Diagnosis': 'Διάγνωση',
  'Treatment': 'Θεραπεία',
};

const frequencyLabels: Record<string, string> = {
  daily: 'Καθημερινά',
  weekly: 'Εβδομαδιαία',
  once: 'Εφάπαξ',
};

const longDate = (value: string) => formatDay(value, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const shortDate = (value: string) => formatDay(value, { day: 'numeric', month: 'short', year: 'numeric' });

function BackLink() {
  return <Link href="/owner/appointments" className={textLink}>← Πίσω στα ραντεβού</Link>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <ClinicPanel className="min-w-0 overflow-hidden"><h2 className="border-b border-ink-100 px-4 py-3 text-sm font-semibold text-ink-900 sm:px-5">{title}</h2><div className="p-4 sm:p-5">{children}</div></ClinicPanel>;
}

export default function AppointmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { appointment, loading, error, refetch } = useAppointmentDetail(id);

  if (loading) return <div className="space-y-4"><BackLink /><ClinicLoading /></div>;

  if (error || !appointment) {
    return <div className="space-y-4"><BackLink /><ClinicPanel><ErrorBlock message={error ? 'Δεν φορτώθηκε το ραντεβού.' : 'Δεν βρέθηκε το ραντεβού.'} onRetry={error ? refetch : undefined} /></ClinicPanel></div>;
  }

  const petName = appointment.pet?.name || 'Κατοικίδιο';
  const vetName = appointment.vet?.name || 'Κτηνίατρος';
  const address = [appointment.vet?.address, appointment.vet?.city].filter(Boolean).join(', ');
  const status = appointment.status === 'confirmed' ? 'completed' : appointment.status === 'completed' ? 'neutral' : appointment.status;

  return (
    <div className="space-y-4 text-ink-800">
      <BackLink />
      <header>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">{appointmentTypeLabels[appointment.type] || appointment.type}</h1>
          <ClinicStatusBadge status={status}>{statusLabels[appointment.status] || appointment.status}</ClinicStatusBadge>
        </div>
        <p className="mt-1.5 text-sm text-ink-500">
          {longDate(appointment.scheduled_at)}, <span className="tabular-nums">{appointment.scheduled_at.slice(11, 16)}</span>
          {appointment.duration_minutes ? ` · ${appointment.duration_minutes} λεπτά` : ''}
        </p>
      </header>

      <div className="grid items-start gap-4 md:grid-cols-2">
        <Section title="Κατοικίδιο">
          <div className="flex items-center gap-3">
            <ClinicAvatar large name={petName} imageUrl={appointment.pet?.image_url} />
            <div className="min-w-0 break-words">
              <h3 className="text-base font-semibold text-ink-900">{petName}</h3>
              <p className="mt-0.5 text-sm text-ink-500">
                {appointment.pet?.type ? speciesLabels[appointment.pet.type] || appointment.pet.type : ''}
                {appointment.pet?.breed ? ` · ${appointment.pet.breed}` : ''}
              </p>
            </div>
          </div>
        </Section>

        <Section title="Κτηνίατρος">
          <div className="flex items-center gap-3">
            <ClinicAvatar large name={vetName} imageUrl={appointment.vet?.image_url} />
            <div className="min-w-0 break-words">
              <h3 className="text-base font-semibold text-ink-900">{vetName}</h3>
              {appointment.vet?.specialty && <p className="mt-0.5 text-sm text-ink-500">{appointment.vet.specialty}</p>}
              {address && <p className="mt-1 text-xs text-ink-500">{address}</p>}
            </div>
          </div>
        </Section>

        {appointment.notes && <Section title="Σημειώσεις"><p className="whitespace-pre-wrap break-words text-sm leading-6 text-ink-700">{appointment.notes}</p></Section>}

        {appointment.price != null && <Section title="Κόστος"><p className="text-2xl font-semibold tabular-nums text-ink-900">{Number(appointment.price).toFixed(2)} €</p></Section>}

        {appointment.medical_events.length > 0 && (
          <Section title="Ιατρικό ιστορικό">
            <div className="divide-y divide-ink-100">
              {appointment.medical_events.map((event) => (
                <div key={event.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                    <div className="min-w-0"><h3 className="break-words text-sm font-semibold text-ink-900">{event.title}</h3><p className="mt-0.5 text-xs font-medium text-clinic-700">{eventTypeLabels[event.event_type] || event.event_type}</p></div>
                    <time className="text-xs text-ink-500">{shortDate(event.date)}</time>
                  </div>
                  {event.notes && <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-ink-600">{event.notes}</p>}
                </div>
              ))}
            </div>
          </Section>
        )}

        {appointment.medications.length > 0 && (
          <Section title="Φαρμακευτική αγωγή">
            <div className="divide-y divide-ink-100">
              {appointment.medications.map((med) => (
                <div key={med.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                    <div className="min-w-0"><h3 className="break-words text-sm font-semibold text-ink-900">{med.name}</h3><p className="mt-0.5 text-xs text-ink-500">{med.dosage} · {frequencyLabels[med.frequency] || med.frequency}</p></div>
                    <ClinicStatusBadge status={med.is_active ? 'completed' : 'neutral'}>{med.is_active ? 'Ενεργό' : 'Ανενεργό'}</ClinicStatusBadge>
                  </div>
                  <p className="mt-1 text-xs text-ink-500">Από {shortDate(med.start_date)}{med.end_date ? ` · Έως ${shortDate(med.end_date)}` : ''}</p>
                  {med.notes && <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-ink-600">{med.notes}</p>}
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}
