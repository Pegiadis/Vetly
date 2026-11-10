'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ClinicButton, ClinicPanel, ClinicPageHeader, ClinicInput, ClinicLoading, ClinicPagination, ClinicFilterTabs, ClinicStatusBadge, ClinicEmptyState } from '@/components/vet/ClinicUI';
import ClinicAvatar from '@/components/vet/ClinicAvatar';
import ClinicDrawer from '@/components/vet/ClinicDrawer';
import { useMyAppointments, cancelAppointment, rescheduleAppointment, useAvailableSlots } from '@/hooks/useOwnerData';
import type { Appointment, AppointmentFilters } from '@/hooks/useOwnerData';
import { ApiError } from '@/lib/api';
import CalendarPicker from '@/components/CalendarPicker';
import { ErrorBlock, InlineAlert, DrawerHeader, Field, formatDay, linkPrimary, textLink } from '@/components/owner/OwnerUI';

type TabType = 'upcoming' | 'past';

const tabOptions = [{ value: 'upcoming', label: 'Επερχόμενα' }, { value: 'past', label: 'Ιστορικό' }] as const;

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

const formatDate = (value: string) => formatDay(value, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });

// Appointment times are Athens wall-clock strings; show them as written, in 24-hour form.
const formatTime = (value: string) => value.slice(11, 16);

function StatusBadge({ status }: { status: string }) {
  // Confirmed uses the teal-tinted "completed" colour of the shared badge; past visits stay neutral.
  return <ClinicStatusBadge status={status === 'confirmed' ? 'completed' : status === 'completed' ? 'neutral' : status}>{statusLabels[status] || status}</ClinicStatusBadge>;
}

function AppointmentSummary({ appointment, label }: { appointment: Appointment; label: string }) {
  return <dl className="space-y-1 rounded-[10px] bg-ink-50 p-3 text-sm text-ink-700">
    <div><dt className="inline font-medium">Κατοικίδιο: </dt><dd className="inline">{appointment.pet?.name || 'Κατοικίδιο'}</dd></div>
    <div><dt className="inline font-medium">Κτηνίατρος: </dt><dd className="inline">{appointment.vet?.name || 'Κτηνίατρος'}</dd></div>
    <div><dt className="inline font-medium">{label}: </dt><dd className="inline">{formatDate(appointment.scheduled_at)}, {formatTime(appointment.scheduled_at)}</dd></div>
  </dl>;
}

