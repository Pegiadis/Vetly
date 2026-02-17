'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  useAllAppointments,
  approveAppointment,
  rejectAppointment,
  updateAppointmentStatus,
  completeExamination,
  VetAppointment,
  ExaminationMedication,
} from '@/hooks/useVetData';

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

const emptyMedication: ExaminationMedication = {
  name: '',
  dosage: '',
  frequency: 'daily',
  duration_days: undefined,
  notes: '',
};

function ExaminationDialog({
  appointment,
  onClose,
  onSuccess,
}: {
  appointment: VetAppointment;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [diagnosis, setDiagnosis] = useState('');
  const [examinationNotes, setExaminationNotes] = useState('');
  const [medications, setMedications] = useState<ExaminationMedication[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addMedication = () => {
    setMedications([...medications, { ...emptyMedication }]);
  };

  const removeMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const updateMedication = (index: number, field: keyof ExaminationMedication, value: string | number | undefined) => {
    setMedications(medications.map((med, i) => i === index ? { ...med, [field]: value } : med));
  };

  const handleSubmit = async () => {
    if (!diagnosis.trim()) {
      setError('Η διάγνωση είναι υποχρεωτική');
      return;
    }

    for (let i = 0; i < medications.length; i++) {
      if (!medications[i].name.trim() || !medications[i].dosage.trim()) {
        setError(`Το φάρμακο #${i + 1} χρειάζεται όνομα και δοσολογία`);
        return;
      }
    }

    try {
      setSubmitting(true);
      setError(null);
      await completeExamination(appointment.id, {
        diagnosis: diagnosis.trim(),
        examination_notes: examinationNotes.trim() || undefined,
        medications,
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Αποτυχία υποβολής');
    } finally {
      setSubmitting(false);
    }
  };

  const dt = new Date(appointment.scheduled_at);
  const timeStr = formatTime(appointment.scheduled_at);
  const dateStr = formatDate(appointment.scheduled_at);

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={onClose} />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-t-2xl p-6 text-white relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-xl font-bold">Ολοκλήρωση Εξέτασης</h2>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{appointment.pet?.type === 'Dog' ? '🐕' : appointment.pet?.type === 'Cat' ? '🐈' : '🐾'}</span>
                <span className="font-bold">{appointment.pet?.name || 'Ασθενής'}</span>
                <span className="text-white/70 text-sm">{appointment.pet?.breed}</span>
              </div>
              <span className="text-white/60">|</span>
              <span className="text-white/80 text-sm">{dateStr}, {timeStr}</span>
            </div>
            {appointment.pet_owner && (
              <p className="text-white/70 text-sm mt-1">Ιδιοκτήτης: {appointment.pet_owner.name}</p>
            )}
          </div>

          {/* Form */}
          <div className="p-6 space-y-6">
            {/* Diagnosis */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Διάγνωση <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="π.χ. Δερματίτιδα, Ωτίτιδα..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-slate-800"
              />
            </div>

            {/* Examination Notes */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Σημειώσεις Εξέτασης
              </label>
              <textarea
                value={examinationNotes}
                onChange={(e) => setExaminationNotes(e.target.value)}
                placeholder="Παρατηρήσεις, ευρήματα, οδηγίες..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-slate-800 resize-none"
              />
            </div>

            {/* Medications */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-bold text-slate-700">
                  Φαρμακευτική Αγωγή
                </label>
                <button
                  type="button"
                  onClick={addMedication}
                  className="flex items-center gap-1 text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Προσθήκη Φαρμάκου
                </button>
              </div>

              {medications.length === 0 && (
                <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-slate-400 text-sm">Δεν έχουν προστεθεί φάρμακα</p>
                  <button
                    type="button"
                    onClick={addMedication}
                    className="text-indigo-600 text-sm font-bold mt-1 hover:text-indigo-700"
                  >
                    + Προσθήκη πρώτου φαρμάκου
                  </button>
                </div>
              )}

              <div className="space-y-4">
                {medications.map((med, index) => (
                  <div key={index} className="bg-slate-50 rounded-xl p-4 border border-slate-100 relative">
                    <button
                      type="button"
                      onClick={() => removeMedication(index)}
                      className="absolute top-3 right-3 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <p className="text-xs font-bold text-slate-400 mb-3">Φάρμακο #{index + 1}</p>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Όνομα *</label>
                        <input
                          type="text"
                          value={med.name}
                          onChange={(e) => updateMedication(index, 'name', e.target.value)}
                          placeholder="π.χ. Amoxicillin"
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Δοσολογία *</label>
                        <input
                          type="text"
                          value={med.dosage}
                          onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                          placeholder="π.χ. 250mg"
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Διάρκεια (ημέρες)</label>
                        <input
                          type="number"
                          value={med.duration_days ?? ''}
                          onChange={(e) => updateMedication(index, 'duration_days', e.target.value ? parseInt(e.target.value) : undefined)}
                          placeholder="π.χ. 7"
                          min={1}
                          max={365}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-slate-800"
                        />
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="text-xs text-slate-500 mb-1 block">Σημειώσεις</label>
                      <input
                        type="text"
                        value={med.notes ?? ''}
                        onChange={(e) => updateMedication(index, 'notes', e.target.value)}
                        placeholder="π.χ. Μετά το φαγητό"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-slate-800"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm font-medium">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
              >
                Ακύρωση
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 px-4 py-3 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Υποβολή...
                  </span>
                ) : (
                  'Ολοκλήρωση Εξέτασης'
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
  const [statusFilter, setStatusFilter] = useState<string>('');
  const { appointments, loading, error, refetch } = useAllAppointments(statusFilter || undefined);
  const [examAppointment, setExamAppointment] = useState<VetAppointment | null>(null);
  const [cancelDialog, setCancelDialog] = useState<VetAppointment | null>(null);

  const sortedAppointments = useMemo(() => {
    return [...appointments].sort((a, b) =>
      new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime()
    );
  }, [appointments]);

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

  const handleExamSuccess = () => {
    setExamAppointment(null);
    refetch();
  };

  const handleCancelSuccess = () => {
    setCancelDialog(null);
    refetch();
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
          <p className="text-slate-500 mt-1">Διαχείριση και ολοκλήρωση εξετάσεων</p>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {statusFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
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
        ) : sortedAppointments.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-lg font-medium">Δεν υπάρχουν ραντεβού</p>
            <p className="text-sm mt-1">Τα ραντεβού θα εμφανιστούν εδώ</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedAppointments.map((apt) => {
              const cfg = statusConfig[apt.status] || statusConfig.confirmed;
              return (
                <div
                  key={apt.id}
                  className={`p-4 rounded-xl border transition-all ${cfg.bg}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {/* Pet icon */}
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

                    {/* Actions */}
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
                      {(apt.status === 'confirmed' || apt.status === 'pending') && (
                        <button
                          onClick={() => setExamAppointment(apt)}
                          className="px-3 py-2 text-xs font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          Εξέταση
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Examination Dialog */}
      {examAppointment && (
        <ExaminationDialog
          appointment={examAppointment}
          onClose={() => setExamAppointment(null)}
          onSuccess={handleExamSuccess}
        />
      )}

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
