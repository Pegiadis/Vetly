'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  useAllAppointments,
  approveAppointment,
  rejectAppointment,
  updateAppointmentStatus,
  downloadPrescription,
  VetAppointment,
  VetAppointmentFilters,
} from '@/hooks/useVetData';
import DatePicker from '@/components/DatePicker';
import Pagination from '@/components/Pagination';

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
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [cancelDialog, setCancelDialog] = useState<VetAppointment | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const filters = useMemo<VetAppointmentFilters>(() => ({
    status: statusFilter || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  }), [statusFilter, dateFrom, dateTo]);

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
    } catch {
      // silently fail
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectAppointment(id);
      refetch();
    } catch {
      // silently fail
    }
  };

  const handleCancelSuccess = () => {
    setCancelDialog(null);
    refetch();
  };

  const handleDownloadPrescription = async (appointmentId: string) => {
    if (downloadingId) return;
    setDownloadingId(appointmentId);
    try {
      await downloadPrescription(appointmentId);
    } catch {
      // silent
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
        <DatePicker
          value={dateFrom}
          onChange={(v) => { setDateFrom(v); setPage(1); }}
          placeholder="Από"
        />
        <DatePicker
          value={dateTo}
          onChange={(v) => { setDateTo(v); setPage(1); }}
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
        <span className="text-xs text-slate-400 ml-auto font-medium">{total} αποτελέσματα</span>
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
                        <div className="text-2xl mt-0.5">
                          {apt.pet?.type === 'Dog' ? '🐕' : apt.pet?.type === 'Cat' ? '🐈' : '🐾'}
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
                          <button
                            onClick={() => setCancelDialog(apt)}
                            className="px-3 py-2 text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            Ακύρωση
                          </button>
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
                        <button
                          onClick={() => setCancelDialog(first)}
                          className="px-3 py-2 text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          Ακύρωση Όλων
                        </button>
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
                            <span className="text-lg">
                              {apt.pet?.type === 'Dog' ? '🐕' : apt.pet?.type === 'Cat' ? '🐈' : '🐾'}
                            </span>
                            <div>
                              <span className="font-bold text-sm text-slate-800">{apt.pet?.name || 'Ασθενής'}</span>
                              <span className="text-xs text-slate-500 ml-2">{apt.type}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
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
    </div>
  );
}
