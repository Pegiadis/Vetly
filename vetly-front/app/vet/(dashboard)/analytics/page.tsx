'use client';

import Link from 'next/link';

const stats = [
  { label: 'Ραντεβού Μήνα', value: 87, change: '+12%', positive: true },
  { label: 'Νέοι Ασθενείς', value: 23, change: '+8%', positive: true },
  { label: 'Μέσος Χρόνος', value: '24λ', change: '-5%', positive: true },
  { label: 'Ακυρώσεις', value: 4, change: '+2', positive: false },
];

const monthlyData = [
  { month: 'Ιαν', appointments: 65 },
  { month: 'Φεβ', appointments: 72 },
  { month: 'Μαρ', appointments: 68 },
  { month: 'Απρ', appointments: 85 },
  { month: 'Μάι', appointments: 92 },
  { month: 'Ιουν', appointments: 87 },
];

const topServices = [
  { name: 'Εμβολιασμοί', count: 34, percentage: 39 },
  { name: 'Έλεγχοι Ρουτίνας', count: 28, percentage: 32 },
  { name: 'Χειρουργεία', count: 12, percentage: 14 },
  { name: 'Καθαρισμός Δοντιών', count: 8, percentage: 9 },
  { name: 'Άλλα', count: 5, percentage: 6 },
];

export default function VetAnalyticsPage() {
  const maxAppointments = Math.max(...monthlyData.map(d => d.appointments));

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href="/vet/dashboard" className="text-slate-500 text-sm font-bold mb-2 hover:text-indigo-600 block">
          ← Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-slate-900">Analytics</h1>
        <p className="text-slate-500 mt-1">Στατιστικά τελευταίου μήνα</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {stats.map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
            <div className="flex items-end justify-between mt-2">
              <span className="text-3xl font-bold text-slate-900">{stat.value}</span>
              <span
                className={`text-sm font-bold px-2 py-1 rounded-lg ${
                  stat.positive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}
              >
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-6">Ραντεβού ανά Μήνα</h2>
          <div className="h-64 flex items-end justify-between gap-4">
            {monthlyData.map(data => (
              <div key={data.month} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-indigo-500 rounded-t-lg transition-all hover:bg-indigo-600"
                  style={{ height: `${(data.appointments / maxAppointments) * 100}%` }}
                />
                <span className="text-xs text-slate-500 font-medium">{data.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Services */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Δημοφιλείς Υπηρεσίες</h2>
          <div className="space-y-4">
            {topServices.map(service => (
              <div key={service.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-700 font-medium">{service.name}</span>
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
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Peak Hours */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Ώρες Αιχμής</h2>
          <div className="space-y-3">
            {[
              { time: '10:00 - 12:00', percentage: 85 },
              { time: '16:00 - 18:00', percentage: 72 },
              { time: '09:00 - 10:00', percentage: 58 },
              { time: '14:00 - 16:00', percentage: 45 },
            ].map(slot => (
              <div key={slot.time} className="flex items-center gap-4">
                <span className="w-28 text-sm text-slate-600">{slot.time}</span>
                <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${slot.percentage}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-slate-700 w-10">{slot.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Patient Types */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Τύποι Ασθενών</h2>
          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <div className="w-24 h-24 rounded-full bg-teal-100 flex items-center justify-center mb-2">
                <span className="text-3xl">🐕</span>
              </div>
              <span className="text-2xl font-bold text-slate-900">65%</span>
              <p className="text-sm text-slate-500">Σκύλοι</p>
            </div>
            <div className="text-center">
              <div className="w-24 h-24 rounded-full bg-amber-100 flex items-center justify-center mb-2">
                <span className="text-3xl">🐈</span>
              </div>
              <span className="text-2xl font-bold text-slate-900">30%</span>
              <p className="text-sm text-slate-500">Γάτες</p>
            </div>
            <div className="text-center">
              <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center mb-2">
                <span className="text-3xl">🐾</span>
              </div>
              <span className="text-2xl font-bold text-slate-900">5%</span>
              <p className="text-sm text-slate-500">Άλλα</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