function CancelDialog({
  appointment,
  onClose,
  onSuccess,
}: {
  appointment: Appointment;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCancel = async () => {
    try {
      setSubmitting(true);
      setError(null);
      await cancelAppointment(appointment.id);
      onSuccess();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Αποτυχία ακύρωσης');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ClinicDrawer label="Ακύρωση ραντεβού" busy={submitting} onClose={onClose}>
      <div className="w-full space-y-4 bg-white p-5">
        <DrawerHeader title="Ακύρωση ραντεβού" disabled={submitting} onClose={onClose} />
        <p className="text-sm text-ink-600">Είσαι σίγουρος ότι θέλεις να ακυρώσεις αυτό το ραντεβού;</p>
        <AppointmentSummary appointment={appointment} label="Ημερομηνία" />
        <p className="text-xs text-red-700">Αυτή η ενέργεια δεν μπορεί να αναιρεθεί.</p>
        {error && <InlineAlert>{error}</InlineAlert>}
        <div className="grid grid-cols-2 gap-2">
          <ClinicButton className="min-h-10" onClick={onClose} disabled={submitting}>Πίσω</ClinicButton>
          <ClinicButton variant="danger" className="min-h-10" onClick={handleCancel} disabled={submitting}>{submitting ? 'Ακύρωση…' : 'Ακύρωση ραντεβού'}</ClinicButton>
        </div>
      </div>
    </ClinicDrawer>
  );
}

function RescheduleDialog({
  appointment,
  onClose,
  onSuccess,
}: {
  appointment: Appointment;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const initDate = appointment.scheduled_at.slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(initDate);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { slots, loading: slotsLoading, error: slotsError, refetch: refetchSlots } = useAvailableSlots(appointment.vet_id, selectedDate, appointment.duration_minutes, appointment.id);

  const isValid = Boolean(selectedDate && selectedTime && !slotsLoading && slots.includes(selectedTime));

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const handleReschedule = async () => {
    if (!isValid || submitting) return;
    try {
      setSubmitting(true);
      setError(null);
      const scheduledAt = `${selectedDate}T${selectedTime}:00`;
      await rescheduleAppointment(appointment.id, scheduledAt);
      onSuccess();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Αποτυχία αναπρογραμματισμού');
    } finally {
      setSubmitting(false);
    }
  };

  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 3);

  return (
    <ClinicDrawer label="Αλλαγή ώρας" busy={submitting} onClose={onClose}>
      <div className="w-full space-y-4 bg-white p-5">
        <DrawerHeader title="Αλλαγή ώρας" disabled={submitting} onClose={onClose} />
        <p className="text-sm text-ink-600">Επίλεξε νέα ημερομηνία και ώρα για το ραντεβού.</p>
        <AppointmentSummary appointment={appointment} label="Τρέχον" />
        <div>
          <p className="mb-2 text-sm font-medium text-ink-700">Ημερομηνία</p>
          <CalendarPicker value={selectedDate} onChange={handleDateChange} minDate={new Date()} maxDate={maxDate} accentColor="indigo" />
        </div>
        {selectedDate && (
          <div>
            <p className="mb-2 text-sm font-medium text-ink-700">Διαθέσιμες ώρες</p>
            {slotsLoading ? <ClinicLoading label="Φόρτωση διαθέσιμων ωρών…" /> : slotsError ? <ErrorBlock message="Δεν φορτώθηκαν οι διαθέσιμες ώρες." onRetry={refetchSlots} /> : slots.length === 0 ? (
              <p className="rounded-[10px] bg-ink-50 p-4 text-sm text-ink-600">Δεν υπάρχουν διαθέσιμες ώρες. Δοκίμασε διαφορετική ημερομηνία.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {slots.map((time) => (
                  <ClinicButton key={time} type="button" aria-pressed={selectedTime === time} variant={selectedTime === time ? 'primary' : 'secondary'} className="min-h-10 tabular-nums" onClick={() => setSelectedTime(time)}>{time}</ClinicButton>
                ))}
              </div>
            )}
          </div>
        )}
        <p className="text-xs text-ink-500">Ο κτηνίατρος θα πρέπει να επιβεβαιώσει το νέο ραντεβού.</p>
        {error && <InlineAlert>{error}</InlineAlert>}
        <div className="grid grid-cols-2 gap-2">
          <ClinicButton className="min-h-10" onClick={onClose} disabled={submitting}>Πίσω</ClinicButton>
          <ClinicButton variant="primary" className="min-h-10" onClick={handleReschedule} disabled={submitting || !isValid}>{submitting ? 'Αποθήκευση…' : 'Αλλαγή ώρας'}</ClinicButton>
        </div>
      </div>
    </ClinicDrawer>
  );
}

function AppointmentCard({ apt, showActions, onCancel, onReschedule }: { apt: Appointment; showActions: boolean; onCancel: (apt: Appointment) => void; onReschedule: (apt: Appointment) => void }) {
  const address = [apt.vet?.address, apt.vet?.city].filter(Boolean).join(', ');
  const canEdit = showActions && ['pending', 'confirmed'].includes(apt.status);
  const secondaryLink = 'inline-flex min-h-10 items-center justify-center rounded-[10px] bg-black/[0.06] px-3 py-1 text-[13px] font-medium text-ink-900 hover:bg-black/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clinic-600 sm:min-h-8';
  return <article className="border-b border-ink-100 px-4 py-4 last:border-0 sm:px-5">
    <div className="flex items-start gap-3">
      <time className="w-12 shrink-0 text-lg font-semibold tabular-nums text-clinic-800">{formatTime(apt.scheduled_at)}</time>
      <ClinicAvatar name={apt.pet?.name || 'Κατοικίδιο'} imageUrl={apt.pet?.image_url} />
      <div className="min-w-0 flex-1">
        <Link href={`/owner/appointments/${apt.id}`} className="break-words text-sm font-semibold text-ink-900 hover:text-clinic-700 hover:underline">{apt.pet?.name || 'Κατοικίδιο'} · {appointmentTypeLabels[apt.type] || apt.type}</Link>
        <p className="mt-0.5 break-words text-xs text-ink-500">{apt.vet?.name || 'Κτηνίατρος'} · {apt.duration_minutes} λεπτά</p>
        <div className="mt-1.5"><StatusBadge status={apt.status} /></div>
      </div>
    </div>
    {address && <a href={`https://www.google.com/maps/dir/?api=1&destination=${apt.vet?.coordinates_lat != null && apt.vet?.coordinates_lng != null ? `${apt.vet.coordinates_lat},${apt.vet.coordinates_lng}` : encodeURIComponent(address)}`} target="_blank" rel="noopener noreferrer" className="mt-3 block break-words text-xs text-ink-500 hover:text-clinic-700">{address} · Οδηγίες διαδρομής ↗</a>}
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <Link href={`/owner/appointments/${apt.id}`} className={secondaryLink}>Λεπτομέρειες</Link>
      {canEdit && <><ClinicButton className="min-h-10 sm:min-h-8" onClick={() => onReschedule(apt)}>Αλλαγή ώρας</ClinicButton><ClinicButton variant="danger" className="min-h-10 sm:min-h-8" onClick={() => onCancel(apt)}>Ακύρωση</ClinicButton></>}
      {apt.status === 'completed' && <Link href="/owner/reviews" className={`${textLink} px-2 py-2`}>Αξιολόγηση</Link>}
    </div>
  </article>;
}

export default function AppointmentsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const handleDateFrom = (v: string) => {
    if (v && dateTo && v > dateTo) {
      setDateFrom(dateTo);
      setDateTo(v);
    } else {
      setDateFrom(v);
    }
    setPage(1);
  };

  const handleDateTo = (v: string) => {
    if (v && dateFrom && v < dateFrom) {
      setDateTo(dateFrom);
      setDateFrom(v);
    } else {
      setDateTo(v);
    }
    setPage(1);
  };
  const [petName, setPetName] = useState('');

  const filters = useMemo<AppointmentFilters>(() => ({
    status: activeTab,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    petName: petName || undefined,
  }), [activeTab, dateFrom, dateTo, petName]);

  const { appointments, total, totalPages, loading, error, refetch } = useMyAppointments(page, 10, filters);
  const [cancelDialog, setCancelDialog] = useState<Appointment | null>(null);
  const [rescheduleDialog, setRescheduleDialog] = useState<Appointment | null>(null);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as TabType);
    setPage(1);
  };

  const handleCancelSuccess = () => {
    setCancelDialog(null);
    if (page > 1 && appointments.length === 1) setPage(page - 1);
    else refetch();
  };

  const handleRescheduleSuccess = () => {
    setRescheduleDialog(null);
    if (page > 1 && appointments.length === 1) setPage(page - 1);
    else refetch();
  };

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setPetName('');
    setPage(1);
  };

  const hasFilters = dateFrom || dateTo || petName;

  return <div className="space-y-4 text-ink-800">
    <ClinicPageHeader title="Ραντεβού" description="Οι προγραμματισμένες επισκέψεις και το ιστορικό των κατοικιδίων σου." actions={<Link href="/owner/book" className={linkPrimary}>+ Νέο ραντεβού</Link>} />
    <ClinicPanel className="overflow-hidden">
      <ClinicFilterTabs label="Προβολή ραντεβού" options={tabOptions} value={activeTab} onChange={handleTabChange} />
      <div className="grid grid-cols-2 items-end gap-3 border-b border-ink-200 p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.3fr)_auto]">
        <Field label="Από"><ClinicInput aria-label="Από" type="date" value={dateFrom} onChange={e => handleDateFrom(e.target.value)} className="h-10 w-full" /></Field>
        <Field label="Έως"><ClinicInput aria-label="Έως" type="date" value={dateTo} onChange={e => handleDateTo(e.target.value)} className="h-10 w-full" /></Field>
        <Field label="Κατοικίδιο" className="col-span-2 md:col-span-1"><ClinicInput type="search" placeholder="Όνομα κατοικιδίου" value={petName} onChange={e => { setPetName(e.target.value); setPage(1); }} className="h-10 w-full" /></Field>
        {hasFilters && <ClinicButton className="col-span-2 min-h-10 md:col-span-1" onClick={clearFilters}>Καθαρισμός</ClinicButton>}
      </div>
      {loading ? <ClinicLoading /> : error ? <ErrorBlock onRetry={refetch} /> : appointments.length ? <>
        <p className="border-b border-ink-100 px-4 py-2 text-xs text-ink-500 sm:px-5">{total} αποτελέσματα</p>
        {appointments.map((apt, index) => <div key={apt.id}>{(index === 0 || appointments[index - 1].scheduled_at.slice(0, 10) !== apt.scheduled_at.slice(0, 10)) && <h2 className="border-b border-ink-100 bg-ink-50 px-4 py-2 text-xs font-semibold text-ink-600 sm:px-5">{formatDate(apt.scheduled_at)}</h2>}<AppointmentCard apt={apt} showActions={activeTab === 'upcoming'} onCancel={setCancelDialog} onReschedule={setRescheduleDialog} /></div>)}
      </> : <ClinicEmptyState
        title={hasFilters ? 'Δεν βρέθηκαν ραντεβού με αυτά τα φίλτρα.' : activeTab === 'upcoming' ? 'Δεν υπάρχουν επερχόμενα ραντεβού.' : 'Δεν υπάρχουν παλαιότερα ραντεβού.'}
        description={hasFilters ? 'Άλλαξε τις ημερομηνίες ή το όνομα του κατοικιδίου.' : 'Οι επισκέψεις σου θα εμφανίζονται εδώ.'}>
        {!hasFilters && activeTab === 'upcoming' && <Link href="/owner/book" className={linkPrimary}>Κλείσε ραντεβού</Link>}
      </ClinicEmptyState>}
    </ClinicPanel>
    {!loading && !error && <ClinicPagination page={page} totalPages={totalPages} onPageChange={setPage} />}
    {cancelDialog && <CancelDialog appointment={cancelDialog} onClose={() => setCancelDialog(null)} onSuccess={handleCancelSuccess} />}
    {rescheduleDialog && <RescheduleDialog appointment={rescheduleDialog} onClose={() => setRescheduleDialog(null)} onSuccess={handleRescheduleSuccess} />}
  </div>;
}
