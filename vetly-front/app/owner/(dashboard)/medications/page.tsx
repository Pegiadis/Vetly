'use client';

import { useState } from 'react';

// Mock data
const mockMedications = [
  {
    id: '1',
    petId: '1',
    petName: 'Μάξ',
    petImage: 'https://picsum.photos/100/100?random=10',
    name: 'Αντιπαρασιτικό Frontline',
    dosage: '1 αμπούλα',
    frequency: 'Κάθε μήνα',
    startDate: '2024-01-01',
    endDate: null,
    nextDose: '2024-06-25',
    notes: 'Εφαρμογή στον αυχένα',
    isActive: true,
  },
  {
    id: '2',
    petId: '1',
    petName: 'Μάξ',
    petImage: 'https://picsum.photos/100/100?random=10',
    name: 'Χάπι για αρθρώσεις',
    dosage: '1 χάπι',
    frequency: 'Καθημερινά',
    startDate: '2024-03-15',
    endDate: '2024-09-15',
    nextDose: '2024-06-23',
    notes: 'Με το φαγητό',
    isActive: true,
  },
  {
    id: '3',
    petId: '2',
    petName: 'Λούνα',
    petImage: 'https://picsum.photos/100/100?random=11',
    name: 'Βιταμίνες',
    dosage: '1/2 κ.γ.',
    frequency: 'Καθημερινά',
    startDate: '2024-02-01',
    endDate: null,
    nextDose: '2024-06-23',
    notes: 'Ανακατεύουμε με τροφή',
    isActive: true,
  },
  {
    id: '4',
    petId: '2',
    petName: 'Λούνα',
    petImage: 'https://picsum.photos/100/100?random=11',
    name: 'Αντιισταμινικό',
    dosage: '1/4 χάπι',
    frequency: '2 φορές/ημέρα',
    startDate: '2024-04-20',
    endDate: '2024-05-20',
    nextDose: null,
    notes: 'Για αλλεργία',
    isActive: false,
  },
];

export default function MedicationsPage() {
  const [showActive, setShowActive] = useState(true);

  const filteredMeds = mockMedications.filter(m => m.isActive === showActive);

  const getDaysUntilNextDose = (nextDose: string | null) => {
    if (!nextDose) return null;
    const today = new Date();
    const next = new Date(nextDose);
    const diffTime = next.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Φάρμακα</h1>
          <p className="text-slate-500 mt-1">Διαχειριστείτε τα φάρμακα των κατοικιδίων σας.</p>
        </div>
        <button className="bg-teal-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-teal-700 transition-colors flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Προσθήκη
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl p-1 shadow-sm border border-slate-100 mb-6 inline-flex">
        <button
          onClick={() => setShowActive(true)}
          className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${
            showActive
              ? 'bg-teal-600 text-white'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          Ενεργά ({mockMedications.filter(m => m.isActive).length})
        </button>
        <button
          onClick={() => setShowActive(false)}
          className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${
            !showActive
              ? 'bg-teal-600 text-white'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          Παλαιότερα ({mockMedications.filter(m => !m.isActive).length})
        </button>
      </div>

      {/* Medications List */}
      <div className="space-y-4">
        {filteredMeds.length > 0 ? (
          filteredMeds.map((med) => {
            const daysUntil = getDaysUntilNextDose(med.nextDose);
            const isUrgent = daysUntil !== null && daysUntil <= 1;

            return (
              <div
                key={med.id}
                className={`bg-white rounded-2xl p-6 shadow-sm border transition-all ${
                  isUrgent ? 'border-amber-200 bg-amber-50/30' : 'border-slate-100 hover:border-teal-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                    <img src={med.petImage} alt={med.petName} className="w-full h-full object-cover" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-slate-900">{med.name}</h3>
                        <p className="text-sm text-slate-500">{med.petName}</p>
                      </div>
                      {med.isActive && daysUntil !== null && (
                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                          isUrgent
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {daysUntil === 0 ? 'Σήμερα' : daysUntil === 1 ? 'Αύριο' : `Σε ${daysUntil} μέρες`}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-bold">Δοσολογία</p>
                        <p className="text-sm text-slate-800 font-medium">{med.dosage}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-bold">Συχνότητα</p>
                        <p className="text-sm text-slate-800 font-medium">{med.frequency}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-bold">Έναρξη</p>
                        <p className="text-sm text-slate-800 font-medium">
                          {new Date(med.startDate).toLocaleDateString('el-GR', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-bold">Λήξη</p>
                        <p className="text-sm text-slate-800 font-medium">
                          {med.endDate
                            ? new Date(med.endDate).toLocaleDateString('el-GR', { day: 'numeric', month: 'short' })
                            : 'Συνεχής'}
                        </p>
                      </div>
                    </div>

                    {med.notes && (
                      <p className="text-sm text-slate-500 italic">{med.notes}</p>
                    )}

                    {med.isActive && (
                      <div className="flex gap-2 mt-4">
                        <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl font-bold text-sm hover:bg-teal-700 transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Καταγραφή Δόσης
                        </button>
                        <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-100 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              {showActive ? 'Κανένα ενεργό φάρμακο' : 'Κανένα παλαιότερο φάρμακο'}
            </h3>
            <p className="text-slate-500">
              {showActive ? 'Δεν υπάρχουν ενεργές φαρμακευτικές αγωγές.' : 'Δεν υπάρχει ιστορικό φαρμάκων.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
