'use client';


import { ClinicInput, ClinicButton, ClinicPanel, ClinicPageHeader, ClinicFilterTabs, ClinicListRow, ClinicStatusBadge, ClinicEmptyState, ClinicLoading } from '@/components/vet/ClinicUI';
import { useState, useMemo, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  useAllAppointments,
  approveAppointment,
  rejectAppointment,
  updateAppointmentStatus,
  downloadPrescription,
  rescheduleAppointment,
  useVetAvailableSlots,
  VetAppointment,
  VetAppointmentFilters,
} from '@/hooks/useVetData';
import { useAuth } from '@/contexts/AuthContext';
import DatePicker from '@/components/DatePicker';
import CalendarPicker from '@/components/CalendarPicker';
import { ClinicPagination as Pagination } from '@/components/vet/ClinicUI';
import { useToast } from '@/components/Toast';
import CreateAppointmentDialog from '@/components/vet/CreateAppointmentDialog';
import ExaminationDialog from '@/components/vet/ExaminationDialog';
import { api, getImageUrl } from '@/lib/api';
import ClinicAvatar from '@/components/vet/ClinicAvatar';

function todayLocal() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('el-GR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  pending: { label: 'Αναμονή', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800', dot: 'bg-amber-500 animate-pulse' },
  confirmed: { label: 'Επιβεβαιωμένο', bg: 'bg-clinic-50 border-clinic-100', text: 'text-clinic-800', dot: 'bg-clinic-500' },
  completed: { label: 'Ολοκληρώθηκε', bg: 'bg-green-50 border-green-100', text: 'text-green-800', dot: 'bg-green-500' },
  cancelled: { label: 'Ακυρώθηκε', bg: 'bg-red-50 border-red-100', text: 'text-red-800', dot: 'bg-red-500' },
};

