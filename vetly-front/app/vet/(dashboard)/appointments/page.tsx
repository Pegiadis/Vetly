'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
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
import Pagination from '@/components/Pagination';
import { useToast } from '@/components/Toast';
import ExaminationDialog from '@/components/vet/ExaminationDialog';
import { getImageUrl } from '@/lib/api';

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' });
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
  confirmed: { label: 'Επιβεβαιωμένο', bg: 'bg-indigo-50 border-indigo-100', text: 'text-indigo-800', dot: 'bg-indigo-500' },
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
  const { slots, loading: slotsLoading } = useVetAvailableSlots(vetId, selectedDate);

  const handleSubmit = async () => {
    if (!selectedDate || !selectedSlot) return;
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
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-t-2xl p-6 text-white relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-xl font-bold">Αναπρογραμματισμός Ραντεβού</h2>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                {appointment.pet?.image_url ? (
                  <img src={getImageUrl(appointment.pet.image_url)} alt={appointment.pet?.name || ''} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg">{appointment.pet?.type === 'Dog' ? '🐕' : appointment.pet?.type === 'Cat' ? '🐈' : '🐾'}</span>
                )}
              </div>
              <span className="font-bold">{appointment.pet?.name || 'Ασθενής'}</span>
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
              <label className="block text-sm font-bold text-slate-700 mb-3">Νέα Ημερομηνία</label>
              <CalendarPicker
                value={selectedDate}
                onChange={(d) => { setSelectedDate(d); setSelectedSlot(null); }}
                minDate={new Date()}
                accentColor="indigo"
              />
            </div>

            {selectedDate && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Διαθέσιμες Ώρες</label>
                {slotsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <svg className="animate-spin h-5 w-5 text-indigo-600" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </div>
                ) : slots.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-3">Δεν υπάρχουν διαθέσιμες ώρες</p>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {slots.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2 rounded-lg text-sm font-bold transition-colors ${
                          selectedSlot === slot
                            ? 'bg-indigo-600 text-white'
                            : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
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
              <button type="button" onClick={onClose} className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors">
                Ακύρωση
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !selectedDate || !selectedSlot}
                className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
          <div className="p-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 text-center mb-2">Ακύρωση Ραντεβού</h3>
            <p className="text-sm text-slate-500 text-center mb-4">
              Είστε σίγουροι ότι θέλετε να ακυρώσετε αυτό το ραντεβού;
            </p>

            <div className="bg-slate-50 rounded-xl p-4 mb-4 space-y-1 text-sm">
              <p className="text-slate-700"><span className="font-bold">Ασθενής:</span> {petName}</p>
              {ownerName && <p className="text-slate-700"><span className="font-bold">Ιδιοκτήτης:</span> {ownerName}</p>}
              <p className="text-slate-700"><span className="font-bold">Ημερομηνία:</span> {formatDate(appointment.scheduled_at)}, {formatTime(appointment.scheduled_at)}</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm font-medium mb-4">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={submitting}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
              >
                Πίσω
              </button>
              <button
                onClick={handleCancel}
                disabled={submitting}
                className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
      </div>
    </>
  );
}

