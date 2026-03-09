'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
  useDashboardStats,
  useTodayAppointments,
  usePendingAppointments,
  usePatients,
  completeExamination,
  useVetProfile,
  toggleOnCall,
  VetAppointment,
  ExaminationMedication,
} from '@/hooks/useVetData';
import CreateAppointmentDialog from '@/components/vet/CreateAppointmentDialog';
import SkeletonStats from '@/components/skeletons/SkeletonStats';
import SkeletonAppointmentCard from '@/components/skeletons/SkeletonAppointmentCard';
import SkeletonPetCard from '@/components/skeletons/SkeletonPetCard';

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('el-GR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('el-GR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

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

  const timeStr = formatTime(appointment.scheduled_at);
  const dateStr = formatDate(appointment.scheduled_at);

  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
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

          <div className="p-6 space-y-6">
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

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm font-medium">
                {error}
              </div>
            )}

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

export default function VetDashboardPage() {
  const { user } = useAuth();
  const { stats, loading: statsLoading } = useDashboardStats();
  const { appointments: todayAppointments, loading: todayLoading, refetch: refetchToday } = useTodayAppointments();
  const { appointments: pendingAppointments, loading: pendingLoading } = usePendingAppointments();
  const { patients: recentPatients, loading: patientsLoading } = usePatients();
  const [examAppointment, setExamAppointment] = useState<VetAppointment | null>(null);
  const [showCreateAppt, setShowCreateAppt] = useState(false);
  const { profile } = useVetProfile();
  const [isOnCall, setIsOnCall] = useState(false);
  const [togglingOnCall, setTogglingOnCall] = useState(false);

  useEffect(() => {
    if (profile) setIsOnCall(profile.is_on_call);
  }, [profile]);

  const handleToggleOnCall = async () => {
    if (togglingOnCall) return;
    const newValue = !isOnCall;
    setIsOnCall(newValue);
    setTogglingOnCall(true);
    try {
      await toggleOnCall(newValue);
    } catch {
      setIsOnCall(!newValue);
    } finally {
      setTogglingOnCall(false);
    }
  };

  const loading = statsLoading || todayLoading || pendingLoading || patientsLoading;

  const handleExamSuccess = () => {
    setExamAppointment(null);
    refetchToday();
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="animate-pulse h-8 bg-gray-200 rounded w-64 mb-2" />
          <div className="animate-pulse h-4 bg-gray-200 rounded w-48" />
        </div>
        <SkeletonStats count={6} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonAppointmentCard key={i} />)}
          </div>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonPetCard key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard Ιατρείου</h1>
        <p className="text-slate-500 mt-1">Καλώς ήρθατε, {user?.name || 'Κτηνίατρε'}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <Link
          href="/vet/appointments"
          className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:border-indigo-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="bg-indigo-100 p-3 rounded-xl text-indigo-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase">Σήμερα</p>
              <h3 className="text-2xl font-bold text-slate-800">{stats?.today_appointments ?? 0}</h3>
            </div>
          </div>
        </Link>

        <Link
          href="/vet/pending"
          className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:border-amber-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="bg-amber-100 p-3 rounded-xl text-amber-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase">Εκκρεμούν</p>
              <h3 className="text-2xl font-bold text-slate-800">{stats?.pending_appointments ?? 0}</h3>
            </div>
          </div>
        </Link>

        <Link
          href="/vet/clients"
          className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:border-teal-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="bg-teal-100 p-3 rounded-xl text-teal-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase">Κατοικίδια</p>
              <h3 className="text-2xl font-bold text-slate-800">{stats?.total_patients ?? 0}</h3>
            </div>
          </div>
        </Link>

        <Link
          href="/vet/reviews"
          className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:border-rose-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="bg-rose-100 p-3 rounded-xl text-rose-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase">Rating</p>
              <h3 className="text-2xl font-bold text-slate-800">{Number(stats?.average_rating ?? 0).toFixed(1)}</h3>
            </div>
          </div>
        </Link>

        <Link
          href="/vet/analytics"
          className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:border-emerald-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase">Analytics</p>
              <p className="text-sm font-bold text-slate-800 mt-1">Προβολή</p>
            </div>
          </div>
        </Link>

        <button
          onClick={handleToggleOnCall}
          disabled={togglingOnCall}
          className={`rounded-2xl p-5 shadow-sm border transition-all text-left ${
            isOnCall
              ? 'bg-green-50 border-green-200 hover:border-green-300'
              : 'bg-white border-slate-100 hover:border-green-300'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${isOnCall ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase">Εφημερία</p>
              <h3 className={`text-lg font-bold ${isOnCall ? 'text-green-700' : 'text-slate-400'}`}>
                {isOnCall ? 'Ενεργή' : 'Ανενεργή'}
              </h3>
            </div>
          </div>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pending Requests — Compact */}
          {pendingAppointments.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-amber-100 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-500" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse" />
                  <h3 className="text-lg font-bold text-slate-800">Αιτήματα για Έγκριση</h3>
                  <span className="bg-amber-100 text-amber-700 text-sm font-bold px-2.5 py-0.5 rounded-full">
                    {pendingAppointments.length}
                  </span>
                </div>
                <Link
                  href="/vet/pending"
                  className="px-4 py-2 bg-amber-50 text-amber-700 rounded-xl text-sm font-bold hover:bg-amber-100 transition-colors"
                >
                  Προβολή Όλων
                </Link>
              </div>
            </div>
          )}

          {/* Daily Schedule — Expanded */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800">Πρόγραμμα Ημέρας</h3>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-400 font-medium">
                  {todayAppointments.length} {todayAppointments.length === 1 ? 'ραντεβού' : 'ραντεβού'}
                </span>
                <button
                  onClick={() => setShowCreateAppt(true)}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Νέο Ραντεβού
                </button>
              </div>
            </div>

            {todayAppointments.length > 0 ? (
              <div className="space-y-0 relative">
                <div className="absolute left-[4rem] top-2 bottom-2 w-0.5 bg-slate-100" />
                {todayAppointments.map(apt => {
                  const isCompleted = apt.status === 'completed';
                  const isConfirmed = apt.status === 'confirmed';
                  return (
                    <div
                      key={apt.id}
                      className="flex gap-4 items-start relative py-3 group hover:bg-slate-50 rounded-xl px-2 transition-colors -mx-2"
                    >
                      <div className="w-12 text-sm font-bold text-slate-500 pt-1">{formatTime(apt.scheduled_at)}</div>
                      <div className={`w-3 h-3 rounded-full mt-2 relative z-10 ring-4 ring-white group-hover:ring-slate-50 ${isCompleted ? 'bg-green-500' : 'bg-indigo-500'}`} />
                      <div className={`flex-1 p-5 rounded-xl border ${isCompleted ? 'bg-green-50 border-green-100' : 'bg-indigo-50 border-indigo-100'}`}>
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg">{apt.pet?.type === 'Dog' ? '🐕' : apt.pet?.type === 'Cat' ? '🐈' : '🐾'}</span>
                              <h4 className={`font-bold ${isCompleted ? 'text-green-900' : 'text-indigo-900'}`}>
                                {apt.pet?.name || 'Κατοικίδιο'}
                              </h4>
                              {apt.pet?.breed && (
                                <span className={`text-xs ${isCompleted ? 'text-green-600' : 'text-indigo-600'}`}>
                                  {apt.pet.breed}
                                </span>
                              )}
                              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${isCompleted ? 'bg-green-200 text-green-800' : 'bg-indigo-200 text-indigo-800'}`}>
                                {isCompleted ? 'Ολοκληρώθηκε' : 'Επιβεβαιωμένο'}
                              </span>
                            </div>
                            <p className={`text-sm font-medium mb-2 ${isCompleted ? 'text-green-700' : 'text-indigo-700'}`}>
                              {apt.type}
                            </p>
                            <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-xs ${isCompleted ? 'text-green-600/80' : 'text-indigo-600/80'}`}>
                              <span className="flex items-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                {apt.pet_owner?.name || '-'}
                              </span>
                              {apt.pet_owner?.phone && (
                                <span className="flex items-center gap-1">
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                  </svg>
                                  {apt.pet_owner.phone}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {apt.duration_minutes} λεπτά
                              </span>
                            </div>
                            {apt.notes && (
                              <p className={`text-xs mt-2 italic px-2 py-1 rounded-lg ${isCompleted ? 'bg-green-100/50 text-green-700' : 'bg-indigo-100/50 text-indigo-700'}`}>
                                {apt.notes}
                              </p>
                            )}
                          </div>
                          {isConfirmed && (
                            <button
                              onClick={() => setExamAppointment(apt)}
                              className="shrink-0 px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
                            >
                              Εξέταση
                            </button>
                          )}
                          {isCompleted && (
                            <div className="shrink-0 p-2 bg-green-200 rounded-full">
                              <svg className="w-4 h-4 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 text-slate-400">
                <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                Κανένα ραντεβού για σήμερα.
              </div>
            )}

            <Link
              href="/vet/schedule"
              className="w-full mt-4 py-2 text-indigo-600 font-bold text-sm bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors block text-center"
            >
              Προβολή Εβδομάδας
            </Link>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Profile Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center">
            <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-4 border-4 border-slate-50 bg-indigo-100 flex items-center justify-center">
              <span className="text-indigo-600 font-bold text-2xl">{user?.name?.charAt(0) || '?'}</span>
            </div>
            <h3 className="font-bold text-slate-900">{user?.name || 'Κτηνίατρος'}</h3>
            <div className="flex justify-center gap-2 text-xs text-slate-500 mt-2 mb-4">
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                {Number(stats?.average_rating ?? 0).toFixed(1)} ({stats?.total_reviews ?? 0} reviews)
              </span>
            </div>
            <Link
              href="/vet/settings"
              className="w-full py-2 border border-slate-200 rounded-xl text-slate-600 text-sm font-bold hover:bg-slate-50 transition-colors block"
            >
              Επεξεργασία Προφίλ
            </Link>
          </div>

          {/* Recent Patients */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center justify-between">
              Πρόσφατα Κατοικίδια
              <Link href="/vet/clients" className="text-xs text-indigo-600 font-bold hover:text-indigo-800">
                Όλοι
              </Link>
            </h3>
            <div className="space-y-3">
              {recentPatients.length > 0 ? (
                recentPatients.slice(0, 4).map((patient) => (
                  <Link
                    key={patient.id}
                    href="/vet/clients"
                    className="flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold">
                        {patient.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">
                          {patient.name}
                        </p>
                        <p className="text-xs text-slate-400">{patient.breed} {patient.age ? `\u2022 ${patient.age} Ετών` : ''}</p>
                      </div>
                    </div>
                    <div className="p-2 text-slate-300 group-hover:text-indigo-600 transition-colors">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-slate-400 py-2">Δεν υπάρχουν ασθενείς ακόμα.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Examination Dialog */}
      {examAppointment && (
        <ExaminationDialog
          appointment={examAppointment}
          onClose={() => setExamAppointment(null)}
          onSuccess={handleExamSuccess}
        />
      )}

      {/* Create Appointment Dialog */}
      <CreateAppointmentDialog
        open={showCreateAppt}
        onClose={() => setShowCreateAppt(false)}
        onSuccess={refetchToday}
      />
    </div>
  );
}
