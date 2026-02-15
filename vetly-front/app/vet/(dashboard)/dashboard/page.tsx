'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
  useDashboardStats,
  useTodayAppointments,
  usePendingAppointments,
  usePatients,
  approveAppointment,
  rejectAppointment,
} from '@/hooks/useVetData';

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('el-GR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function VetDashboardPage() {
  const { user } = useAuth();
  const { stats, loading: statsLoading } = useDashboardStats();
  const { appointments: todayAppointments, loading: todayLoading } = useTodayAppointments();
  const { appointments: pendingAppointments, loading: pendingLoading, refetch: refetchPending } = usePendingAppointments();
  const { patients: recentPatients, loading: patientsLoading } = usePatients();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loading = statsLoading || todayLoading || pendingLoading || patientsLoading;

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      await approveAppointment(id);
      await refetchPending();
    } catch {
      // silently fail
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setProcessingId(id);
    try {
      await rejectAppointment(id);
      await refetchPending();
    } catch {
      // silently fail
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
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
          href="/vet/patients"
          className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:border-teal-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="bg-teal-100 p-3 rounded-xl text-teal-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase">Ασθενείς</p>
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pending Requests */}
          {pendingAppointments.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-amber-100 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-500" />
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                  Αιτήματα για Έγκριση
                </span>
                <Link href="/vet/pending" className="text-sm text-amber-600 font-bold hover:underline">
                  Προβολή Όλων
                </Link>
              </h3>

              <div className="space-y-3">
                {pendingAppointments.slice(0, 3).map(apt => {
                  const isProcessing = processingId === apt.id;
                  return (
                    <div
                      key={apt.id}
                      className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-amber-200 transition-colors ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                      <div className="flex items-center gap-3 mb-3 sm:mb-0">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                          {apt.pet?.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800">
                            {apt.pet?.name || 'Κατοικίδιο'} <span className="text-slate-400 font-normal text-sm">({apt.pet_owner?.name || 'Ιδιοκτήτης'})</span>
                          </h4>
                          <p className="text-sm text-slate-600">{apt.type}</p>
                          <div className="flex items-center gap-1 mt-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded w-fit">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {new Date(apt.scheduled_at).toLocaleDateString('el-GR', { day: 'numeric', month: 'short' })}, {formatTime(apt.scheduled_at)}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => handleReject(apt.id)}
                          disabled={isProcessing}
                          className="flex-1 sm:flex-none p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Απόρριψη"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleApprove(apt.id)}
                          disabled={isProcessing}
                          className="flex-1 sm:flex-none px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-bold text-sm flex items-center justify-center gap-1 disabled:opacity-50"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Έγκριση
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Daily Schedule */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800">Πρόγραμμα Ημέρας</h3>
            </div>

            {todayAppointments.length > 0 ? (
              <div className="space-y-0 relative">
                <div className="absolute left-[4rem] top-2 bottom-2 w-0.5 bg-slate-100" />
                {todayAppointments.map(apt => (
                  <div
                    key={apt.id}
                    className="flex gap-4 items-start relative py-3 group hover:bg-slate-50 rounded-xl px-2 transition-colors -mx-2"
                  >
                    <div className="w-12 text-sm font-bold text-slate-500 pt-1">{formatTime(apt.scheduled_at)}</div>
                    <div className="w-3 h-3 bg-indigo-500 rounded-full mt-2 relative z-10 ring-4 ring-white group-hover:ring-slate-50" />
                    <div className="flex-1 bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-indigo-900">{apt.pet?.name || 'Κατοικίδιο'}</h4>
                          <p className="text-sm text-indigo-700 mb-1">{apt.type}</p>
                          <p className="text-xs text-indigo-600/70">Ιδιοκτήτης: {apt.pet_owner?.name || '-'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
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
              Πρόσφατοι Ασθενείς
              <Link href="/vet/patients" className="text-xs text-indigo-600 font-bold hover:text-indigo-800">
                Όλοι
              </Link>
            </h3>
            <div className="space-y-3">
              {recentPatients.length > 0 ? (
                recentPatients.slice(0, 4).map((patient) => (
                  <Link
                    key={patient.id}
                    href="/vet/patients"
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
    </div>
  );
}