export default function VetAppointmentsPage() {
  const searchParams = useSearchParams();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [page, setPage] = useState(1);
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
  const [cancelDialog, setCancelDialog] = useState<VetAppointment | null>(null);
  const [examAppointment, setExamAppointment] = useState<VetAppointment | null>(null);
  const [rescheduleDialog, setRescheduleDialog] = useState<VetAppointment | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const filters = useMemo<VetAppointmentFilters>(() => ({
    status: statusFilter || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    sort: sortOrder,
  }), [statusFilter, dateFrom, dateTo, sortOrder]);

  const toast = useToast();
  const { appointments, total, totalPages, loading, error, refetch } = useAllAppointments(page, 10, filters);

  // Group appointments by group_id
  const grouped = useMemo(() => {
    const groups: VetAppointment[][] = [];
    const groupMap = new Map<string, VetAppointment[]>();
    for (const apt of appointments) {
      if (apt.group_id) {
        if (!groupMap.has(apt.group_id)) {
          const arr: VetAppointment[] = [];
          groupMap.set(apt.group_id, arr);
          groups.push(arr);
        }
        groupMap.get(apt.group_id)!.push(apt);
      } else {
        groups.push([apt]);
      }
    }
    return groups;
  }, [appointments]);

  const hasDateFilters = dateFrom || dateTo;

  const clearDateFilters = () => {
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const handleApprove = async (id: string) => {
    try {
      await approveAppointment(id);
      refetch();
      toast.success('Το ραντεβού εγκρίθηκε.');
    } catch {
      toast.error('Κάτι πήγε στραβά. Παρακαλώ δοκιμάστε ξανά.');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectAppointment(id);
      refetch();
      toast.success('Το ραντεβού απορρίφθηκε.');
    } catch {
      toast.error('Κάτι πήγε στραβά. Παρακαλώ δοκιμάστε ξανά.');
    }
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
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <Link href="/vet/dashboard" className="text-slate-500 text-sm font-bold mb-2 hover:text-indigo-600 block">
            &larr; Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">Ραντεβού</h1>
          <p className="text-slate-500 mt-1">Διαχείριση ραντεβού</p>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {statusFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => { setStatusFilter(f.value); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
              statusFilter === f.value
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Date Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <button
          onClick={() => {
            const today = new Date().toISOString().split('T')[0];
            setDateFrom(today);
            setDateTo(today);
            setPage(1);
          }}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
            dateFrom && dateTo && dateFrom === dateTo && dateFrom === new Date().toISOString().split('T')[0]
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Σήμερα
        </button>
        <DatePicker
          value={dateFrom}
          onChange={handleDateFrom}
          placeholder="Από"
        />
        <DatePicker
          value={dateTo}
          onChange={handleDateTo}
          placeholder="Έως"
        />
        {hasDateFilters && (
          <button
            onClick={clearDateFilters}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-bold text-red-500 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Καθαρισμός
          </button>
        )}
        <button
          onClick={() => { setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc'); setPage(1); }}
          className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
          title={sortOrder === 'desc' ? 'Νεότερα πρώτα' : 'Παλαιότερα πρώτα'}
        >
          <svg className={`w-4 h-4 transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
          </svg>
          {sortOrder === 'desc' ? 'Νεότερα' : 'Παλαιότερα'}
        </button>
        <span className="text-xs text-slate-400 font-medium">{total} αποτελέσματα</span>
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        {loading ? (
          <div className="text-center py-12 text-slate-500">
            <svg className="animate-spin h-8 w-8 mx-auto mb-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Φόρτωση ραντεβού...
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">{error}</div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-lg font-medium">Δεν υπάρχουν ραντεβού</p>
            <p className="text-sm mt-1">Τα ραντεβού θα εμφανιστούν εδώ</p>
          </div>
        ) : (
          <div className="space-y-3">
            {grouped.map((group) => {
              const isGroup = group.length > 1;
              const first = group[0];
              const cfg = statusConfig[first.status] || statusConfig.confirmed;

              if (!isGroup) {
                // Single appointment — render as before
                const apt = first;
                return (
                  <div
                    key={apt.id}
                    className={`p-4 rounded-xl border transition-all ${cfg.bg}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden mt-0.5">
                          {apt.pet?.image_url ? (
                            <img src={getImageUrl(apt.pet.image_url)} alt={apt.pet?.name || ''} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-2xl">{apt.pet?.type === 'Dog' ? '🐕' : apt.pet?.type === 'Cat' ? '🐈' : '🐾'}</span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-slate-800">{apt.pet?.name || 'Ασθενής'}</h4>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${cfg.text} ${apt.status === 'pending' ? 'bg-amber-200' : apt.status === 'completed' ? 'bg-green-200' : apt.status === 'cancelled' ? 'bg-red-200' : 'bg-indigo-200'}`}>
                              {cfg.label}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600">{apt.type}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                            <span>{formatDate(apt.scheduled_at)}</span>
                            <span>{formatTime(apt.scheduled_at)}</span>
                            <span>{apt.duration_minutes} λεπτά</span>
                          </div>
                          {apt.pet_owner && (
                            <p className="text-xs text-slate-500 mt-1">
                              Ιδιοκτήτης: {apt.pet_owner.name}
                              {apt.pet_owner.phone && ` · ${apt.pet_owner.phone}`}
                            </p>
                          )}
                          {apt.notes && (
                            <p className="text-xs text-slate-500 mt-2 italic bg-white/50 rounded-lg px-2 py-1">
                              {apt.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {apt.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleReject(apt.id)}
                              className="px-3 py-2 text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                            >
                              Απόρριψη
                            </button>
                            <button
                              onClick={() => handleApprove(apt.id)}
                              className="px-3 py-2 text-xs font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                            >
                              Έγκριση
                            </button>
                          </>
                        )}
                        {apt.status === 'confirmed' && (
                          <>
                            <button
                              onClick={() => setExamAppointment(apt)}
                              className="px-3 py-2 text-xs font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                              Εξέταση
                            </button>
                            <button
                              onClick={() => setRescheduleDialog(apt)}
                              className="px-3 py-2 text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
                            >
                              Αναπρογρ.
                            </button>
                            <button
                              onClick={() => setCancelDialog(apt)}
                              className="px-3 py-2 text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                            >
                              Ακύρωση
                            </button>
                          </>
                        )}
                        {apt.status === 'completed' && (
                          <button
                            onClick={() => handleDownloadPrescription(apt.id)}
                            disabled={downloadingId === apt.id}
                            className="px-3 py-2 text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                          >
                            {downloadingId === apt.id ? (
                              <>
                                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Λήψη...
                              </>
                            ) : (
                              <>
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Λήψη Συνταγής
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              // Grouped appointment — multiple pets in one card
              const groupKey = first.group_id || first.id;
              const ownerName = first.pet_owner?.name || '';
              const ownerPhone = first.pet_owner?.phone || '';
              const allPending = group.every(a => a.status === 'pending');
              const allConfirmed = group.every(a => a.status === 'confirmed');

              return (
                <div
                  key={groupKey}
                  className={`p-4 rounded-xl border transition-all ${cfg.bg}`}
                >
                  {/* Group header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">
                          {group.length} κατοικίδια
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${cfg.text} ${first.status === 'pending' ? 'bg-amber-200' : first.status === 'completed' ? 'bg-green-200' : first.status === 'cancelled' ? 'bg-red-200' : 'bg-indigo-200'}`}>
                          {cfg.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>{formatDate(first.scheduled_at)}</span>
                        <span>{formatTime(first.scheduled_at)}</span>
                        <span>{first.duration_minutes} λεπτά</span>
                      </div>
                      {ownerName && (
                        <p className="text-xs text-slate-500 mt-1">
                          Ιδιοκτήτης: {ownerName}
                          {ownerPhone && ` · ${ownerPhone}`}
                        </p>
                      )}
                      {first.notes && (
                        <p className="text-xs text-slate-500 mt-2 italic bg-white/50 rounded-lg px-2 py-1">
                          {first.notes}
                        </p>
                      )}
                    </div>
                    {/* Group-level actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {allPending && (
                        <>
                          <button
                            onClick={() => handleReject(first.id)}
                            className="px-3 py-2 text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            Απόρριψη Όλων
                          </button>
                          <button
                            onClick={() => handleApprove(first.id)}
                            className="px-3 py-2 text-xs font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Έγκριση Όλων
                          </button>
                        </>
                      )}
                      {allConfirmed && (
                        <>
                          <button
                            onClick={() => setRescheduleDialog(first)}
                            className="px-3 py-2 text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
                          >
                            Αναπρογρ.
                          </button>
                          <button
                            onClick={() => setCancelDialog(first)}
                            className="px-3 py-2 text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            Ακύρωση Όλων
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Individual pets in the group */}
                  <div className="space-y-2 border-t border-slate-200/50 pt-3">
                    {group.map((apt) => {
                      const petCfg = statusConfig[apt.status] || statusConfig.confirmed;
                      return (
                        <div key={apt.id} className="flex items-center justify-between bg-white/60 rounded-lg px-3 py-2">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                              {apt.pet?.image_url ? (
                                <img src={getImageUrl(apt.pet.image_url)} alt={apt.pet?.name || ''} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-lg">{apt.pet?.type === 'Dog' ? '🐕' : apt.pet?.type === 'Cat' ? '🐈' : '🐾'}</span>
                              )}
                            </div>
                            <div>
                              <span className="font-bold text-sm text-slate-800">{apt.pet?.name || 'Ασθενής'}</span>
                              <span className="text-xs text-slate-500 ml-2">{apt.type}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {apt.status === 'confirmed' && (
                              <button
                                onClick={() => setExamAppointment(apt)}
                                className="px-2 py-1 text-xs font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                              >
                                Εξέταση
                              </button>
                            )}
                            {apt.status === 'completed' && (
                              <button
                                onClick={() => handleDownloadPrescription(apt.id)}
                                disabled={downloadingId === apt.id}
                                className="px-2 py-1 text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50 flex items-center gap-1"
                              >
                                {downloadingId === apt.id ? (
                                  <>
                                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Λήψη...
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Συνταγή
                                  </>
                                )}
                              </button>
                            )}
                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${petCfg.text} ${apt.status === 'pending' ? 'bg-amber-200' : apt.status === 'completed' ? 'bg-green-200' : apt.status === 'cancelled' ? 'bg-red-200' : 'bg-indigo-200'}`}>
                              {petCfg.label}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Cancel Dialog */}
      {cancelDialog && (
        <VetCancelDialog
          appointment={cancelDialog}
          onClose={() => setCancelDialog(null)}
          onSuccess={handleCancelSuccess}
        />
      )}

      {/* Examination Dialog */}
      {examAppointment && (
        <ExaminationDialog
          appointment={examAppointment}
          onClose={() => setExamAppointment(null)}
          onSuccess={handleExamSuccess}
        />
      )}

      {/* Reschedule Dialog */}
      {rescheduleDialog && (
        <RescheduleDialog
          appointment={rescheduleDialog}
          onClose={() => setRescheduleDialog(null)}
          onSuccess={handleRescheduleSuccess}
        />
      )}
    </div>
  );
}
