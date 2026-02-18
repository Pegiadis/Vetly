'use client';

import { useState, useMemo } from 'react';
import { useMyMedications, useMyPets } from '@/hooks/useOwnerData';
import { getImageUrl } from '@/lib/api';
import Pagination from '@/components/Pagination';

function isExpired(endDate: string | null): boolean {
  if (!endDate) return false;
  return new Date(endDate) < new Date(new Date().toDateString());
}

function daysUntilEnd(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date(new Date().toDateString());
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function MedicationsPage() {
  const [showActive, setShowActive] = useState(true);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const { medications, total, totalPages, loading, error } = useMyMedications(showActive, page, 10);
  const { pets } = useMyPets(1, 50);

  const filtered = useMemo(() => {
    if (!selectedPetId) return medications;
    return medications.filter(m => m.pet_id === selectedPetId);
  }, [medications, selectedPetId]);

  const handleTabChange = (active: boolean) => {
    setShowActive(active);
    setPage(1);
  };

  const handlePetChange = (petId: string | null) => {
    setSelectedPetId(petId);
    setPage(1);
  };

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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Active/Inactive Tabs */}
        <div className="bg-white rounded-2xl p-1 shadow-sm border border-slate-100 inline-flex">
          <button
            onClick={() => handleTabChange(true)}
            className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${
              showActive
                ? 'bg-teal-600 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Ενεργά
          </button>
          <button
            onClick={() => handleTabChange(false)}
            className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${
              !showActive
                ? 'bg-teal-600 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Παλαιότερα
          </button>
        </div>

        {/* Pet Filter */}
        {pets.length > 1 && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handlePetChange(null)}
              className={`px-4 py-2 rounded-xl font-bold text-sm transition-all border ${
                selectedPetId === null
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              Όλα
            </button>
            {pets.map((pet) => (
              <button
                key={pet.id}
                onClick={() => handlePetChange(pet.id)}
                className={`px-4 py-2 rounded-xl font-bold text-sm transition-all border flex items-center gap-2 ${
                  selectedPetId === pet.id
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300'
                }`}
              >
                <span className="text-base">{pet.type === 'dog' ? '🐕' : pet.type === 'cat' ? '🐈' : '🐾'}</span>
                {pet.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Medications List */}
      <div className="space-y-4">
        {filtered.length > 0 ? (
          filtered.map((med) => {
            const expired = isExpired(med.end_date);
            const endingSoon = med.end_date && !expired && daysUntilEnd(med.end_date) <= 7;

            return (
              <div
                key={med.id}
                className={`bg-white rounded-2xl p-6 shadow-sm border transition-all ${
                  expired ? 'border-red-200 bg-red-50/30' : 'border-slate-100 hover:border-teal-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center ${
                    expired ? 'bg-red-100' : 'bg-teal-100'
                  }`}>
                    {med.pet?.image_url ? (
                      <img src={getImageUrl(med.pet.image_url)} alt={med.pet.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className={`font-bold ${expired ? 'text-red-700' : 'text-teal-700'}`}>
                        {med.pet?.name?.charAt(0) || '?'}
                      </span>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-slate-900">{med.name}</h3>
                        <p className="text-sm text-slate-500">{med.pet?.name || 'Άγνωστο'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {expired ? (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                            Ολοκληρώθηκε
                          </span>
                        ) : endingSoon ? (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                            Λήγει σε {daysUntilEnd(med.end_date!)} ημ.
                          </span>
                        ) : med.is_active ? (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                            Ενεργό
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500">
                            Ανενεργό
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-bold">Δοσολογία</p>
                        <p className="text-sm text-slate-800 font-medium">{med.dosage}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-bold">Έναρξη</p>
                        <p className="text-sm text-slate-800 font-medium">
                          {new Date(med.start_date).toLocaleDateString('el-GR', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-bold">Λήξη</p>
                        <p className={`text-sm font-medium ${expired ? 'text-red-600' : 'text-slate-800'}`}>
                          {med.end_date
                            ? new Date(med.end_date).toLocaleDateString('el-GR', { day: 'numeric', month: 'short', year: 'numeric' })
                            : 'Συνεχής'}
                        </p>
                      </div>
                    </div>

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
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}
