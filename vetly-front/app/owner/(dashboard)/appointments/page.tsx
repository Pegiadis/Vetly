'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ClinicButton, ClinicPanel, ClinicPageHeader, ClinicInput, ClinicLoading, ClinicPagination } from '@/components/vet/ClinicUI';
import ClinicAvatar from '@/components/vet/ClinicAvatar';
import ClinicDrawer from '@/components/vet/ClinicDrawer';
import { useMyAppointments, cancelAppointment, rescheduleAppointment, useAvailableSlots } from '@/hooks/useOwnerData';
import type { Appointment, AppointmentFilters } from '@/hooks/useOwnerData';
import { ApiError } from '@/lib/api';
import CalendarPicker from '@/components/CalendarPicker';

type TabType = 'upcoming' | 'past';

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

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('el-GR', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('el-GR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}


function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    confirmed: 'bg-clinic-100 text-clinic-800',
    pending: 'bg-amber-100 text-amber-700',
    completed: 'bg-ink-100 text-ink-600',
    cancelled: 'bg-red-100 text-red-700',
  };
  const labels: Record<string, string> = {
    confirmed: 'Επιβεβαιωμένο',
    pending: 'Αναμονή',
    completed: 'Ολοκληρώθηκε',
    cancelled: 'Ακυρώθηκε',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-ink-100 text-ink-600'}`}>
      {labels[status] || status}
    </span>
  );
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

  const petName = appointment.pet?.name || 'Κατοικίδιο';
  const vetName = appointment.vet?.name || 'Κτηνίατρος';

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
        <div className="bg-white w-full" onClick={(e) => e.stopPropagation()}>
          <div className="p-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-ink-900 text-center mb-2">Ακύρωση Ραντεβού</h3>
            <p className="text-sm text-ink-500 text-center mb-4">
              Είστε σίγουροι ότι θέλετε να ακυρώσετε αυτό το ραντεβού;
            </p>

            <div className="bg-ink-50 rounded-xl p-4 mb-4 space-y-1 text-sm">
              <p className="text-ink-700"><span className="font-medium">Κατοικίδιο:</span> {petName}</p>
              <p className="text-ink-700"><span className="font-medium">Κτηνίατρος:</span> {vetName}</p>
              <p className="text-ink-700"><span className="font-medium">Ημερομηνία:</span> {formatDate(appointment.scheduled_at)}, {formatTime(appointment.scheduled_at)}</p>
            </div>

            <p className="text-xs text-red-500 text-center mb-4">Αυτή η ενέργεια δεν μπορεί να αναιρεθεί.</p>

            {error && (
              <div role="alert" className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm font-medium mb-4">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={submitting}
                className="flex-1 px-4 py-3 rounded-xl border border-ink-200 text-ink-600 font-medium hover:bg-ink-50 transition-colors"
              >
                Πίσω
              </button>
              <button
                onClick={handleCancel}
                disabled={submitting}
                className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Ακύρωση...
                  </span>
                ) : (
                  'Ακύρωση Ραντεβού'
                )}
              </button>
            </div>
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

  const petName = appointment.pet?.name || 'Κατοικίδιο';
  const vetName = appointment.vet?.name || 'Κτηνίατρος';

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
        <div className="bg-white w-full" onClick={(e) => e.stopPropagation()}>
          <div className="p-6">
            <div className="w-12 h-12 bg-clinic-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-clinic-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-ink-900 text-center mb-2">Αναπρογραμματισμός</h3>
            <p className="text-sm text-ink-500 text-center mb-4">
              Επιλέξτε νέα ημερομηνία και ώρα για το ραντεβού.
            </p>

            <div className="bg-ink-50 rounded-xl p-4 mb-4 space-y-1 text-sm">
              <p className="text-ink-700"><span className="font-medium">Κατοικίδιο:</span> {petName}</p>
              <p className="text-ink-700"><span className="font-medium">Κτηνίατρος:</span> {vetName}</p>
              <p className="text-ink-700"><span className="font-medium">Τρέχον:</span> {formatDate(appointment.scheduled_at)}, {formatTime(appointment.scheduled_at)}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-ink-700 mb-2">Ημερομηνία</label>
              <CalendarPicker
                value={selectedDate}
                onChange={handleDateChange}
                minDate={new Date()}
                maxDate={maxDate}
                accentColor="teal"
              />
            </div>

            {selectedDate && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-ink-700 mb-2">Διαθέσιμες ώρες</label>
                {slotsLoading ? (
                  <div className="text-center py-6 text-ink-500">
                    <svg className="animate-spin h-6 w-6 mx-auto mb-2 text-clinic-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Φόρτωση διαθέσιμων ωρών...
                  </div>
                ) : slotsError ? (<div role="alert" className="text-sm text-red-700">Δεν φορτώθηκαν οι διαθέσιμες ώρες.<ClinicButton onClick={() => void refetchSlots()}>Επανάληψη</ClinicButton></div>) : slots.length === 0 ? (
                  <div className="text-center py-6 text-ink-500">
                    <p className="font-medium">Δεν υπάρχουν διαθέσιμες ώρες</p>
                    <p className="text-sm mt-1">Δοκιμάστε διαφορετική ημερομηνία.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {slots.map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setSelectedTime(time)}
                        className={`p-3 rounded-xl border-2 font-medium text-sm transition-all ${
                          selectedTime === time
                            ? 'border-clinic-500 bg-clinic-50 text-clinic-700'
                            : 'border-ink-100 hover:border-clinic-200 text-ink-600'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <p className="text-xs text-ink-400 text-center mb-4">Ο κτηνίατρος θα πρέπει να επιβεβαιώσει το νέο ραντεβού.</p>

            {error && (
              <div role="alert" className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm font-medium mb-4">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={submitting}
                className="flex-1 px-4 py-3 rounded-xl border border-ink-200 text-ink-600 font-medium hover:bg-ink-50 transition-colors"
              >
                Πίσω
              </button>
              <button
                onClick={handleReschedule}
                disabled={submitting || !isValid}
                className="flex-1 px-4 py-3 rounded-xl bg-clinic-600 text-white font-medium hover:bg-clinic-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Αποθήκευση...
                  </span>
                ) : (
                  'Αναπρογραμματισμός'
                )}
              </button>
            </div>
          </div>
        </div>
    </ClinicDrawer>
  );
}

function AppointmentCard({ apt, showActions, onCancel, onReschedule }: { apt: Appointment; showActions: boolean; onCancel: (apt: Appointment) => void; onReschedule: (apt: Appointment) => void }) {
  const address = [apt.vet?.address, apt.vet?.city].filter(Boolean).join(', ');
  const canEdit = showActions && ['pending','confirmed'].includes(apt.status);
  return <article className="border-b border-ink-100 px-4 py-4 last:border-0 sm:px-5">
    <div className="flex flex-wrap items-start gap-3"><div className="w-14 shrink-0"><time className="text-lg font-semibold tabular-nums text-clinic-800">{formatTime(apt.scheduled_at)}</time><p className="mt-1 text-xs text-ink-500">{apt.duration_minutes} λεπτά</p></div><ClinicAvatar name={apt.pet?.name || 'Κατοικίδιο'} imageUrl={apt.pet?.image_url} /><div className="min-w-0 flex-1"><Link href={`/owner/appointments/${apt.id}`} className="break-words text-sm font-semibold hover:text-clinic-700 hover:underline">{apt.pet?.name || 'Κατοικίδιο'} · {appointmentTypeLabels[apt.type] || apt.type}</Link><p className="mt-1 break-words text-xs text-ink-500">{apt.vet?.name || 'Κτηνίατρος'}</p></div><StatusBadge status={apt.status} /></div>
    <div className="mt-3 flex flex-wrap items-center gap-2"><Link href={`/owner/appointments/${apt.id}`} className="rounded-lg border border-ink-200 px-3 py-2 text-xs font-medium hover:bg-ink-50">Λεπτομέρειες</Link>{canEdit && <><ClinicButton onClick={() => onReschedule(apt)}>Αλλαγή ώρας</ClinicButton><ClinicButton variant="danger" onClick={() => onCancel(apt)}>Ακύρωση</ClinicButton></>}{apt.status === 'completed' && <Link href="/owner/reviews" className="px-3 py-2 text-xs font-medium text-clinic-700 hover:underline">Αξιολόγηση</Link>}</div>
    {address && <a href={`https://www.google.com/maps/dir/?api=1&destination=${apt.vet?.coordinates_lat != null && apt.vet?.coordinates_lng != null ? `${apt.vet.coordinates_lat},${apt.vet.coordinates_lng}` : encodeURIComponent(address)}`} target="_blank" rel="noopener noreferrer" className="mt-3 block break-words text-xs text-ink-500 hover:text-clinic-700">{address} · Οδηγίες διαδρομής ↗</a>}
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

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
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

  return <div className="mx-auto max-w-[1280px] space-y-5 text-ink-800">
    <ClinicPageHeader title="Ραντεβού" description="Οι προγραμματισμένες επισκέψεις και το ιστορικό των κατοικιδίων σου." actions={<Link href="/owner/book" className="rounded-lg border border-clinic-700 bg-clinic-600 px-4 py-2 text-xs font-medium text-white hover:bg-clinic-700">+ Νέο ραντεβού</Link>} />
    <ClinicPanel className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-200 p-4"><div className="flex gap-1" role="group" aria-label="Προβολή ραντεβού">{(['upcoming','past'] as const).map(tab => <ClinicButton key={tab} aria-pressed={activeTab === tab} variant={activeTab === tab ? 'primary' : 'ghost'} onClick={() => handleTabChange(tab)}>{tab === 'upcoming' ? 'Επερχόμενα' : 'Ιστορικό'}</ClinicButton>)}</div><p className="text-xs text-ink-500">{loading ? 'Φόρτωση…' : `${total} αποτελέσματα`}</p></div>
      <div className="grid items-end gap-3 border-b border-ink-200 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.3fr)_auto]"><label className="min-w-0 text-xs text-ink-500">Από<ClinicInput aria-label="Από" type="date" value={dateFrom} onChange={e => handleDateFrom(e.target.value)} className="mt-1 w-full" /></label><label className="min-w-0 text-xs text-ink-500">Έως<ClinicInput aria-label="Έως" type="date" value={dateTo} onChange={e => handleDateTo(e.target.value)} className="mt-1 w-full" /></label><label className="min-w-0 text-xs text-ink-500">Κατοικίδιο<ClinicInput type="search" placeholder="Όνομα κατοικιδίου" value={petName} onChange={e => { setPetName(e.target.value); setPage(1); }} className="mt-1 w-full" /></label>{hasFilters && <ClinicButton onClick={clearFilters}>Καθαρισμός</ClinicButton>}</div>
      {loading ? <ClinicLoading /> : error ? <div role="alert" className="p-5 text-sm text-red-700"><p>{error}</p><ClinicButton className="mt-3" onClick={() => void refetch()}>Επανάληψη</ClinicButton></div> : appointments.length ? appointments.map((apt,index) => <div key={apt.id}>{(index === 0 || appointments[index-1].scheduled_at.slice(0,10) !== apt.scheduled_at.slice(0,10)) && <h2 className="border-y border-ink-100 bg-ink-50 px-5 py-2 text-xs font-semibold text-ink-600">{formatDate(apt.scheduled_at)}</h2>}<AppointmentCard apt={apt} showActions={activeTab === 'upcoming'} onCancel={setCancelDialog} onReschedule={setRescheduleDialog} /></div>) : <div className="p-8 text-center"><h2 className="text-sm font-semibold">{hasFilters ? 'Δεν βρέθηκαν ραντεβού με αυτά τα φίλτρα.' : activeTab === 'upcoming' ? 'Δεν υπάρχουν επερχόμενα ραντεβού.' : 'Δεν υπάρχουν παλαιότερα ραντεβού.'}</h2><p className="mt-2 text-xs text-ink-500">{hasFilters ? 'Άλλαξε τις ημερομηνίες ή το όνομα του κατοικιδίου.' : 'Οι επισκέψεις σου θα εμφανίζονται εδώ.'}</p></div>}
    </ClinicPanel>
    {!loading && !error && <ClinicPagination page={page} totalPages={totalPages} onPageChange={setPage} />}
    {cancelDialog && <CancelDialog appointment={cancelDialog} onClose={() => setCancelDialog(null)} onSuccess={handleCancelSuccess} />}
    {rescheduleDialog && <RescheduleDialog appointment={rescheduleDialog} onClose={() => setRescheduleDialog(null)} onSuccess={handleRescheduleSuccess} />}
  </div>;
}
