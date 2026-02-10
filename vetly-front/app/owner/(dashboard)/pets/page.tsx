'use client';

import { useState } from 'react';

// Mock data
const mockPets = [
  {
    id: '1',
    name: 'Μάξ',
    type: 'Σκύλος',
    breed: 'Golden Retriever',
    age: 3,
    weight: 32,
    gender: 'Αρσενικό',
    chipNumber: 'GR123456789',
    image: 'https://picsum.photos/400/400?random=10',
    lastVisit: '15 Μαΐου 2024',
    nextAppointment: '25 Ιουνίου 2024',
  },
  {
    id: '2',
    name: 'Λούνα',
    type: 'Γάτα',
    breed: 'Persian',
    age: 2,
    weight: 4.5,
    gender: 'Θηλυκό',
    chipNumber: 'GR987654321',
    image: 'https://picsum.photos/400/400?random=11',
    lastVisit: '20 Απριλίου 2024',
    nextAppointment: null,
  },
  {
    id: '3',
    name: 'Κόκο',
    type: 'Παπαγάλος',
    breed: 'Parakeet',
    age: 5,
    weight: 0.035,
    gender: 'Αρσενικό',
    chipNumber: null,
    image: 'https://picsum.photos/400/400?random=12',
    lastVisit: '10 Μαρτίου 2024',
    nextAppointment: null,
  },
];

export default function PetsPage() {
  const [selectedPet, setSelectedPet] = useState(mockPets[0]);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Τα Κατοικίδιά Μου</h1>
          <p className="text-slate-500 mt-1">Διαχειριστείτε τα προφίλ των κατοικιδίων σας.</p>
        </div>
        <button className="bg-teal-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-teal-700 transition-colors flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Προσθήκη
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pet List */}
        <div className="lg:col-span-1 space-y-4">
          {mockPets.map((pet) => (
            <button
              key={pet.id}
              onClick={() => setSelectedPet(pet)}
              className={`w-full p-4 rounded-2xl border transition-all text-left ${
                selectedPet.id === pet.id
                  ? 'bg-teal-50 border-teal-200 shadow-md'
                  : 'bg-white border-slate-100 hover:border-teal-200'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-slate-100">
                  <img src={pet.image} alt={pet.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{pet.name}</h3>
                  <p className="text-sm text-slate-500">{pet.type} • {pet.breed}</p>
                  <p className="text-xs text-slate-400 mt-1">{pet.age} ετών</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Pet Details */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {/* Pet Header */}
            <div className="relative h-48 bg-gradient-to-br from-teal-500 to-teal-600">
              <div className="absolute -bottom-12 left-6">
                <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-white shadow-lg">
                  <img src={selectedPet.image} alt={selectedPet.name} className="w-full h-full object-cover" />
                </div>
              </div>
              <button className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm text-white p-2 rounded-xl hover:bg-white/30 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>

            {/* Pet Info */}
            <div className="pt-16 p-6">
              <h2 className="text-2xl font-bold text-slate-900">{selectedPet.name}</h2>
              <p className="text-slate-500">{selectedPet.type} • {selectedPet.breed}</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="bg-slate-50 p-4 rounded-xl">
                  <p className="text-xs text-slate-500 uppercase font-bold">Ηλικία</p>
                  <p className="text-lg font-bold text-slate-900">{selectedPet.age} ετών</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl">
                  <p className="text-xs text-slate-500 uppercase font-bold">Βάρος</p>
                  <p className="text-lg font-bold text-slate-900">{selectedPet.weight} kg</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl">
                  <p className="text-xs text-slate-500 uppercase font-bold">Φύλο</p>
                  <p className="text-lg font-bold text-slate-900">{selectedPet.gender}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl">
                  <p className="text-xs text-slate-500 uppercase font-bold">Microchip</p>
                  <p className="text-lg font-bold text-slate-900">{selectedPet.chipNumber || '-'}</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-6 flex flex-wrap gap-3">
                <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Κλείστε Ραντεβού
                </button>
                <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  Ιατρικό Ιστορικό
                </button>
                <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                  Φάρμακα
                </button>
              </div>

              {/* Recent Activity */}
              <div className="mt-8">
                <h3 className="font-bold text-slate-800 mb-4">Πρόσφατη Δραστηριότητα</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">Τελευταία επίσκεψη</p>
                      <p className="text-sm text-slate-500">{selectedPet.lastVisit}</p>
                    </div>
                  </div>
                  {selectedPet.nextAppointment && (
                    <div className="flex items-center gap-4 p-3 bg-teal-50 rounded-xl">
                      <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center text-teal-600">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-teal-800">Επόμενο ραντεβού</p>
                        <p className="text-sm text-teal-600">{selectedPet.nextAppointment}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
