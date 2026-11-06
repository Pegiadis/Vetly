'use client';


import { ClinicCollectionHeader, ClinicPanel, ClinicPageHeader } from '@/components/vet/ClinicUI';
import { useFullAnalytics } from '@/hooks/useVetData';

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-clinic-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
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
      <ClinicPageHeader title={<>Στατιστικά</>} description={<>Στατιστικά ιατρείου</>}  />

      <ClinicPanel className="mb-5 grid grid-cols-2 overflow-hidden md:grid-cols-4">
        {[
          ['Ολοκληρωμένα μήνα', dashboard.completed_this_month],
          ['Κατοικίδια', dashboard.total_patients],
          ['Αξιολογήσεις', dashboard.total_reviews],
          ['Μέση βαθμολογία / 5', Number(dashboard.average_rating).toFixed(1)],
        ].map(([label, value]) => <div key={label} className="border-b border-r border-ink-100 px-4 py-4"><p className="text-xs text-ink-500">{label}</p><p className="mt-2 text-2xl font-semibold tabular-nums text-ink-900">{value}</p></div>)}
      </ClinicPanel>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Appointment Trends Chart */}
        <ClinicPanel className="lg:col-span-2 overflow-hidden">
          <ClinicCollectionHeader title="Ραντεβού ανά ημέρα" description="Οι τελευταίες 30 ημέρες από τα διαθέσιμα στοιχεία." />
          {appointment_trends.items.slice(-30).some(item => item.count > 0) ? (
            <div className="h-64 flex items-end justify-between gap-1 p-4">
              {appointment_trends.items.slice(-30).map(data => (
                <div key={data.date} className="h-full min-w-0 flex-1 flex flex-col justify-end items-center gap-1">
                  <div
                    className="w-full bg-clinic-500 rounded-t-sm transition-all hover:bg-clinic-600 min-h-[2px]"
                    role="img" aria-label={`${data.date}: ${data.count} ραντεβού`} style={{ height: `${(data.count / maxTrendCount) * 100}%` }}
                    title={`${data.date}: ${data.count}`}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-ink-400">
              Δεν υπάρχουν ραντεβού σε αυτή την περίοδο.
            </div>
          )}
        </ClinicPanel>

        {/* Top Services */}
        <ClinicPanel className="p-4">
          <h2 className="text-sm font-semibold text-ink-800 mb-4">Δημοφιλείς Υπηρεσίες</h2>
          {service_breakdown.items.length > 0 ? (
            <div className="space-y-4">
              {service_breakdown.items.map(service => (
                <div key={service.service_type}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-ink-700 font-medium">{service.service_type}</span>
                    <span className="text-ink-500">{service.count}</span>
                  </div>
                  <div className="h-2 bg-ink-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-clinic-500 rounded-full"
                      style={{ width: `${service.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-400 py-4">Δεν υπάρχουν δεδομένα.</p>
          )}
        </ClinicPanel>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {/* Peak Hours */}
        <ClinicPanel className="p-4">
          <h2 className="text-sm font-semibold text-ink-800 mb-4">Ώρες Αιχμής</h2>
          {peak_hours.items.length > 0 ? (
            <div className="space-y-3">
              {peak_hours.items
                .filter(h => h.count > 0)
                .sort((a, b) => b.count - a.count)
                .slice(0, 6)
                .map(slot => (
                  <div key={slot.hour} className="flex items-center gap-4">
                    <span className="w-28 text-sm text-ink-600">{String(slot.hour).padStart(2, '0')}:00 - {String(slot.hour + 1).padStart(2, '0')}:00</span>
                    <div className="flex-1 h-3 bg-ink-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-clinic-400 rounded-full"
                        style={{ width: `${slot.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-ink-700 w-10">{Math.round(slot.percentage)}%</span>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-sm text-ink-400 py-4">Δεν υπάρχουν δεδομένα.</p>
          )}
        </ClinicPanel>

        {/* Patient Types */}
        <ClinicPanel className="p-4">
          <h2 className="text-sm font-semibold text-ink-800 mb-4">Τύποι Ασθενών</h2>
          {patient_types.items.length > 0 ? (
            <div className="divide-y divide-ink-100">
              {patient_types.items.map(pt => <div key={pt.pet_type} className="flex items-center justify-between gap-4 py-3"><span className="text-sm text-ink-700">{petTypeLabels[pt.pet_type] || pt.pet_type}</span><span className="text-sm font-semibold tabular-nums text-ink-900">{Math.round(pt.percentage)}%</span></div>)}
            </div>
          ) : (
            <p className="text-sm text-ink-400 py-4 text-center">Δεν υπάρχουν δεδομένα.</p>
          )}
        </ClinicPanel>
      </div>
    </div>
  );
}
