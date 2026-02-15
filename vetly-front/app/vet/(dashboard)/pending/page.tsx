'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePendingAppointments, approveAppointment, rejectAppointment } from '@/hooks/useVetData';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('el-GR', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('el-GR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function VetPendingPage() {
  const { appointments, loading, error, refetch } = usePendingAppointments();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      await approveAppointment(id);
      await refetch();
    } catch {
      // silently fail — user sees no change
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setProcessingId(id);
    try {
      await rejectAppointment(id);
      await refetch();
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

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-700 font-medium">{error}</p>
          <p className="text-red-500 text-sm mt-1">Παρακαλώ δοκιμάστε ξανά αργότερα.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href="/vet/dashboard" className="text-slate-500 text-sm font-bold mb-2 hover:text-indigo-600 block">
          ← Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-slate-900">Αιτήματα Ραντεβού</h1>
        <p className="text-slate-500 mt-1">{appointments.length} εκκρεμή αιτήματα</p>
      </div>

      {appointments.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Όλα ενημερωμένα!</h3>
          <p className="text-slate-500">Δεν υπάρχουν εκκρεμή αιτήματα ραντεβού.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map(apt => {
            const isProcessing = processingId === apt.id;
            const petName = apt.pet?.name || 'Κατοικίδιο';
            const ownerName = apt.pet_owner?.name || 'Ιδιοκτήτης';

            return (
              <div
                key={apt.id}
                className={`bg-white rounded-2xl shadow-sm border border-amber-100 p-5 relative overflow-hidden transition-opacity ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-400" />
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-lg flex-shrink-0">
                      {petName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-lg">
                        {petName}{' '}
                        <span className="text-slate-400 font-normal text-sm">({ownerName})</span>
                      </h4>
                      <p className="text-slate-600">{apt.type}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1 text-sm text-amber-600 bg-amber-50 px-2 py-1 rounded">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatDate(apt.scheduled_at)}
                        </span>
                        <span className="flex items-center gap-1 text-sm text-slate-500">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {formatTime(apt.scheduled_at)}
                        </span>
                      </div>
                      {apt.notes && <p className="text-sm text-slate-500 mt-2 italic">&ldquo;{apt.notes}&rdquo;</p>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReject(apt.id)}
                      disabled={isProcessing}
                      className="px-4 py-2 text-red-600 border border-red-200 rounded-xl font-bold hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      Απόρριψη
                    </button>
                    <button
                      onClick={() => handleApprove(apt.id)}
                      disabled={isProcessing}
                      className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Έγκριση
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
