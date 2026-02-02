'use client';

import Link from 'next/link';

const weekDays = ['Δευ', 'Τρι', 'Τετ', 'Πεμ', 'Παρ', 'Σαβ', 'Κυρ'];

const mockSchedule = [
  { time: '09:00', appointments: [{ day: 0, name: 'Μάξ', type: 'Εμβολιασμός' }] },
  { time: '10:00', appointments: [{ day: 2, name: 'Λούνα', type: 'Έλεγχος' }] },
  { time: '11:00', appointments: [{ day: 1, name: 'Ρόκυ', type: 'Χειρουργείο' }, { day: 4, name: 'Κόκο', type: 'Καθαρισμός' }] },
  { time: '12:00', appointments: [] },
  { time: '14:00', appointments: [{ day: 0, name: 'Μπέλλα', type: 'Αποπαρασίτωση' }] },
  { time: '15:00', appointments: [{ day: 3, name: 'Θόρ', type: 'Εξέταση' }] },
  { time: '16:00', appointments: [] },
  { time: '17:00', appointments: [{ day: 2, name: 'Νίκη', type: 'Εμβολιασμός' }] },
];

export default function VetSchedulePage() {
  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <Link href="/vet/dashboard" className="text-slate-500 text-sm font-bold mb-2 hover:text-indigo-600 block">
            ← Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">Πρόγραμμα Εβδομάδας</h1>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-slate-100 rounded-xl text-slate-600 font-medium hover:bg-slate-200">
            ← Προηγ.
          </button>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700">
            Σήμερα
          </button>
          <button className="px-4 py-2 bg-slate-100 rounded-xl text-slate-600 font-medium hover:bg-slate-200">
            Επόμ. →
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Days Header */}
        <div className="grid grid-cols-8 border-b border-slate-100">
          <div className="p-4 bg-slate-50" />
          {weekDays.map((day, i) => (
            <div key={day} className={`p-4 text-center border-l border-slate-100 ${i === 0 ? 'bg-indigo-50' : ''}`}>
              <span className={`text-sm font-bold ${i === 0 ? 'text-indigo-600' : 'text-slate-600'}`}>{day}</span>
              <div className={`text-lg font-bold mt-1 ${i === 0 ? 'text-indigo-900' : 'text-slate-800'}`}>
                {3 + i}
              </div>
            </div>
          ))}
        </div>

        {/* Time Slots */}
        {mockSchedule.map(slot => (
          <div key={slot.time} className="grid grid-cols-8 border-b border-slate-50 last:border-0">
            <div className="p-4 bg-slate-50 text-sm font-bold text-slate-500">{slot.time}</div>
            {weekDays.map((_, dayIndex) => {
              const apt = slot.appointments.find(a => a.day === dayIndex);
              return (
                <div key={dayIndex} className="p-2 border-l border-slate-50 min-h-[80px]">
                  {apt && (
                    <div className="bg-indigo-100 border border-indigo-200 rounded-lg p-2 text-xs cursor-pointer hover:bg-indigo-200 transition-colors">
                      <div className="font-bold text-indigo-900">{apt.name}</div>
                      <div className="text-indigo-600">{apt.type}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
