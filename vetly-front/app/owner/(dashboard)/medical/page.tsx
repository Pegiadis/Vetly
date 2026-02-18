'use client';

import { useState, useEffect, useMemo } from 'react';
import { useMyPets, usePetMedicalHistory, OwnerMedicalEvent } from '@/hooks/useOwnerData';
import { api, getImageUrl } from '@/lib/api';
import Pagination from '@/components/Pagination';

const eventTypeColors: Record<string, { bg: string; text: string; icon: string }> = {
  'Vaccination': { bg: 'bg-green-100', text: 'text-green-700', icon: '💉' },
  'Checkup': { bg: 'bg-blue-100', text: 'text-blue-700', icon: '🩺' },
  'Surgery': { bg: 'bg-red-100', text: 'text-red-700', icon: '🏥' },
  'Dental': { bg: 'bg-purple-100', text: 'text-purple-700', icon: '🦷' },
  'Emergency': { bg: 'bg-orange-100', text: 'text-orange-700', icon: '🚨' },
  'Lab Test': { bg: 'bg-cyan-100', text: 'text-cyan-700', icon: '🔬' },
  'X-Ray': { bg: 'bg-indigo-100', text: 'text-indigo-700', icon: '📷' },
  'Medication': { bg: 'bg-amber-100', text: 'text-amber-700', icon: '💊' },
};

const eventTypeTranslations: Record<string, string> = {
  'Vaccination': 'Εμβολιασμός',
  'Checkup': 'Εξέταση',
  'Surgery': 'Χειρουργείο',
  'Dental': 'Οδοντιατρικά',
  'Emergency': 'Επείγον',
  'Lab Test': 'Εργαστηριακές',
  'X-Ray': 'Ακτινογραφία',
  'Medication': 'Φαρμακευτική',
};

const EVENT_TYPE_OPTIONS = [
  { value: '', label: 'Όλα' },
  { value: 'Vaccination', label: 'Εμβολιασμός' },
  { value: 'Checkup', label: 'Εξέταση' },
  { value: 'Surgery', label: 'Χειρουργείο' },
  { value: 'Dental', label: 'Οδοντιατρικά' },
  { value: 'Emergency', label: 'Επείγον' },
  { value: 'Lab Test', label: 'Εργαστηριακά' },
  { value: 'X-Ray', label: 'Ακτινογραφία' },
  { value: 'Medication', label: 'Φαρμακευτική αγωγή' },
];

