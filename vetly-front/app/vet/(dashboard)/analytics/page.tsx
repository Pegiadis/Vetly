'use client';

import Link from 'next/link';
import { useFullAnalytics } from '@/hooks/useVetData';

const petTypeEmojis: Record<string, string> = {
  Dog: '\uD83D\uDC15',
  Cat: '\uD83D\uDC08',
  Bird: '\uD83D\uDC26',
  Rabbit: '\uD83D\uDC30',
  Hamster: '\uD83D\uDC39',
  Fish: '\uD83D\uDC1F',
  Reptile: '\uD83E\uDD8E',
  Other: '\uD83D\uDC3E',
};

const petTypeLabels: Record<string, string> = {
  Dog: 'Σκύλοι',
  Cat: 'Γάτες',
  Bird: 'Πτηνά',
  Rabbit: 'Κουνέλια',
  Hamster: 'Χάμστερ',
  Fish: 'Ψάρια',
  Reptile: 'Ερπετά',
  Other: 'Άλλα',
};

export default function VetAnalyticsPage() {
  const { analytics, loading, error } = useFullAnalytics();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  const { dashboard, appointment_trends, service_breakdown, peak_hours, patient_types } = analytics;
  const maxTrendCount = Math.max(...appointment_trends.items.map(d => d.count), 1);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href="/vet/dashboard" className="text-slate-500 text-sm font-bold mb-2 hover:text-indigo-600 block">
          &larr; Πίνακας Ελέγχου
        </Link>
        <h1 className="text-3xl font-bold text-slate-900">Στατιστικά</h1>
        <p className="text-slate-500 mt-1">Στατιστικά ιατρείου</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <p className="text-sm text-slate-500 font-medium">Ραντεβού Μήνα</p>
          <div className="flex items-end justify-between mt-2">
            <span className="text-3xl font-bold text-slate-900">{dashboard.completed_this_month}</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <p className="text-sm text-slate-500 font-medium">Συνολικά Κατοικίδια</p>
          <div className="flex items-end justify-between mt-2">
            <span className="text-3xl font-bold text-slate-900">{dashboard.total_patients}</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <p className="text-sm text-slate-500 font-medium">Αξιολογήσεις</p>
          <div className="flex items-end justify-between mt-2">
            <span className="text-3xl font-bold text-slate-900">{dashboard.total_reviews}</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <p className="text-sm text-slate-500 font-medium">Μέσος Όρος</p>
          <div className="flex items-end justify-between mt-2">
            <span className="text-3xl font-bold text-slate-900">{Number(dashboard.average_rating).toFixed(1)}</span>
            <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Appointment Trends Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-6">Ραντεβού ανά Ημέρα</h2>
          {appointment_trends.items.length > 0 ? (
            <div className="h-64 flex items-end justify-between gap-1">
              {appointment_trends.items.slice(-30).map(data => (
                <div key={data.date} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-indigo-500 rounded-t-sm transition-all hover:bg-indigo-600 min-h-[2px]"
                    style={{ height: `${(data.count / maxTrendCount) * 100}%` }}
                    title={`${data.date}: ${data.count}`}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400">
              Δεν υπάρχουν δεδομένα ακόμα.
            </div>
          )}
        </div>

        {/* Top Services */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Δημοφιλείς Υπηρεσίες</h2>
          {service_breakdown.items.length > 0 ? (
            <div className="space-y-4">
              {service_breakdown.items.map(service => (
                <div key={service.service_type}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-700 font-medium">{service.service_type}</span>
                    <span className="text-slate-500">{service.count}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${service.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 py-4">Δεν υπάρχουν δεδομένα.</p>
          )}
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Peak Hours */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Ώρες Αιχμής</h2>
          {peak_hours.items.length > 0 ? (
            <div className="space-y-3">
              {peak_hours.items
                .filter(h => h.count > 0)
                .sort((a, b) => b.count - a.count)
                .slice(0, 6)
                .map(slot => (
                  <div key={slot.hour} className="flex items-center gap-4">
                    <span className="w-28 text-sm text-slate-600">{String(slot.hour).padStart(2, '0')}:00 - {String(slot.hour + 1).padStart(2, '0')}:00</span>
                    <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${slot.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-slate-700 w-10">{Math.round(slot.percentage)}%</span>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 py-4">Δεν υπάρχουν δεδομένα.</p>
          )}
        </div>

        {/* Patient Types */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Τύποι Ασθενών</h2>
          {patient_types.items.length > 0 ? (
            <div className="flex items-center justify-center gap-8">
              {patient_types.items.map(pt => (
                <div key={pt.pet_type} className="text-center">
                  <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                    <span className="text-3xl">{petTypeEmojis[pt.pet_type] || '\uD83D\uDC3E'}</span>
                  </div>
                  <span className="text-2xl font-bold text-slate-900">{Math.round(pt.percentage)}%</span>
                  <p className="text-sm text-slate-500">{petTypeLabels[pt.pet_type] || pt.pet_type}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 py-4 text-center">Δεν υπάρχουν δεδομένα.</p>
          )}
        </div>
      </div>
    </div>
  );
}
