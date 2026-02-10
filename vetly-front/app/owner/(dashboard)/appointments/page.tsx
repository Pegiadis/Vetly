'use client';

import { useState } from 'react';
import Link from 'next/link';

// Mock data
const mockAppointments = [
  { id: '1', petName: 'Μάξ', petImage: 'https://picsum.photos/100/100?random=10', vetName: 'Δρ. Παπαδόπουλος', vetSpecialty: 'Γενικός', type: 'Εμβολιασμός', date: '2024-06-25', time: '10:00', status: 'confirmed', address: 'Λεωφ. Κηφισίας 120, Αθήνα' },
  { id: '2', petName: 'Λούνα', petImage: 'https://picsum.photos/100/100?random=11', vetName: 'Δρ. Γεωργίου', vetSpecialty: 'Δερματολόγος', type: 'Ετήσιος Έλεγχος', date: '2024-06-28', time: '14:30', status: 'pending', address: 'Ερμού 45, Αθήνα' },
  { id: '3', petName: 'Μάξ', petImage: 'https://picsum.photos/100/100?random=10', vetName: 'Δρ. Αλεξίου', vetSpecialty: 'Χειρουργός', type: 'Follow-up', date: '2024-07-05', time: '11:00', status: 'confirmed', address: 'Πανεπιστημίου 25, Αθήνα' },
  { id: '4', petName: 'Μάξ', petImage: 'https://picsum.photos/100/100?random=10', vetName: 'Δρ. Παπαδόπουλος', vetSpecialty: 'Γενικός', type: 'Εμβολιασμός', date: '2024-05-15', time: '09:00', status: 'completed', address: 'Λεωφ. Κηφισίας 120, Αθήνα' },
  { id: '5', petName: 'Λούνα', petImage: 'https://picsum.photos/100/100?random=11', vetName: 'Δρ. Γεωργίου', vetSpecialty: 'Δερματολόγος', type: 'Εξέταση', date: '2024-04-20', time: '16:00', status: 'completed', address: 'Ερμού 45, Αθήνα' },
];

type TabType = 'upcoming' | 'past';

export default function AppointmentsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');

  const upcomingAppointments = mockAppointments.filter(a => a.status === 'confirmed' || a.status === 'pending');
  const pastAppointments = mockAppointments.filter(a => a.status === 'completed' || a.status === 'cancelled');

  const appointments = activeTab === 'upcoming' ? upcomingAppointments : pastAppointments;

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
        {appointments.length > 0 ? (
          appointments.map((apt) => (
            <div
              key={apt.id}
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:border-teal-200 transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-slate-100 flex-shrink-0">
                    <img src={apt.petImage} alt={apt.petName} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-slate-900">{apt.petName}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        apt.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                        apt.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        apt.status === 'completed' ? 'bg-slate-100 text-slate-600' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {apt.status === 'confirmed' ? 'Επιβεβαιωμένο' :
                         apt.status === 'pending' ? 'Αναμονή' :
                         apt.status === 'completed' ? 'Ολοκληρώθηκε' : 'Ακυρώθηκε'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 font-medium">{apt.type}</p>
                    <p className="text-sm text-slate-500">{apt.vetName} • {apt.vetSpecialty}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(apt.date).toLocaleDateString('el-GR', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {apt.time}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  {activeTab === 'upcoming' && (
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
                  {activeTab === 'past' && apt.status === 'completed' && (
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

              {/* Address */}
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-sm text-slate-500">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {apt.address}
              </div>
            </div>
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
