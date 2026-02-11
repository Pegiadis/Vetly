'use client';

import { useState, useMemo } from 'react';
import { useMyMedications } from '@/hooks/useOwnerData';

const frequencyTranslations: Record<string, string> = {
  'daily': 'Καθημερινά',
  'weekly': 'Εβδομαδιαία',
  'once': 'Εφάπαξ',
};

export default function MedicationsPage() {
  const [showActive, setShowActive] = useState(true);
  const { medications, loading, error } = useMyMedications();

  const filtered = useMemo(() => {
    return medications.filter(m => m.is_active === showActive);
  }, [medications, showActive]);

  const activeCount = useMemo(() => medications.filter(m => m.is_active).length, [medications]);
  const inactiveCount = useMemo(() => medications.filter(m => !m.is_active).length, [medications]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Φάρμακα</h1>
          <p className="text-slate-500 mt-1">Διαχειριστείτε τα φάρμακα των κατοικιδίων σας.</p>
        </div>
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
          Ενεργά ({activeCount})
        </button>
        <button
          onClick={() => setShowActive(false)}
          className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${
            !showActive
              ? 'bg-teal-600 text-white'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          Παλαιότερα ({inactiveCount})
        </button>
      </div>

      {/* Medications List */}
      <div className="space-y-4">
        {filtered.length > 0 ? (
          filtered.map((med) => {
            return (
              <div
                key={med.id}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:border-teal-200 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-teal-100 flex items-center justify-center">
                    {med.pet?.image_url ? (
                      <img src={med.pet.image_url} alt={med.pet.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-teal-700 font-bold">{med.pet?.name?.charAt(0) || '?'}</span>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-slate-900">{med.name}</h3>
                        <p className="text-sm text-slate-500">{med.pet?.name || 'Άγνωστο'}</p>
                      </div>
                      {med.is_active && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                          Ενεργό
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-bold">Δοσολογία</p>
                        <p className="text-sm text-slate-800 font-medium">{med.dosage}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-bold">Συχνότητα</p>
                        <p className="text-sm text-slate-800 font-medium">
                          {frequencyTranslations[med.frequency] || med.frequency}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-bold">Έναρξη</p>
                        <p className="text-sm text-slate-800 font-medium">
                          {new Date(med.start_date).toLocaleDateString('el-GR', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-bold">Λήξη</p>
                        <p className="text-sm text-slate-800 font-medium">
                          {med.end_date
                            ? new Date(med.end_date).toLocaleDateString('el-GR', { day: 'numeric', month: 'short', year: 'numeric' })
                            : 'Συνεχής'}
                        </p>
                      </div>
                    </div>

                    {med.time && (
                      <div className="text-xs text-slate-500 mb-2">
                        Ώρα λήψης: <span className="font-medium text-slate-700">{med.time}</span>
                      </div>
                    )}

                    {med.notes && (
                      <p className="text-sm text-slate-500 italic">{med.notes}</p>
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
