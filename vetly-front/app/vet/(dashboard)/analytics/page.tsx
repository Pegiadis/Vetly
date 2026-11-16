'use client';


import { ClinicCollectionHeader, ClinicPanel, ClinicPageHeader } from '@/components/vet/ClinicUI';
import { formatEuro, useFullAnalytics } from '@/hooks/useVetData';

const monthNames = ['Ιαν', 'Φεβ', 'Μαρ', 'Απρ', 'Μάι', 'Ιουν', 'Ιουλ', 'Αυγ', 'Σεπ', 'Οκτ', 'Νοε', 'Δεκ'];

function monthLabel(month: string): string {
  const [year, m] = month.split('-');
  return `${monthNames[Number(m) - 1] ?? m} ${year.slice(2)}`;
}

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
  const revenue = analytics.revenue;
  const maxMonthRevenue = Math.max(...(revenue?.by_month ?? []).map(m => m.revenue), 1);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <ClinicPageHeader title={<>Στατιστικά</>} description={<>Επισκέψεις, υπηρεσίες και ασθενείς του κτηνιατρείου.</>}  />

      <ClinicPanel className="mb-5 grid grid-cols-2 overflow-hidden md:grid-cols-4">
        {[
          ['Ολοκληρωμένα μήνα', dashboard.completed_this_month],
          ['Κατοικίδια', dashboard.total_patients],
          ['Αξιολογήσεις', dashboard.total_reviews],
          ['Μέση βαθμολογία / 5', Number(dashboard.average_rating).toFixed(1)],
        ].map(([label, value]) => <div key={label} className="border-b border-r border-ink-100 px-4 py-4"><p className="text-xs text-ink-500">{label}</p><p className="mt-2 text-2xl font-semibold tabular-nums text-ink-900">{value}</p></div>)}
      </ClinicPanel>

      {revenue && (
        <div className="mb-5">
          <ClinicPanel className="mb-4 grid grid-cols-2 overflow-hidden md:grid-cols-4">
            {[
              ['Έσοδα 30 ημερών', formatEuro(revenue.last_30_days_revenue)],
              ['Έσοδα μήνα', formatEuro(revenue.this_month_revenue)],
              ['Έσοδα συνολικά', formatEuro(revenue.total_revenue)],
              ['Μέσο ανά επίσκεψη', revenue.priced_count > 0 ? formatEuro(revenue.average_per_visit) : '—'],
            ].map(([label, value]) => <div key={label} className="border-b border-r border-ink-100 px-4 py-4"><p className="text-xs text-ink-500">{label}</p><p className="mt-2 text-2xl font-semibold tabular-nums text-ink-900">{value}</p></div>)}
          </ClinicPanel>
          {revenue.unpriced_count > 0 && (
            <p className="mb-4 rounded-[10px] bg-[#ffe0c7] px-3 py-2 text-xs text-[#622700]">
              {revenue.unpriced_count} ολοκληρωμένες επισκέψεις δεν έχουν ποσό και δεν προσμετρώνται στα έσοδα.
            </p>
          )}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <ClinicPanel className="lg:col-span-2 overflow-hidden">
              <ClinicCollectionHeader title="Έσοδα ανά μήνα" description="Ολοκληρωμένες επισκέψεις των τελευταίων 12 μηνών." />
              <div className="h-56 flex items-end gap-1.5 p-4">
                {revenue.by_month.map(item => (
                  <div key={item.month} className="h-full min-w-0 flex-1 flex flex-col justify-end items-center gap-1">
                    <div
                      className="w-full bg-clinic-600 rounded-t-sm min-h-[2px] hover:bg-clinic-700"
                      style={{ height: `${(item.revenue / maxMonthRevenue) * 85}%` }}
                      role="img" aria-label={`${monthLabel(item.month)}: ${formatEuro(item.revenue)}, ${item.count} επισκέψεις`}
                      title={`${monthLabel(item.month)}: ${formatEuro(item.revenue)}`}
                    />
                    <span className="text-[10px] text-ink-500">{monthLabel(item.month).split(' ')[0]}</span>
                  </div>
                ))}
              </div>
            </ClinicPanel>
            <ClinicPanel className="p-4">
              <h2 className="text-sm font-semibold text-ink-800 mb-4">Έσοδα ανά υπηρεσία</h2>
              {revenue.by_service.length > 0 ? (
                <div className="divide-y divide-ink-100">
                  {revenue.by_service.map(item => (
                    <div key={item.service_type} className="flex items-center justify-between gap-4 py-3">
                      <span className="min-w-0 text-sm text-ink-700"><span className="block truncate">{item.service_type}</span><span className="text-xs text-ink-500">{item.count} επισκέψεις</span></span>
                      <span className="text-sm font-semibold tabular-nums text-ink-900">{formatEuro(item.revenue)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-ink-400 py-4">Δεν υπάρχουν έσοδα ακόμη.</p>
              )}
            </ClinicPanel>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Appointment Trends Chart */}
        <ClinicPanel className="lg:col-span-2 overflow-hidden">
          <ClinicCollectionHeader title="Ραντεβού ανά ημέρα" description="Οι τελευταίες 30 ημέρες από τα διαθέσιμα στοιχεία." />
          {appointment_trends.items.slice(-30).some(item => item.count > 0) ? (
            <div className="h-64 flex items-end justify-between gap-1 p-4">
              {appointment_trends.items.slice(-30).map(data => (
                <div key={data.date} className="h-full min-w-0 flex-1 flex flex-col justify-end items-center gap-1">
                  <div
                    className="w-full bg-clinic-600 rounded-t-sm transition-all hover:bg-clinic-700 min-h-[2px]"
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
                      className="h-full bg-clinic-600 rounded-full"
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
                        className="h-full bg-clinic-600 rounded-full"
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
