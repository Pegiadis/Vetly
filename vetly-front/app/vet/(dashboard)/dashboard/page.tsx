'use client';

import { useState } from 'react';
import Link from 'next/link';

// Mock data
const mockVet = {
  id: '1',
  name: 'Δρ. Γεώργιος Παπαδόπουλος',
  specialty: 'Γενικός Κτηνίατρος',
  city: 'Αθήνα',
  rating: 4.9,
  image: 'https://picsum.photos/400/400?random=1',
};

const mockAppointments = [
  { id: '1', petName: 'Μάξ', ownerName: 'Άννα Β.', type: 'Εμβολιασμός', date: 'Σήμερα', time: '09:00', status: 'confirmed' },
  { id: '2', petName: 'Λούνα', ownerName: 'Κώστας Δ.', type: 'Ετήσιος Έλεγχος', date: 'Σήμερα', time: '10:30', status: 'confirmed' },
  { id: '3', petName: 'Ρόκυ', ownerName: 'Μαρία Π.', type: 'Χειρουργείο', date: 'Σήμερα', time: '12:00', status: 'confirmed' },
  { id: '4', petName: 'Μπέλλα', ownerName: 'Γιάννης Ο.', type: 'Εμβολιασμός', date: '2024-06-25', time: '14:00', status: 'pending' },
  { id: '5', petName: 'Κόκο', ownerName: 'Ελένη Κ.', type: 'Καθαρισμός Δοντιών', date: '2024-06-26', time: '11:00', status: 'pending' },
  { id: '6', petName: 'Θόρ', ownerName: 'Νίκος Α.', type: 'Αποπαρασίτωση', date: '2024-06-27', time: '16:30', status: 'pending' },
];

const recentPatients = [
  { name: 'Μάξ', type: 'Σκύλος', age: 3 },
  { name: 'Λούνα', type: 'Γάτα', age: 2 },
  { name: 'Κόκο', type: 'Παπαγάλος', age: 5 },
  { name: 'Θόρ', type: 'Σκύλος', age: 4 },
];

