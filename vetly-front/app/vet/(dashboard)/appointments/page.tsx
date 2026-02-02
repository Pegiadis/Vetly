'use client';

import Link from 'next/link';

const todayAppointments = [
  { id: '1', time: '09:00', petName: 'Μάξ', ownerName: 'Άννα Β.', type: 'Εμβολιασμός', status: 'completed' },
  { id: '2', time: '10:30', petName: 'Λούνα', ownerName: 'Κώστας Δ.', type: 'Ετήσιος Έλεγχος', status: 'in_progress' },
  { id: '3', time: '12:00', petName: 'Ρόκυ', ownerName: 'Μαρία Π.', type: 'Χειρουργείο', status: 'upcoming' },
  { id: '4', time: '14:00', petName: 'Μπέλλα', ownerName: 'Γιάννης Ο.', type: 'Εμβολιασμός', status: 'upcoming' },
  { id: '5', time: '15:30', petName: 'Κόκο', ownerName: 'Ελένη Κ.', type: 'Καθαρισμός Δοντιών', status: 'upcoming' },
];

export default function VetAppointmentsPage() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <Link href="/vet/dashboard" className="text-slate-500 text-sm font-bold mb-2 hover:text-indigo-600 block">
            ← Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">Ραντεβού Σήμερα</h1>
          <p className="text-slate-500 mt-1">Δευτέρα, 3 Φεβρουαρίου 2026</p>
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
        <div className="space-y-0 relative">
          <div className="absolute left-[4rem] top-4 bottom-4 w-0.5 bg-slate-100" />

          {todayAppointments.map(apt => (
            <div key={apt.id} className="flex gap-4 items-start relative py-4 group">
              <div className="w-14 text-sm font-bold text-slate-500 pt-1">{apt.time}</div>
              <div
                className={`w-3 h-3 rounded-full mt-2 relative z-10 ring-4 ring-white ${
                  apt.status === 'completed'
                    ? 'bg-green-500'
                    : apt.status === 'in_progress'
                    ? 'bg-amber-500 animate-pulse'
                    : 'bg-indigo-500'
                }`}
              />
              <div
                className={`flex-1 p-4 rounded-xl border transition-all cursor-pointer ${
                  apt.status === 'completed'
                    ? 'bg-green-50 border-green-100'
                    : apt.status === 'in_progress'
                    ? 'bg-amber-50 border-amber-200 shadow-md'
                    : 'bg-indigo-50 border-indigo-100 hover:shadow-md'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4
                        className={`font-bold ${
                          apt.status === 'completed'
                            ? 'text-green-900'
                            : apt.status === 'in_progress'
                            ? 'text-amber-900'
                            : 'text-indigo-900'
                        }`}
                      >
                        {apt.petName}
                      </h4>
                      {apt.status === 'in_progress' && (
                        <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                          Σε Εξέλιξη
                        </span>
                      )}
                      {apt.status === 'completed' && (
                        <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full font-bold">
                          Ολοκληρώθηκε
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-sm mb-1 ${
                        apt.status === 'completed'
                          ? 'text-green-700'
                          : apt.status === 'in_progress'
                          ? 'text-amber-700'
                          : 'text-indigo-700'
                      }`}
                    >
                      {apt.type}
                    </p>
                    <p
                      className={`text-xs ${
                        apt.status === 'completed'
                          ? 'text-green-600/70'
                          : apt.status === 'in_progress'
                          ? 'text-amber-600/70'
                          : 'text-indigo-600/70'
                      }`}
                    >
                      Ιδιοκτήτης: {apt.ownerName}
                    </p>
                  </div>
                  <button className="p-2 rounded-lg hover:bg-white/50 transition-colors text-slate-400 hover:text-slate-600">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
