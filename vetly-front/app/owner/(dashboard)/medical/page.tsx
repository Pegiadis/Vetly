'use client';

import { useState } from 'react';

// Mock data
const mockPets = [
  { id: '1', name: 'Μάξ', image: 'https://picsum.photos/100/100?random=10' },
  { id: '2', name: 'Λούνα', image: 'https://picsum.photos/100/100?random=11' },
];

const mockMedicalEvents = [
  { id: '1', petId: '1', date: '2024-06-15', type: 'Εμβολιασμός', title: 'Ετήσιος Εμβολιασμός', vet: 'Δρ. Παπαδόπουλος', notes: 'Λύσσα, Παρβοϊός, Διστέμπερ. Επόμενος εμβολιασμός σε 1 χρόνο.' },
  { id: '2', petId: '1', date: '2024-05-20', type: 'Εξέταση', title: 'Γενικός Έλεγχος', vet: 'Δρ. Παπαδόπουλος', notes: 'Καλή υγεία γενικά. Συνιστάται απώλεια 1kg.' },
  { id: '3', petId: '1', date: '2024-03-10', type: 'Χειρουργείο', title: 'Στείρωση', vet: 'Δρ. Αλεξίου', notes: 'Επιτυχής επέμβαση. Follow-up σε 10 ημέρες.' },
  { id: '4', petId: '1', date: '2024-01-15', type: 'Οδοντιατρικά', title: 'Καθαρισμός Δοντιών', vet: 'Δρ. Γεωργίου', notes: 'Αφαίρεση πλάκας. Καλή στοματική υγεία.' },
  { id: '5', petId: '2', date: '2024-05-10', type: 'Εμβολιασμός', title: 'Τριπλός Εμβολιασμός', vet: 'Δρ. Παπαδόπουλος', notes: 'Καλοϊκός, Πανλευκοπενία, Ρινοτραχειίτιδα.' },
  { id: '6', petId: '2', date: '2024-04-20', type: 'Δερματολογικά', title: 'Έλεγχος Δέρματος', vet: 'Δρ. Γεωργίου', notes: 'Μικρή αλλεργική αντίδραση. Συνταγογράφηση αντιισταμινικών.' },
];

const eventTypeColors: Record<string, { bg: string; text: string; icon: string }> = {
  'Εμβολιασμός': { bg: 'bg-green-100', text: 'text-green-700', icon: '💉' },
  'Εξέταση': { bg: 'bg-blue-100', text: 'text-blue-700', icon: '🩺' },
  'Χειρουργείο': { bg: 'bg-red-100', text: 'text-red-700', icon: '🏥' },
  'Οδοντιατρικά': { bg: 'bg-purple-100', text: 'text-purple-700', icon: '🦷' },
  'Δερματολογικά': { bg: 'bg-amber-100', text: 'text-amber-700', icon: '🧴' },
};

export default function MedicalPage() {
  const [selectedPet, setSelectedPet] = useState<string>('all');

  const filteredEvents = selectedPet === 'all'
    ? mockMedicalEvents
    : mockMedicalEvents.filter(e => e.petId === selectedPet);

  const sortedEvents = [...filteredEvents].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Ιατρικό Ιστορικό</h1>
        <p className="text-slate-500 mt-1">Δείτε το πλήρες ιατρικό ιστορικό των κατοικιδίων σας.</p>
      </div>

      {/* Pet Filter */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-6">
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedPet('all')}
            className={`px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
              selectedPet === 'all'
                ? 'bg-teal-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Όλα
          </button>
          {mockPets.map((pet) => (
            <button
              key={pet.id}
              onClick={() => setSelectedPet(pet.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
                selectedPet === pet.id
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <div className="w-6 h-6 rounded-full overflow-hidden">
                <img src={pet.image} alt={pet.name} className="w-full h-full object-cover" />
              </div>
              {pet.name}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {sortedEvents.length > 0 ? (
          sortedEvents.map((event, index) => {
            const typeStyle = eventTypeColors[event.type] || { bg: 'bg-slate-100', text: 'text-slate-700', icon: '📋' };
            const pet = mockPets.find(p => p.id === event.petId);

            return (
              <div key={event.id} className="relative">
                {/* Timeline Line */}
                {index < sortedEvents.length - 1 && (
                  <div className="absolute left-7 top-14 w-0.5 h-full bg-slate-200" />
                )}

                <div className="flex gap-4">
                  {/* Timeline Dot */}
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${typeStyle.bg}`}>
                    <span className="text-2xl">{typeStyle.icon}</span>
                  </div>

                  {/* Event Card */}
                  <div className="flex-1 bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:border-teal-200 transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${typeStyle.bg} ${typeStyle.text}`}>
                            {event.type}
                          </span>
                          {selectedPet === 'all' && pet && (
                            <span className="flex items-center gap-1 text-xs text-slate-500">
                              <div className="w-4 h-4 rounded-full overflow-hidden">
                                <img src={pet.image} alt={pet.name} className="w-full h-full object-cover" />
                              </div>
                              {pet.name}
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-slate-900">{event.title}</h3>
                      </div>
                      <span className="text-sm text-slate-500">
                        {new Date(event.date).toLocaleDateString('el-GR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    <p className="text-sm text-slate-600 mb-3">{event.notes}</p>

                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {event.vet}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-100 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Κανένα ιατρικό ιστορικό</h3>
            <p className="text-slate-500">Δεν υπάρχουν καταγεγραμμένα ιατρικά γεγονότα.</p>
          </div>
        )}
      </div>
    </div>
  );
}