export default function VetDashboardPage() {
  const [appointments, setAppointments] = useState(mockAppointments);

  const pendingAppointments = appointments.filter(a => a.status === 'pending');
  const todayAppointments = appointments.filter(a => a.status === 'confirmed' && a.date === 'Σήμερα');

  const handleUpdateStatus = (id: string, newStatus: 'confirmed' | 'cancelled') => {
    setAppointments(prev =>
      prev.map(apt =>
        apt.id === id ? { ...apt, status: newStatus } : apt
      )
    );
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard Ιατρείου</h1>
        <p className="text-slate-500 mt-1">Καλώς ήρθατε, {mockVet.name}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <Link
          href="/vet/appointments"
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
              <h3 className="text-2xl font-bold text-slate-800">{todayAppointments.length}</h3>
            </div>
          </div>
        </Link>

        <Link
          href="/vet/pending"
          className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:border-amber-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="bg-amber-100 p-3 rounded-xl text-amber-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase">Εκκρεμούν</p>
              <h3 className="text-2xl font-bold text-slate-800">{pendingAppointments.length}</h3>
            </div>
          </div>
        </Link>

        <Link
          href="/vet/patients"
          className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:border-teal-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="bg-teal-100 p-3 rounded-xl text-teal-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase">Ασθενείς</p>
              <h3 className="text-2xl font-bold text-slate-800">142</h3>
            </div>
          </div>
        </Link>

        <Link
          href="/vet/reviews"
          className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:border-rose-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="bg-rose-100 p-3 rounded-xl text-rose-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase">Rating</p>
              <h3 className="text-2xl font-bold text-slate-800">{mockVet.rating}</h3>
            </div>
          </div>
        </Link>

        <Link
          href="/vet/analytics"
          className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:border-emerald-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase">Analytics</p>
              <p className="text-sm font-bold text-slate-800 mt-1">Προβολή</p>
            </div>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pending Requests */}
          {pendingAppointments.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-amber-100 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-500" />
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                  Αιτήματα για Έγκριση
                </span>
                <Link href="/vet/pending" className="text-sm text-amber-600 font-bold hover:underline">
                  Προβολή Όλων
                </Link>
              </h3>

              <div className="space-y-3">
                {pendingAppointments.slice(0, 3).map(apt => (
                  <div
                    key={apt.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-amber-200 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-3 sm:mb-0">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                        {apt.petName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800">
                          {apt.petName} <span className="text-slate-400 font-normal text-sm">({apt.ownerName})</span>
                        </h4>
                        <p className="text-sm text-slate-600">{apt.type}</p>
                        <div className="flex items-center gap-1 mt-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded w-fit">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {apt.date}, {apt.time}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => handleUpdateStatus(apt.id, 'cancelled')}
                        className="flex-1 sm:flex-none p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Απόρριψη"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(apt.id, 'confirmed')}
                        className="flex-1 sm:flex-none px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-bold text-sm flex items-center justify-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Έγκριση
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Daily Schedule */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800">Πρόγραμμα Ημέρας</h3>
              <button className="text-sm font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Νέο Ραντεβού
              </button>
            </div>

            {todayAppointments.length > 0 ? (
              <div className="space-y-0 relative">
                <div className="absolute left-[4rem] top-2 bottom-2 w-0.5 bg-slate-100" />
                {todayAppointments.map(apt => (
                  <div
                    key={apt.id}
                    className="flex gap-4 items-start relative py-3 group hover:bg-slate-50 rounded-xl px-2 transition-colors -mx-2"
                  >
                    <div className="w-12 text-sm font-bold text-slate-500 pt-1">{apt.time}</div>
                    <div className="w-3 h-3 bg-indigo-500 rounded-full mt-2 relative z-10 ring-4 ring-white group-hover:ring-slate-50" />
                    <div className="flex-1 bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-indigo-900">{apt.petName}</h4>
                          <p className="text-sm text-indigo-700 mb-1">{apt.type}</p>
                          <p className="text-xs text-indigo-600/70">Ιδιοκτήτης: {apt.ownerName}</p>
                        </div>
                        <button className="bg-white/50 p-2 rounded-lg hover:bg-white transition-colors text-indigo-600">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </button>
                      </div>
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
                Κανένα ραντεβού για σήμερα.
              </div>
            )}

            <Link
              href="/vet/appointments"
              className="w-full mt-4 py-2 text-indigo-600 font-bold text-sm bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors block text-center"
            >
              Προβολή Όλων
            </Link>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Profile Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center">
            <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-4 border-4 border-slate-50">
              <img src={mockVet.image} alt={mockVet.name} className="w-full h-full object-cover" />
            </div>
            <h3 className="font-bold text-slate-900">{mockVet.name}</h3>
            <p className="text-indigo-600 text-sm font-medium mb-3">{mockVet.specialty}</p>
            <div className="flex justify-center gap-2 text-xs text-slate-500 mb-4">
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {mockVet.city}
              </span>
            </div>
            <Link
              href="/vet/settings"
              className="w-full py-2 border border-slate-200 rounded-xl text-slate-600 text-sm font-bold hover:bg-slate-50 transition-colors block"
            >
              Επεξεργασία Προφίλ
            </Link>
          </div>

          {/* Recent Patients */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center justify-between">
              Πρόσφατοι Ασθενείς
              <Link href="/vet/patients" className="text-xs text-indigo-600 font-bold hover:text-indigo-800">
                Όλοι
              </Link>
            </h3>
            <div className="space-y-3">
              {recentPatients.map((patient, i) => (
                <div key={i} className="flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold">
                      {patient.name[0]}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">
                        {patient.name}
                      </p>
                      <p className="text-xs text-slate-400">{patient.type} • {patient.age} Ετών</p>
                    </div>
                  </div>
                  <button className="p-2 text-slate-300 hover:text-indigo-600 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
