'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMyAppointments } from '@/hooks/useOwnerData';
import type { Appointment } from '@/hooks/useOwnerData';

type TabType = 'upcoming' | 'past';

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
    confirmed: 'bg-green-100 text-green-700',
    pending: 'bg-amber-100 text-amber-700',
    completed: 'bg-slate-100 text-slate-600',
    cancelled: 'bg-red-100 text-red-700',
  };
  const labels: Record<string, string> = {
    confirmed: 'Επιβεβαιωμένο',
    pending: 'Αναμονή',
    completed: 'Ολοκληρώθηκε',
    cancelled: 'Ακυρώθηκε',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${styles[status] || 'bg-slate-100 text-slate-600'}`}>
      {labels[status] || status}
    </span>
  );
}

function AppointmentCard({ apt, showActions }: { apt: Appointment; showActions: boolean }) {
  const petName = apt.pet?.name || 'Κατοικίδιο';
  const petImage = apt.pet?.image_url;
  const vetName = apt.vet?.name || 'Κτηνίατρος';
  const vetSpecialty = apt.vet?.specialty || '';
  const address = apt.vet?.address;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:border-teal-200 transition-all">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-slate-100 flex-shrink-0 bg-teal-50 flex items-center justify-center">
            {petImage ? (
              <img src={petImage} alt={petName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-teal-600 font-bold text-lg">{petName.charAt(0)}</span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-slate-900">{petName}</h3>
              <StatusBadge status={apt.status} />
            </div>
            <p className="text-sm text-slate-600 font-medium">{apt.type}</p>
            <p className="text-sm text-slate-500">{vetName}{vetSpecialty ? ` • ${vetSpecialty}` : ''}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {formatDate(apt.scheduled_at)}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formatTime(apt.scheduled_at)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {showActions && (
            <>
              <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <button className="px-4 py-2 bg-teal-50 text-teal-700 rounded-xl font-bold text-sm hover:bg-teal-100 transition-colors">
                Λεπτομέρειες
              </button>
            </>
          )}
          {!showActions && apt.status === 'completed' && (
            <Link
              href="/owner/reviews"
              className="px-4 py-2 bg-amber-50 text-amber-700 rounded-xl font-bold text-sm hover:bg-amber-100 transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              Αξιολόγηση
            </Link>
          )}
        </div>
      </div>

      {address && (
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-sm text-slate-500">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {address}
        </div>
      )}
    </div>
  );
}

export default function AppointmentsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const { appointments, loading, error } = useMyAppointments();

  const upcomingAppointments = appointments.filter(a => a.status === 'confirmed' || a.status === 'pending');
  const pastAppointments = appointments.filter(a => a.status === 'completed' || a.status === 'cancelled');

  const displayedAppointments = activeTab === 'upcoming' ? upcomingAppointments : pastAppointments;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Ραντεβού</h1>
          <p className="text-slate-500 mt-1">Διαχειριστείτε τα ραντεβού σας.</p>
        </div>
        <Link
          href="/owner/book"
          className="bg-teal-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-teal-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Νέο Ραντεβού
        </Link>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl p-1 shadow-sm border border-slate-100 mb-6 inline-flex">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'upcoming'
              ? 'bg-teal-600 text-white'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          Επερχόμενα ({upcomingAppointments.length})
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'past'
              ? 'bg-teal-600 text-white'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          Ιστορικό ({pastAppointments.length})
        </button>
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        {displayedAppointments.length > 0 ? (
          displayedAppointments.map((apt) => (
            <AppointmentCard key={apt.id} apt={apt} showActions={activeTab === 'upcoming'} />
          ))
        ) : (
          <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-100 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              {activeTab === 'upcoming' ? 'Κανένα επερχόμενο ραντεβού' : 'Κανένα παλαιότερο ραντεβού'}
            </h3>
            <p className="text-slate-500 mb-6">
              {activeTab === 'upcoming' ? 'Κλείστε ένα ραντεβού για το κατοικίδιό σας.' : 'Δεν υπάρχει ιστορικό ραντεβού.'}
            </p>
            {activeTab === 'upcoming' && (
              <Link
                href="/owner/book"
                className="inline-flex items-center gap-2 bg-teal-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-teal-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Κλείστε Ραντεβού
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