function RescheduleDialog({
  appointment,
  onClose,
  onSuccess,
}: {
  appointment: VetAppointment;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const vetId = user?.id || appointment.vet_id;
  const { slots, loading: slotsLoading } = useVetAvailableSlots(vetId, selectedDate, appointment.duration_minutes, appointment.id);

  const handleSubmit = async () => {
    if (!selectedDate || !selectedSlot || slotsLoading || !slots.includes(selectedSlot)) return;
    try {
      setSubmitting(true);
      setError(null);
      const scheduledAt = `${selectedDate}T${selectedSlot}:00`;
      await rescheduleAppointment(appointment.id, scheduledAt);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Αποτυχία αναπρογραμματισμού');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>

      <div className="w-full">
        <div className="bg-white rounded-xl border border-ink-200 w-full" onClick={(e) => e.stopPropagation()}>
          <div className="border-b border-ink-200 p-5 relative [&_p]:text-ink-500">
            <button
              onClick={onClose}
              aria-label="Κλείσιμο αναπρογραμματισμού"
              className="absolute top-4 right-4 bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-xl font-semibold">Αναπρογραμματισμός Ραντεβού</h2>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                {appointment.pet?.image_url ? (
                  <img src={getImageUrl(appointment.pet.image_url)} alt={appointment.pet?.name || ''} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg">{appointment.pet?.type === 'Dog' ? '🐕' : appointment.pet?.type === 'Cat' ? '🐈' : '🐾'}</span>
                )}
              </div>
              <span className="font-semibold">{appointment.pet?.name || 'Ασθενής'}</span>
            </div>
            {appointment.pet_owner && (
              <p className="text-white/70 text-sm mt-1">Ιδιοκτήτης: {appointment.pet_owner.name}</p>
            )}
            <p className="text-white/60 text-sm mt-1">
              Τρέχον: {formatDate(appointment.scheduled_at)}, {formatTime(appointment.scheduled_at)}
            </p>
          </div>

          <div className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-3">Νέα Ημερομηνία</label>
              <CalendarPicker
                value={selectedDate}
                onChange={(d) => { setSelectedDate(d); setSelectedSlot(null); }}
                minDate={new Date()}
                accentColor="indigo"
              />
            </div>

            {selectedDate && (
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-2">Διαθέσιμες Ώρες</label>
                {slotsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <svg className="animate-spin h-5 w-5 text-clinic-600" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </div>
                ) : slots.length === 0 ? (
                  <p className="text-sm text-ink-400 text-center py-3">Δεν υπάρχουν διαθέσιμες ώρες</p>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {slots.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2 rounded-lg text-sm font-semibold transition-colors ${
                          selectedSlot === slot
                            ? 'bg-clinic-600 text-white'
                            : 'bg-clinic-50 text-clinic-700 hover:bg-clinic-100'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm font-medium">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <ClinicButton variant="secondary" type="button" onClick={onClose} className="flex-1">
                Ακύρωση
              </ClinicButton>
              <ClinicButton variant="primary"
                type="button"
                onClick={handleSubmit}
                disabled={submitting || slotsLoading || !selectedDate || !selectedSlot || !slots.includes(selectedSlot)}
                className="flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
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
              </ClinicButton>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function VetCancelDialog({
  appointment,
  onClose,
  onSuccess,
}: {
  appointment: VetAppointment;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const petName = appointment.pet?.name || 'Ασθενής';
  const ownerName = appointment.pet_owner?.name || '';

  const handleCancel = async () => {
    try {
      setSubmitting(true);
      setError(null);
      await updateAppointmentStatus(appointment.id, 'cancelled');
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Αποτυχία ακύρωσης');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>

      <div className="w-full">
        <div className="bg-white rounded-xl border border-ink-200 w-full" onClick={(e) => e.stopPropagation()}>
          <div className="p-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-ink-900 text-center mb-2">Ακύρωση Ραντεβού</h3>
            <p className="text-sm text-ink-500 text-center mb-4">
              Είστε σίγουροι ότι θέλετε να ακυρώσετε αυτό το ραντεβού;
            </p>

            <div className="bg-ink-50 rounded-xl p-4 mb-4 space-y-1 text-sm">
              <p className="text-ink-700"><span className="font-semibold">Ασθενής:</span> {petName}</p>
              {ownerName && <p className="text-ink-700"><span className="font-semibold">Ιδιοκτήτης:</span> {ownerName}</p>}
              <p className="text-ink-700"><span className="font-semibold">Ημερομηνία:</span> {formatDate(appointment.scheduled_at)}, {formatTime(appointment.scheduled_at)}</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm font-medium mb-4">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <ClinicButton variant="secondary"
                onClick={onClose}
                disabled={submitting}
                className="flex-1"
              >
                Πίσω
              </ClinicButton>
              <ClinicButton variant="danger"
                onClick={handleCancel}
                disabled={submitting}
                className="flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
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
              </ClinicButton>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function VetAppointmentsPage() {
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [page, setCurrentPage] = useState(1);
  const setPage = (value: number) => { setCurrentPage(value); setPanel(null); };
  const [dateFrom, setDateFrom] = useState(searchParams.get('dateFrom') || '');
  const [dateTo, setDateTo] = useState(searchParams.get('dateTo') || '');

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
  const [panel, setPanel] = useState<{ mode: 'details' | 'cancel' | 'exam' | 'reschedule' | 'create'; appointment?: VetAppointment } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const linkedId = searchParams.get('appointmentId');
  const [linkError, setLinkError] = useState('');
  useEffect(() => {
    if (!linkedId) return;
    let active = true;
    api.get<VetAppointment>(`/vet/appointments/${encodeURIComponent(linkedId)}`).then(appointment => { if(active) { setPanel({mode:'details',appointment}); setLinkError(''); } }).catch(() => { if(active)setLinkError('Το ραντεβού δεν είναι διαθέσιμο ή δεν έχετε πρόσβαση.'); });
    return () => {active=false};
  }, [linkedId]);

  const cancelDialog = panel?.mode === 'cancel' ? panel.appointment : null;
  const examAppointment = panel?.mode === 'exam' ? panel.appointment : null;
  const rescheduleDialog = panel?.mode === 'reschedule' ? panel.appointment : null;
  const setCancelDialog = (appointment: VetAppointment | null) => setPanel(appointment ? { mode: 'cancel', appointment } : null);
  const setExamAppointment = (appointment: VetAppointment | null) => setPanel(appointment ? { mode: 'exam', appointment } : null);
  const setRescheduleDialog = (appointment: VetAppointment | null) => setPanel(appointment ? { mode: 'reschedule', appointment } : null);
  useEffect(() => {
    if (panel) {
      panelRef.current?.focus({ preventScroll: true });
      if (window.innerWidth < 1280) panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [panel]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    if (searchInput.trim() === search) return;
    const timer = setTimeout(() => { setSearch(searchInput.trim()); setCurrentPage(1); setPanel(null); }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, search]);

  const filters = useMemo<VetAppointmentFilters>(() => ({
    search: search || undefined,
    status: statusFilter || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    sort: sortOrder,
  }), [search, statusFilter, dateFrom, dateTo, sortOrder]);

  const toast = useToast();
  const { appointments, total, totalPages, loading, error, refetch } = useAllAppointments(page, 10, filters);

  const days = useMemo(() => {
    const result = new Map<string, VetAppointment[]>();
    for (const appointment of appointments) {
      const date = new Date(appointment.scheduled_at).toLocaleDateString('en-CA');
      const items = result.get(date) || [];
      items.push(appointment);
      result.set(date, items);
    }
    return Array.from(result.entries());
  }, [appointments]);
  const weekStart = () => {
    const d = new Date();
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };
  const weekEnd = () => {
    const d = new Date();
    d.setDate(d.getDate() + (7 - (d.getDay() || 7)));
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };

  const hasDateFilters = dateFrom || dateTo;

  const clearDateFilters = () => {
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const [pendingAction, setPendingAction] = useState(false);
  const handleApprove = async (id: string) => {
    if (pendingAction) return;
    setPendingAction(true);
    try {
      await approveAppointment(id);
      refetch();
      setPanel(null);
      toast.success('Το ραντεβού εγκρίθηκε.');
    } catch {
      toast.error('Κάτι πήγε στραβά. Παρακαλώ δοκιμάστε ξανά.');
    } finally { setPendingAction(false); }
  };

  const handleReject = async (id: string) => {
    if (pendingAction) return;
    setPendingAction(true);
    try {
      await rejectAppointment(id);
      refetch();
      setPanel(null);
      toast.success('Το ραντεβού απορρίφθηκε.');
    } catch {
      toast.error('Κάτι πήγε στραβά. Παρακαλώ δοκιμάστε ξανά.');
    } finally { setPendingAction(false); }
  };

  const handleCancelSuccess = () => {
    setCancelDialog(null);
    refetch();
  };

  const handleExamSuccess = () => {
    setExamAppointment(null);
    refetch();
  };

  const handleRescheduleSuccess = () => {
    setRescheduleDialog(null);
    refetch();
    toast.success('Το ραντεβού αναπρογραμματίστηκε.');
  };

  const handleDownloadPrescription = async (appointmentId: string) => {
    if (downloadingId) return;
    setDownloadingId(appointmentId);
    try {
      await downloadPrescription(appointmentId);
    } catch {
      alert('Κάτι πήγε στραβά. Παρακαλώ δοκιμάστε ξανά.');
    } finally {
      setDownloadingId(null);
    }
  };

  const statusFilters = [
    { value: '', label: 'Όλα' },
    { value: 'pending', label: 'Αναμονή' },
    { value: 'confirmed', label: 'Επιβεβαιωμένα' },
    { value: 'completed', label: 'Ολοκληρωμένα' },
    { value: 'cancelled', label: 'Ακυρωμένα' },
  ];

  return (
    <div className="mx-auto">{linkError && <p role="alert" className="mb-4 text-sm text-red-700">{linkError}</p>}
      <ClinicPageHeader title="Ραντεβού" description="Το πρόγραμμα, τα αιτήματα και το ιστορικό επισκέψεων του κτηνιατρείου." actions={<ClinicButton className="bg-clinic-600! border-clinic-700! text-white!" onClick={() => setPanel({ mode: 'create' })}>+ Νέο Ραντεβού</ClinicButton>} />
      <div className={`grid items-start gap-4 ${panel ? 'xl:grid-cols-[minmax(0,1fr)_380px]' : ''}`}><div className="min-w-0">
      <ClinicPanel className="overflow-hidden">
      <ClinicFilterTabs label="Κατάσταση ραντεβού" options={statusFilters} value={statusFilter} onChange={value => { setStatusFilter(value); setPage(1); }} />

      <div className="border-b border-ink-200 px-4 py-3 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <ClinicInput type="search" aria-label="Αναζήτηση ραντεβού" placeholder="Αναζήτηση ασθενή ή κηδεμόνα…" maxLength={100} value={searchInput} onChange={e => setSearchInput(e.target.value)} className="w-full sm:w-80 sm:max-w-full" />
          <span role="status" className="text-xs text-ink-500 sm:ml-auto">{loading ? 'Αναζήτηση…' : `${total} ραντεβού`}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div role="group" aria-label="Περίοδος" className="inline-flex rounded-lg border border-ink-200 p-1">
            {[{label:'Όλες οι ημέρες', from:'', to:''}, {label:'Σήμερα', from:todayLocal(), to:todayLocal()}, {label:'Αυτή την εβδομάδα', from:weekStart(), to:weekEnd()}].map(period => <button key={period.label} type="button" aria-pressed={dateFrom === period.from && dateTo === period.to} onClick={() => { setDateFrom(period.from); setDateTo(period.to); setPage(1); }} className={`rounded-md px-2.5 py-2 text-xs font-medium ${dateFrom === period.from && dateTo === period.to ? 'bg-clinic-50 text-clinic-800' : 'text-ink-500 hover:bg-ink-50'}`}>{period.label}</button>)}
          </div>
          <details className="relative">
            <summary className="cursor-pointer rounded-lg border border-ink-200 px-3 py-2 text-xs text-ink-600">Ημερομηνίες</summary>
            <div className="mt-2 flex flex-wrap gap-2 rounded-lg border border-ink-200 bg-white p-3">
              <DatePicker value={dateFrom} onChange={handleDateFrom} placeholder="Από" />
              <DatePicker value={dateTo} onChange={handleDateTo} placeholder="Έως" />
              {hasDateFilters && <ClinicButton onClick={clearDateFilters}>Καθαρισμός</ClinicButton>}
            </div>
          </details>
          <ClinicButton variant="ghost" className="sm:ml-auto" onClick={() => { setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc'); setPage(1); }}>{sortOrder === 'desc' ? '↓ Νεότερα πρώτα' : '↑ Παλαιότερα πρώτα'}</ClinicButton>
        </div>
        {hasDateFilters && <p className="text-xs text-ink-500">{dateFrom ? formatDate(`${dateFrom}T12:00:00`) : 'Αρχή ιστορικού'} — {dateTo ? formatDate(`${dateTo}T12:00:00`) : 'Χωρίς λήξη'}</p>}
      </div>

      {/* Content */}
      <div>
        {loading ? (
          <ClinicLoading label="Φόρτωση ραντεβού…" />
        ) : error ? (
          <div role="alert" className="p-8 text-center text-sm text-red-700">{error}</div>
        ) : appointments.length === 0 ? (
          <ClinicEmptyState title="Δεν υπάρχουν ραντεβού" description={hasDateFilters || statusFilter || search ? 'Δεν βρέθηκαν επισκέψεις με αυτά τα φίλτρα. Δοκίμασε άλλη ημερομηνία ή κατάσταση.' : 'Τα ραντεβού του κτηνιατρείου θα εμφανιστούν εδώ.'} />
        ) : (
          <div>
            {days.map(([day, items]) => <section key={day} aria-label={formatDate(items[0].scheduled_at)}>
              <div className="flex items-center justify-between border-y border-ink-200 bg-ink-50 px-4 py-2.5 sm:px-5">
                <h2 className="text-xs font-semibold text-ink-700">{new Date(items[0].scheduled_at).toLocaleDateString('el-GR', {weekday:'long', day:'numeric', month:'long', year:'numeric'})}</h2>
                <span className="ml-3 shrink-0 text-xs text-ink-500">{items.length} στη σελίδα</span>
              </div>
              {items.map(apt => <ClinicListRow key={apt.id} className={panel?.appointment?.id === apt.id ? 'py-2! bg-clinic-50/60! shadow-[inset_3px_0_0_var(--color-clinic-600)]' : 'py-2!'}>
                <div className="grid grid-cols-[76px_minmax(0,1fr)] items-center gap-x-3 gap-y-1.5 md:grid-cols-[76px_minmax(0,1.3fr)_minmax(0,1fr)_128px_auto]">
                  <p className="whitespace-nowrap text-sm font-semibold tabular-nums text-ink-900">{formatTime(apt.scheduled_at)}<span className="ml-1.5 text-xs font-normal text-ink-500">{apt.duration_minutes}′</span></p>
                  <div className="flex min-w-0 items-center gap-2.5"><ClinicAvatar name={apt.pet?.name || 'Ασθενής'} imageUrl={apt.pet?.image_url} /><div className="min-w-0">
                    <button aria-label={`Λεπτομέρειες: ${apt.pet?.name || 'Ασθενής'}`} aria-pressed={panel?.appointment?.id === apt.id} onClick={() => setPanel({mode:'details', appointment:apt})} className="block max-w-full truncate text-left text-sm font-semibold text-ink-900 underline-offset-4 hover:text-clinic-700 hover:underline">{apt.pet?.name || 'Ασθενής'}</button>
                    <p className="truncate text-xs text-ink-500">{apt.pet_owner?.name || 'Χωρίς στοιχεία κηδεμόνα'}</p>
                    </div></div>
                    <p className="col-start-2 min-w-0 truncate text-sm text-ink-600 md:col-start-auto">{apt.type}{apt.group_id && <span className="ml-2 text-xs text-clinic-700">Ομαδική επίσκεψη</span>}</p>
                    <div className="col-start-2 md:col-start-auto"><ClinicStatusBadge status={apt.status}>{statusConfig[apt.status]?.label || apt.status}</ClinicStatusBadge></div>
                  <div className="col-start-2 md:col-start-auto md:justify-self-end">
                    {apt.status === 'pending' ? <ClinicButton disabled={pendingAction} variant="primary" onClick={() => handleApprove(apt.id)}>{apt.group_id ? 'Έγκριση ομάδας' : 'Έγκριση'}</ClinicButton> : apt.status === 'confirmed' ? <ClinicButton onClick={() => setExamAppointment(apt)}>Εξέταση</ClinicButton> : <ClinicButton variant="ghost" onClick={() => setPanel({mode:'details', appointment:apt})}>Προβολή</ClinicButton>}
                  </div>
                </div>
              </ClinicListRow>)}
            </section>)}
          </div>
        )}
      </div>
      </ClinicPanel>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      </div>
      {panel && <div ref={panelRef} tabIndex={-1} aria-label="Πάνελ ραντεβού" className="min-w-0 scroll-mt-20 outline-none xl:sticky xl:top-20 xl:max-h-[calc(100vh-6rem)] xl:overflow-y-auto">
      {panel.mode === 'create' && <CreateAppointmentDialog embedded open onClose={() => setPanel(null)} onSuccess={() => { setPanel(null); void refetch(); toast.success('Το ραντεβού δημιουργήθηκε.'); }} />}
      {panel.mode === 'details' && panel.appointment && <ClinicPanel className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-ink-200 px-5 py-3"><h2 className="text-sm font-semibold">Λεπτομέρειες ραντεβού</h2><ClinicButton aria-label="Κλείσιμο λεπτομερειών" variant="ghost" onClick={() => setPanel(null)}>×</ClinicButton></div>
        <div className="space-y-5 p-5">
          <div><div className="mb-3"><ClinicAvatar large name={panel.appointment.pet?.name || 'Ασθενής'} imageUrl={panel.appointment.pet?.image_url} /></div><ClinicStatusBadge status={panel.appointment.status}>{statusConfig[panel.appointment.status]?.label || panel.appointment.status}</ClinicStatusBadge><h3 className="mt-3 break-words text-2xl font-semibold tracking-tight">{panel.appointment.pet?.name || 'Ασθενής'}</h3><p className="mt-1 text-sm text-ink-500">{panel.appointment.type}</p></div>
          <div className="rounded-lg border border-clinic-100 bg-clinic-50/50 p-4"><p className="text-xs font-medium text-clinic-800">Προγραμματισμένη επίσκεψη</p><p className="mt-2 text-sm font-semibold">{formatDate(panel.appointment.scheduled_at)}</p><p className="mt-1 text-xl font-semibold tabular-nums">{formatTime(panel.appointment.scheduled_at)} <span className="text-xs font-normal text-ink-500">· {panel.appointment.duration_minutes} λεπτά</span></p></div>
          <section className="border-b border-ink-200 pb-4"><h4 className="text-xs font-semibold text-ink-500">Κηδεμόνας</h4><p className="mt-2 break-words text-sm font-medium">{panel.appointment.pet_owner?.name || 'Δεν έχουν καταχωρηθεί στοιχεία.'}</p>{panel.appointment.pet_owner?.phone && <a className="mt-2 inline-block text-sm text-clinic-700 underline underline-offset-4" href={`tel:${panel.appointment.pet_owner.phone}`}>{panel.appointment.pet_owner.phone}</a>}</section>
          <section><h4 className="text-xs font-semibold text-ink-500">Σημειώσεις επίσκεψης</h4><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-ink-600">{panel.appointment.notes || 'Δεν υπάρχουν σημειώσεις.'}</p></section>
          {panel.appointment.group_id && <p className="rounded-lg bg-ink-50 p-3 text-xs leading-5 text-ink-500">Ομαδική επίσκεψη. Η έγκριση, η απόρριψη, η αλλαγή ώρας και η ακύρωση ακολουθούν τους κανόνες της ομάδας. Η εξέταση αφορά τον επιλεγμένο ασθενή.</p>}
        </div>
        <div className="border-t border-ink-200 bg-ink-50/50 p-4">
<div className="flex flex-wrap gap-2">{panel.appointment.status === 'confirmed' && <><ClinicButton variant="primary" onClick={() => setExamAppointment(panel.appointment!)}>Εξέταση</ClinicButton><ClinicButton onClick={() => setRescheduleDialog(panel.appointment!)}>Αναπρογρ.</ClinicButton><ClinicButton variant="danger" onClick={() => setCancelDialog(panel.appointment!)}>Ακύρωση</ClinicButton></>}{panel.appointment.status === 'pending' && <><ClinicButton variant="primary" disabled={pendingAction} onClick={() => handleApprove(panel.appointment!.id)}>Έγκριση</ClinicButton><ClinicButton variant="danger" disabled={pendingAction} onClick={() => handleReject(panel.appointment!.id)}>Απόρριψη</ClinicButton></>}{panel.appointment.status === 'completed' && <ClinicButton disabled={!!downloadingId} onClick={() => handleDownloadPrescription(panel.appointment!.id)}>Λήψη Συνταγής</ClinicButton>}</div></div></ClinicPanel>}
      {/* Cancel Dialog */}
      {cancelDialog && (
        <VetCancelDialog
          key={cancelDialog.id}
          appointment={cancelDialog}
          onClose={() => setCancelDialog(null)}
          onSuccess={handleCancelSuccess}
        />
      )}

      {/* Examination Dialog */}
      {examAppointment && (
        <ExaminationDialog
          embedded
          key={examAppointment.id}
          appointment={examAppointment}
          onClose={() => setExamAppointment(null)}
          onSuccess={handleExamSuccess}
        />
      )}

      {/* Reschedule Dialog */}
      {rescheduleDialog && (
        <RescheduleDialog
          key={rescheduleDialog.id}
          appointment={rescheduleDialog}
          onClose={() => setRescheduleDialog(null)}
          onSuccess={handleRescheduleSuccess}
        />
      )}
      </div>}
      </div>
    </div>
  );
}