export default function MedicalPage() {
  const { pets, loading: petsLoading } = useMyPets(1, 50);
  const [selectedPetId, setSelectedPetId] = useState<string>('all');
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [page, setPage] = useState(1);

  // For single pet: use the hook with pagination
  const singlePetId = selectedPetId !== 'all' ? selectedPetId : null;
  const { events: singlePetEvents, totalPages: singlePetTotalPages, loading: singlePetLoading } = usePetMedicalHistory(
    singlePetId, page, 10, eventTypeFilter || undefined
  );

  // For "all pets": fetch from all pets combined
  const [allEvents, setAllEvents] = useState<OwnerMedicalEvent[]>([]);
  const [allTotal, setAllTotal] = useState(0);
  const [allLoading, setAllLoading] = useState(false);

  useEffect(() => {
    if (selectedPetId !== 'all' || petsLoading || pets.length === 0) return;

    const fetchAll = async () => {
      setAllLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('page_size', '10');
        if (eventTypeFilter) params.set('event_type', eventTypeFilter);
        const results = await Promise.all(
          pets.map(pet =>
            api.get<{ items: OwnerMedicalEvent[]; total: number }>(`/owner/pets/${pet.id}/medical-history?${params.toString()}`)
          )
        );
        const combined = results.flatMap(r => r.items);
        combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const totalAll = results.reduce((sum, r) => sum + r.total, 0);
        setAllEvents(combined);
        setAllTotal(totalAll);
      } catch {
        setAllEvents([]);
        setAllTotal(0);
      } finally {
        setAllLoading(false);
      }
    };

    fetchAll();
  }, [selectedPetId, pets, petsLoading, page, eventTypeFilter]);

  const events = selectedPetId === 'all' ? allEvents : singlePetEvents;
  const totalPages = selectedPetId === 'all' ? Math.ceil(allTotal / 10) || 1 : singlePetTotalPages;
  const loading = selectedPetId === 'all' ? allLoading : singlePetLoading;

  const handlePetChange = (petId: string) => {
    setSelectedPetId(petId);
    setPage(1);
  };

  const handleEventTypeChange = (type: string) => {
    setEventTypeFilter(type);
    setPage(1);
  };

  if (petsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Ιατρικό Ιστορικό</h1>
        <p className="text-slate-500 mt-1">Δείτε το πλήρες ιατρικό ιστορικό των κατοικιδίων σας.</p>
      </div>

      {/* Filters */}
      <div className="space-y-3 mb-6">
        {/* Pet Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => handlePetChange('all')}
            className={`px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
              selectedPetId === 'all'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-teal-300'
            }`}
          >
            Όλα τα κατοικίδια
          </button>
          {pets.map((pet) => (
            <button
              key={pet.id}
              onClick={() => handlePetChange(pet.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
                selectedPetId === pet.id
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-teal-300'
              }`}
            >
              <div className={`w-6 h-6 rounded-full overflow-hidden flex items-center justify-center ${
                selectedPetId === pet.id ? 'bg-teal-500' : 'bg-teal-100'
              }`}>
                {pet.image_url ? (
                  <img src={getImageUrl(pet.image_url)} alt={pet.name} className="w-full h-full object-cover" />
                ) : (
                  <span className={`text-xs font-bold ${
                    selectedPetId === pet.id ? 'text-white' : 'text-teal-700'
                  }`}>{pet.name.charAt(0)}</span>
                )}
              </div>
              {pet.name}
            </button>
          ))}
        </div>

        {/* Event Type Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide whitespace-nowrap mr-1">Τύπος</span>
          {EVENT_TYPE_OPTIONS.map(opt => {
            const isActive = eventTypeFilter === opt.value;
            const typeStyle = opt.value ? eventTypeColors[opt.value] : null;
            return (
              <button
                key={opt.value}
                onClick={() => handleEventTypeChange(opt.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs whitespace-nowrap transition-all ${
                  isActive
                    ? typeStyle
                      ? `${typeStyle.bg} ${typeStyle.text} ring-1 ring-current/20`
                      : 'bg-slate-800 text-white'
                    : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'
                }`}
              >
                {typeStyle && <span className="text-sm">{typeStyle.icon}</span>}
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
        </div>
      )}

      {/* Timeline */}
      {!loading && (
        <div className="space-y-4">
          {events.length > 0 ? (
            events.map((event, index) => {
              const typeStyle = eventTypeColors[event.event_type] || { bg: 'bg-slate-100', text: 'text-slate-700', icon: '📋' };
              const pet = pets.find(p => p.id === event.pet_id);
              const typeLabel = eventTypeTranslations[event.event_type] || event.event_type;

              return (
                <div key={event.id} className="relative">
                  {/* Timeline Line */}
                  {index < events.length - 1 && (
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
                              {typeLabel}
                            </span>
                            {selectedPetId === 'all' && pet && (
                              <span className="flex items-center gap-1 text-xs text-slate-500">
                                <div className="w-4 h-4 rounded-full overflow-hidden bg-teal-100 flex items-center justify-center">
                                  {pet.image_url ? (
                                    <img src={getImageUrl(pet.image_url)} alt={pet.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-teal-700 text-[8px] font-bold">{pet.name.charAt(0)}</span>
                                  )}
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

                      {event.notes && (
                        <p className="text-sm text-slate-600 mb-3">{event.notes}</p>
                      )}

                      {event.vet && (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {event.vet.name}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Κανένα ιατρικό ιστορικό</h3>
              <p className="text-slate-500">Δεν υπάρχουν καταγεγραμμένα ιατρικά γεγονότα.</p>
            </div>
          )}
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
