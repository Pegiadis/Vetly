'use client';

import Link from 'next/link';
import { useMyPets, useUpcomingAppointments } from '@/hooks/useOwnerData';

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  const day = date.toLocaleDateString('el-GR', { day: 'numeric', month: 'short' });
  const time = date.toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' });
  return `${day}, ${time}`;
}

function PetTypeLabel({ type }: { type: string }) {
  const labels: Record<string, string> = { Dog: 'Σκύλος', Cat: 'Γάτα', Other: 'Άλλο' };
  return <>{labels[type] || type}</>;
}

export default function OwnerDashboardPage() {
  const { pets, loading: petsLoading } = useMyPets();
  const { appointments, loading: appointmentsLoading } = useUpcomingAppointments();

  const loading = petsLoading || appointmentsLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Καλώς ήρθατε!</h1>
        <p className="text-slate-500 mt-1">Διαχειριστείτε τα κατοικίδιά σας και τα ραντεβού τους.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Link
          href="/owner/pets"
          className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:border-teal-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="bg-teal-100 p-3 rounded-xl text-teal-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase">Κατοικίδια</p>
              <h3 className="text-2xl font-bold text-slate-800">{pets.length}</h3>
            </div>
          </div>
        </Link>

        <Link
          href="/owner/appointments"
          className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:border-indigo-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="bg-indigo-100 p-3 rounded-xl text-indigo-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase">Ραντεβού</p>
              <h3 className="text-2xl font-bold text-slate-800">{appointments.length}</h3>
            </div>
          </div>
        </Link>

        <Link
          href="/owner/medications"
          className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:border-amber-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="bg-amber-100 p-3 rounded-xl text-amber-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase">Φάρμακα</p>
              <h3 className="text-2xl font-bold text-slate-800">0</h3>
            </div>
          </div>
        </Link>

        <Link
          href="/owner/book"
          className="bg-teal-600 rounded-2xl p-5 shadow-sm hover:bg-teal-700 transition-all text-white"
        >
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <p className="text-teal-100 text-xs font-bold uppercase">Νέο</p>
              <h3 className="text-lg font-bold">Κράτηση</h3>
            </div>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Appointments */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center justify-between">
              Επερχόμενα Ραντεβού
              <Link href="/owner/appointments" className="text-sm text-teal-600 font-bold hover:underline">
                Όλα
              </Link>
            </h3>

            {appointments.length > 0 ? (
              <div className="space-y-3">
                {appointments.slice(0, 5).map(apt => (
                  <div
                    key={apt.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-teal-200 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-3 sm:mb-0">
                      <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 font-bold">
                        {apt.pet?.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800">
                          {apt.pet?.name || 'Κατοικίδιο'} <span className="text-slate-400 font-normal text-sm">• {apt.type}</span>
                        </h4>
                        <p className="text-sm text-slate-600">{apt.vet?.name || 'Κτηνίατρος'}</p>
                        <div className="flex items-center gap-1 mt-1 text-xs text-teal-600 bg-teal-50 px-2 py-0.5 rounded w-fit">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatDateTime(apt.scheduled_at)}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                        apt.status === 'confirmed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {apt.status === 'confirmed' ? 'Επιβεβαιωμένο' : 'Αναμονή'}
                      </span>
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
                Κανένα προγραμματισμένο ραντεβού.
              </div>
            )}

            <Link
              href="/owner/book"
              className="w-full mt-4 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors font-bold text-sm flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Κλείστε Ραντεβού
            </Link>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* My Pets */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center justify-between">
              Τα Κατοικίδιά Μου
              <Link href="/owner/pets" className="text-xs text-teal-600 font-bold hover:text-teal-800">
                Όλα
              </Link>
            </h3>
            <div className="space-y-3">
              {pets.length > 0 ? (
                pets.map((pet) => (
                  <Link
                    key={pet.id}
                    href={`/owner/pets?selected=${pet.id}`}
                    className="flex items-center gap-3 group cursor-pointer p-2 -mx-2 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-slate-100 bg-teal-50 flex items-center justify-center flex-shrink-0">
                      {pet.image_url ? (
                        <img src={pet.image_url} alt={pet.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-teal-600 font-bold">{pet.name.charAt(0)}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-800 text-sm group-hover:text-teal-600 transition-colors">
                        {pet.name}
                      </p>
                      <p className="text-xs text-slate-400"><PetTypeLabel type={pet.type} /> • {pet.breed || '-'}</p>
                    </div>
                    <div className="text-slate-300 group-hover:text-teal-600 transition-colors">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-slate-400 py-2">Δεν έχετε κατοικίδια ακόμα.</p>
              )}
            </div>

            <Link
              href="/owner/pets"
              className="w-full mt-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors font-bold text-sm flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Προσθήκη Κατοικιδίου
            </Link>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-4">Γρήγορες Ενέργειες</h3>
            <div className="space-y-2">
              <Link
                href="/owner/book"
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-teal-50 transition-colors text-slate-700 hover:text-teal-700"
              >
                <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center text-teal-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <span className="font-medium text-sm">Κλείστε Ραντεβού</span>
              </Link>

              <Link
                href="/owner/medical"
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-indigo-50 transition-colors text-slate-700 hover:text-indigo-700"
              >
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <span className="font-medium text-sm">Ιατρικό Ιστορικό</span>
              </Link>

              <Link
                href="/"
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 transition-colors text-slate-700"
              >
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <span className="font-medium text-sm">Βρείτε Κτηνίατρο</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
