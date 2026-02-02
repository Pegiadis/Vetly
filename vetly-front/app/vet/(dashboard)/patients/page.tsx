'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Patient {
  id: string;
  name: string;
  breed: string;
  type: string;
  age: number;
  weight: number;
  gender: 'Male' | 'Female';
  ownerName: string;
  ownerPhone: string;
  lastVisit: string;
  status: 'Active' | 'Treatment' | 'Inactive';
  chipNumber?: string;
  image: string;
  history: { date: string; title: string; notes: string }[];
}

const mockPatients: Patient[] = [
  {
    id: 'p1',
    name: 'Ρόκυ',
    breed: 'German Shepherd',
    type: 'Σκύλος',
    age: 4,
    weight: 32.5,
    gender: 'Male',
    ownerName: 'Ελένη Παππά',
    ownerPhone: '+30 691 234 5678',
    lastVisit: '10/05/2024',
    status: 'Active',
    chipNumber: '941000012345678',
    image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=200&q=80',
    history: [
      { date: '10/05/2024', title: 'Εμβολιασμός', notes: 'DHPPi & Lepto Booster' },
      { date: '12/01/2024', title: 'Ωτίτιδα', notes: 'Χορήγηση σταγόνων Surolan για 7 ημέρες' },
    ],
  },
  {
    id: 'p2',
    name: 'Λούνα',
    breed: 'Siamese',
    type: 'Γάτα',
    age: 2,
    weight: 4.1,
    gender: 'Female',
    ownerName: 'Κώστας Δημητρίου',
    ownerPhone: '+30 698 765 4321',
    lastVisit: '22/06/2024',
    status: 'Treatment',
    chipNumber: '941000087654321',
    image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=200&q=80',
    history: [
      { date: '22/06/2024', title: 'Εξέταση Αίματος', notes: 'Έλεγχος νεφρικής λειτουργίας - Φυσιολογικά αποτελέσματα' },
    ],
  },
  {
    id: 'p3',
    name: 'Μάξ',
    breed: 'Golden Retriever',
    type: 'Σκύλος',
    age: 6,
    weight: 29.0,
    gender: 'Male',
    ownerName: 'Άννα Βασιλείου',
    ownerPhone: '+30 690 112 2334',
    lastVisit: '15/03/2024',
    status: 'Inactive',
    image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=200&q=80',
    history: [],
  },
  {
    id: 'p4',
    name: 'Μπέλλα',
    breed: 'Poodle',
    type: 'Σκύλος',
    age: 3,
    weight: 7.5,
    gender: 'Female',
    ownerName: 'Γιάννης Οικονόμου',
    ownerPhone: '+30 693 555 4444',
    lastVisit: '02/06/2024',
    status: 'Active',
    chipNumber: '941000055555555',
    image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=200&q=80',
    history: [
      { date: '02/06/2024', title: 'Καθαρισμός Δοντιών', notes: 'Αφαίρεση πέτρας, γυάλισμα' },
    ],
  },
];

