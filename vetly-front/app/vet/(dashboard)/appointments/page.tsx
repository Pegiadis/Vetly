'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useTodayAppointments, VetAppointment } from '@/hooks/useVetData';

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('el-GR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function getStatusDisplay(status: string): { label: string; color: string } {
  switch (status) {
    case 'completed':
      return { label: 'Ολοκληρώθηκε', color: 'completed' };
    case 'confirmed':
      return { label: 'Επιβεβαιωμένο', color: 'upcoming' };
    case 'pending':
      return { label: 'Αναμονή', color: 'in_progress' };
    case 'cancelled':
      return { label: 'Ακυρώθηκε', color: 'cancelled' };
    default:
      return { label: status, color: 'upcoming' };
  }
}

export default function VetAppointmentsPage() {
  const { appointments, loading, error } = useTodayAppointments();

  const sortedAppointments = useMemo(() => {
    return [...appointments].sort((a, b) =>
      new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
    );
  }, [appointments]);

  const today = new Date().toLocaleDateString('el-GR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <Link href="/vet/dashboard" className="text-slate-500 text-sm font-bold mb-2 hover:text-indigo-600 block">
            ← Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">Ραντεβού Σήμερα</h1>
          <p className="text-slate-500 mt-1">{today}</p>
        </div>
        <button className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Νέο Ραντεβού
        </button>
      </div>

      {/* Timeline */}
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
          <div className="text-center py-12 text-red-500">
            {error}
          </div>
        ) : sortedAppointments.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-lg font-medium">Δεν υπάρχουν ραντεβού για σήμερα</p>
            <p className="text-sm mt-1">Τα νέα ραντεβού θα εμφανιστούν εδώ</p>
          </div>
        ) : (
          <div className="space-y-0 relative">
            <div className="absolute left-[4rem] top-4 bottom-4 w-0.5 bg-slate-100" />

            {sortedAppointments.map((apt) => {
              const { label, color } = getStatusDisplay(apt.status);
              const time = formatTime(apt.scheduled_at);

              return (
                <div key={apt.id} className="flex gap-4 items-start relative py-4 group">
                  <div className="w-14 text-sm font-bold text-slate-500 pt-1">{time}</div>
                  <div
                    className={`w-3 h-3 rounded-full mt-2 relative z-10 ring-4 ring-white ${
                      color === 'completed'
                        ? 'bg-green-500'
                        : color === 'in_progress'
                        ? 'bg-amber-500 animate-pulse'
                        : color === 'cancelled'
                        ? 'bg-red-500'
                        : 'bg-indigo-500'
                    }`}
                  />
                  <div
                    className={`flex-1 p-4 rounded-xl border transition-all cursor-pointer ${
                      color === 'completed'
                        ? 'bg-green-50 border-green-100'
                        : color === 'in_progress'
                        ? 'bg-amber-50 border-amber-200 shadow-md'
                        : color === 'cancelled'
                        ? 'bg-red-50 border-red-100'
                        : 'bg-indigo-50 border-indigo-100 hover:shadow-md'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4
                            className={`font-bold ${
                              color === 'completed'
                                ? 'text-green-900'
                                : color === 'in_progress'
                                ? 'text-amber-900'
                                : color === 'cancelled'
                                ? 'text-red-900'
                                : 'text-indigo-900'
                            }`}
                          >
                            {apt.pet?.name || 'Unknown Pet'}
                          </h4>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                              color === 'completed'
                                ? 'bg-green-200 text-green-800'
                                : color === 'in_progress'
                                ? 'bg-amber-200 text-amber-800'
                                : color === 'cancelled'
                                ? 'bg-red-200 text-red-800'
                                : 'bg-indigo-200 text-indigo-800'
                            }`}
                          >
                            {label}
                          </span>
                        </div>
                        <p
                          className={`text-sm mb-1 ${
                            color === 'completed'
                              ? 'text-green-700'
                              : color === 'in_progress'
                              ? 'text-amber-700'
                              : color === 'cancelled'
                              ? 'text-red-700'
                              : 'text-indigo-700'
                          }`}
                        >
                          {apt.type}
                        </p>
                        <p
                          className={`text-xs ${
                            color === 'completed'
                              ? 'text-green-600/70'
                              : color === 'in_progress'
                              ? 'text-amber-600/70'
                              : color === 'cancelled'
                              ? 'text-red-600/70'
                              : 'text-indigo-600/70'
                          }`}
                        >
                          Ιδιοκτήτης: {apt.pet_owner?.name || 'Unknown'}
                        </p>
                        {apt.notes && (
                          <p className="text-xs text-slate-500 mt-2 italic">
                            {apt.notes}
                          </p>
                        )}
                      </div>
                      <button className="p-2 rounded-lg hover:bg-white/50 transition-colors text-slate-400 hover:text-slate-600">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