export default function VetPatientsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const filteredPatients = mockPatients.filter(
    p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.ownerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <Link href="/vet/dashboard" className="text-slate-500 text-sm font-bold mb-2 hover:text-indigo-600 block">
            ← Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">Διαχείριση Ασθενών</h1>
        </div>
        <button className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-md">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Νέος Ασθενής
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Αναζήτηση με όνομα κατοικιδίου ή ιδιοκτήτη..."
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-100 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Φίλτρα
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100">
                <th className="p-5 font-bold">Ασθενής</th>
                <th className="p-5 font-bold">Ιδιοκτήτης</th>
                <th className="p-5 font-bold">Κατάσταση</th>
                <th className="p-5 font-bold">Τελ. Επίσκεψη</th>
                <th className="p-5 font-bold text-right">Ενέργειες</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredPatients.map(patient => (
                <tr
                  key={patient.id}
                  onClick={() => setSelectedPatient(patient)}
                  className={`border-b border-slate-50 last:border-0 hover:bg-indigo-50/30 cursor-pointer transition-colors ${
                    selectedPatient?.id === patient.id ? 'bg-indigo-50' : ''
                  }`}
                >
                  <td className="p-5">
                    <div className="flex items-center gap-3">
                      <img
                        src={patient.image}
                        alt={patient.name}
                        className="w-10 h-10 rounded-full object-cover bg-slate-100 border-2 border-white shadow-sm"
                      />
                      <div>
                        <div className="font-bold text-slate-900">{patient.name}</div>
                        <div className="text-slate-500 text-xs">
                          {patient.breed} • {patient.age} Ετών
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="font-medium text-slate-800">{patient.ownerName}</div>
                    <div className="text-slate-400 text-xs">{patient.ownerPhone}</div>
                  </td>
                  <td className="p-5">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        patient.status === 'Active'
                          ? 'bg-green-100 text-green-700'
                          : patient.status === 'Treatment'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {patient.status === 'Active' ? 'Ενεργός' : patient.status === 'Treatment' ? 'Θεραπεία' : 'Ανενεργός'}
                    </span>
                  </td>
                  <td className="p-5 text-slate-600 font-medium">{patient.lastVisit}</td>
                  <td className="p-5 text-right">
                    <button className="text-indigo-600 hover:bg-indigo-100 p-2 rounded-lg transition-colors">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredPatients.length === 0 && (
          <div className="p-12 text-center text-slate-400">Δεν βρέθηκαν ασθενείς με αυτά τα κριτήρια.</div>
        )}
      </div>

      {/* Side Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto ${
          selectedPatient ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {selectedPatient && (
          <div className="min-h-screen flex flex-col">
            {/* Header Image */}
            <div className="h-40 relative">
              <img src={selectedPatient.image} className="w-full h-full object-cover" alt="" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <button
                onClick={() => setSelectedPatient(null)}
                className="absolute top-4 left-4 bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/40 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="absolute bottom-4 left-4 text-white">
                <h2 className="text-2xl font-bold">{selectedPatient.name}</h2>
                <p className="text-white/90 text-sm">{selectedPatient.breed}</p>
              </div>
            </div>

            <div className="p-5 space-y-5 flex-1">
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl text-center border border-slate-100">
                  <span className="block text-slate-400 text-xs font-bold uppercase">Ηλικία</span>
                  <span className="text-slate-800 font-bold text-lg">{selectedPatient.age}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl text-center border border-slate-100">
                  <span className="block text-slate-400 text-xs font-bold uppercase">Βάρος</span>
                  <span className="text-slate-800 font-bold text-lg">{selectedPatient.weight}kg</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl text-center border border-slate-100">
                  <span className="block text-slate-400 text-xs font-bold uppercase">Φύλο</span>
                  <span className="text-slate-800 font-bold text-lg">{selectedPatient.gender === 'Male' ? '♂' : '♀'}</span>
                </div>
              </div>

              {/* Chip */}
              {selectedPatient.chipNumber && (
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase">Microchip</span>
                  <span className="font-mono text-slate-700 font-medium text-sm">{selectedPatient.chipNumber}</span>
                </div>
              )}

              {/* Owner */}
              <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                <h3 className="text-xs font-bold text-indigo-400 uppercase mb-2">Ιδιοκτήτης</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-indigo-600 shadow-sm">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-bold text-indigo-900 text-sm">{selectedPatient.ownerName}</div>
                      <div className="text-indigo-700/70 text-xs">{selectedPatient.ownerPhone}</div>
                    </div>
                  </div>
                  <button className="bg-white text-indigo-600 p-2 rounded-lg shadow-sm hover:bg-indigo-100 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* History */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-slate-800 text-sm">Ιστορικό</h3>
                  <button className="text-xs text-indigo-600 font-bold bg-indigo-50 px-2 py-1 rounded hover:bg-indigo-100">
                    + Προσθήκη
                  </button>
                </div>
                <div className="relative border-l-2 border-slate-100 ml-2 space-y-4">
                  {selectedPatient.history.map((record, idx) => (
                    <div key={idx} className="relative pl-5">
                      <div className="absolute -left-[7px] top-0 w-3 h-3 rounded-full bg-indigo-100 border-2 border-indigo-500" />
                      <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-bold text-slate-800 text-sm">{record.title}</span>
                          <span className="text-xs text-slate-400">{record.date}</span>
                        </div>
                        <p className="text-xs text-slate-600">{record.notes}</p>
                      </div>
                    </div>
                  ))}
                  {selectedPatient.history.length === 0 && (
                    <div className="pl-5 text-slate-400 italic text-sm">Δεν βρέθηκε ιστορικό.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-slate-100 bg-slate-50 mt-auto">
              <button className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Νέο Ραντεβού
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Overlay */}
      {selectedPatient && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setSelectedPatient(null)}
        />
      )}
    </div>
  );
}
