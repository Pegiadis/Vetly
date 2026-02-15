'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useMyPets, useVets, useAvailableSlots, createAppointment, Vet } from '@/hooks/useOwnerData';
import CalendarPicker from '@/components/CalendarPicker';
import { getImageUrl } from '@/lib/api';
import { VetSearchMap } from '@/components/MapView';

const appointmentTypes = [
  { id: 'Checkup', name: 'Γενικός Έλεγχος', icon: '🩺' },
  { id: 'Vaccination', name: 'Εμβολιασμός', icon: '💉' },
  { id: 'Dental Cleaning', name: 'Οδοντιατρικά', icon: '🦷' },
  { id: 'Emergency', name: 'Επείγον', icon: '🚨' },
  { id: 'Surgery', name: 'Χειρουργείο', icon: '🏥' },
  { id: 'Grooming', name: 'Περιποίηση', icon: '✂️' },
];

type Step = 1 | 2 | 3 | 4;

export default function BookPage() {
  const { pets, loading: petsLoading } = useMyPets();
  const { vets, loading: vetsLoading, refetch: refetchVets } = useVets();

  const [step, setStep] = useState<Step>(1);
  const [selectedPet, setSelectedPet] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedVet, setSelectedVet] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { slots: availableSlots, loading: slotsLoading } = useAvailableSlots(selectedVet, selectedDate);

  // Clear selected time when vet or date changes
  useEffect(() => {
    setSelectedTime(null);
  }, [selectedVet, selectedDate]);

  // Refetch vets when reaching step 2 to get latest ratings
  useEffect(() => {
    if (step === 2 && refetchVets) {
      refetchVets();
    }
  }, [step, refetchVets]);

  const canProceed = () => {
    switch (step) {
      case 1: return selectedPet && selectedType;
      case 2: return selectedVet;
      case 3: return selectedDate && selectedTime;
      case 4: return true;
      default: return false;
    }
  };

  const handleConfirm = async () => {
    if (!selectedPet || !selectedVet || !selectedDate || !selectedTime || !selectedType) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const scheduledAt = `${selectedDate}T${selectedTime}:00`;

      await createAppointment({
        vet_id: selectedVet,
        pet_id: selectedPet,
        scheduled_at: scheduledAt,
        type: selectedType,
        duration_minutes: 30,
        notes: notes || undefined,
      });

      setStep(4);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create appointment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (step === 3) {
      handleConfirm();
    } else {
      setStep((s) => Math.min(4, s + 1) as Step);
    }
  };

  const maxDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    return d;
  }, []);

  const selectedPetData = pets.find(p => p.id === selectedPet);
  const selectedVetData = vets.find(v => v.id === selectedVet);
  const selectedTypeData = appointmentTypes.find(t => t.id === selectedType);

  return (
    <div className={`mx-auto ${step === 2 ? 'max-w-6xl' : 'max-w-3xl'} transition-all duration-300`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Κλείστε Ραντεβού</h1>
        <p className="text-slate-500 mt-1">Ακολουθήστε τα βήματα για να κλείσετε ραντεβού.</p>
      </div>

      {/* Progress Steps */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                step >= s ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-400'
              }`}>
                {s}
              </div>
              {s < 4 && (
                <div className={`w-16 md:w-24 h-1 mx-2 rounded ${step > s ? 'bg-teal-600' : 'bg-slate-100'}`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-slate-500">
          <span>Κατοικίδιο</span>
          <span>Κτηνίατρος</span>
          <span>Ημ/νία</span>
          <span>Επιβεβαίωση</span>
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        {/* Step 1: Select Pet & Type */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-slate-800 mb-4">Επιλέξτε κατοικίδιο</h3>
              {petsLoading ? (
                <div className="text-center py-8 text-slate-500">Φόρτωση κατοικιδίων...</div>
              ) : pets.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-500 mb-4">Δεν έχετε καταχωρημένα κατοικίδια.</p>
                  <Link href="/owner/pets/add" className="text-teal-600 font-medium hover:underline">
                    Προσθέστε κατοικίδιο
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {pets.map((pet) => (
                    <button
                      key={pet.id}
                      onClick={() => setSelectedPet(pet.id)}
                      className={`p-4 rounded-xl border-2 transition-all text-center ${
                        selectedPet === pet.id
                          ? 'border-teal-500 bg-teal-50'
                          : 'border-slate-100 hover:border-teal-200'
                      }`}
                    >
                      <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-2 bg-slate-100 flex items-center justify-center">
                        {pet.image_url ? (
                          <img src={getImageUrl(pet.image_url)} alt={pet.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl">{pet.type === 'dog' ? '🐕' : pet.type === 'cat' ? '🐈' : '🐾'}</span>
                        )}
                      </div>
                      <p className="font-bold text-slate-800">{pet.name}</p>
                      <p className="text-xs text-slate-500">{pet.breed || pet.type}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="font-bold text-slate-800 mb-4">Τύπος ραντεβού</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {appointmentTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`p-4 rounded-xl border-2 transition-all text-center ${
                      selectedType === type.id
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-slate-100 hover:border-teal-200'
                    }`}
                  >
                    <span className="text-2xl mb-2 block">{type.icon}</span>
                    <p className="font-medium text-slate-800 text-sm">{type.name}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Select Vet with Map */}
        {step === 2 && (
          <div>
            <h3 className="font-bold text-slate-800 mb-1">Επιλέξτε κτηνίατρο</h3>
            <p className="text-sm text-slate-500 mb-4">Βρείτε κτηνιάτρους στον χάρτη ή επιλέξτε από τη λίστα.</p>
            {vetsLoading ? (
              <div className="text-center py-8 text-slate-500">Φόρτωση κτηνιάτρων...</div>
            ) : vets.length === 0 ? (
              <div className="text-center py-8 text-slate-500">Δεν βρέθηκαν κτηνίατροι.</div>
            ) : (
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Map — takes most of the width */}
                <div className="lg:flex-1 relative">
                  <div className="h-[350px] lg:h-[520px] rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                    <VetSearchMap
                      vets={vets
                        .filter((v: Vet) => v.coordinates_lat && v.coordinates_lng)
                        .map((v: Vet) => ({
                          id: v.id,
                          name: v.name,
                          specialty: v.specialty,
                          rating_average: v.rating_average,
                          reviews_count: v.reviews_count,
                          address: v.address,
                          lat: v.coordinates_lat!,
                          lng: v.coordinates_lng!,
                        }))}
                      selectedVetId={selectedVet}
                      onSelectVet={setSelectedVet}
                    />
                  </div>
                </div>

                {/* Vet list — scrollable column */}
                <div className="lg:w-80 xl:w-96 flex flex-col">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">{vets.length} κτηνίατροι</p>
                  <div className="overflow-y-auto max-h-[300px] lg:max-h-[480px] space-y-2 pr-1">
                    {vets.map((vet) => (
                      <button
                        key={vet.id}
                        onClick={() => setSelectedVet(vet.id)}
                        className={`w-full p-3 rounded-xl border-2 transition-all text-left flex items-center gap-3 ${
                          selectedVet === vet.id
                            ? 'border-teal-500 bg-teal-50 shadow-md'
                            : 'border-slate-100 hover:border-teal-200'
                        }`}
                      >
                        <div className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100 flex items-center justify-center">
                          {vet.image_url ? (
                            <img src={getImageUrl(vet.image_url)} alt={vet.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-lg">👨‍⚕️</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-800 text-sm truncate">{vet.name}</p>
                          <p className="text-xs text-slate-500">{vet.specialty}</p>
                          {vet.address && (
                            <p className="text-xs text-slate-400 truncate mt-0.5 flex items-center gap-1">
                              <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                              <span className="truncate">{vet.address}</span>
                            </p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="flex items-center gap-1 text-amber-500">
                            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                            </svg>
                            <span className="font-bold text-slate-800 text-sm">{Number(vet.rating_average).toFixed(1)}</span>
                          </div>
                          <p className="text-xs text-slate-400">{vet.reviews_count} αξιολ.</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Select Date & Time */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-slate-800 mb-4">Επιλέξτε ημερομηνία</h3>
              <CalendarPicker
                value={selectedDate}
                onChange={setSelectedDate}
                minDate={new Date()}
                maxDate={maxDate}
                accentColor="teal"
              />
            </div>

            {selectedDate && (
              <div>
                <h3 className="font-bold text-slate-800 mb-4">Επιλέξτε ώρα</h3>
                {slotsLoading ? (
                  <div className="text-center py-8 text-slate-500">
                    <svg className="animate-spin h-6 w-6 mx-auto mb-2 text-teal-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Φόρτωση διαθέσιμων ωρών...
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <p className="font-medium">Δεν υπάρχουν διαθέσιμες ώρες</p>
                    <p className="text-sm mt-1">Δοκιμάστε διαφορετική ημερομηνία.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {availableSlots.map((time) => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={`p-3 rounded-xl border-2 font-medium text-sm transition-all ${
                          selectedTime === time
                            ? 'border-teal-500 bg-teal-50 text-teal-700'
                            : 'border-slate-100 hover:border-teal-200 text-slate-600'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div>
              <h3 className="font-bold text-slate-800 mb-4">Σημειώσεις (προαιρετικό)</h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Περιγράψτε τα συμπτώματα ή οποιαδήποτε άλλη πληροφορία..."
                rows={3}
                className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
              />
            </div>

            {submitError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {submitError}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Confirmation */}
        {step === 4 && (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Το αίτημα στάλθηκε!</h2>
            <p className="text-slate-500 mb-8">Θα ενημερωθείτε όταν επιβεβαιωθεί το ραντεβού.</p>

            <div className="bg-slate-50 rounded-xl p-4 text-left mb-8">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Κατοικίδιο</p>
                  <p className="font-bold text-slate-800">{selectedPetData?.name}</p>
                </div>
                <div>
                  <p className="text-slate-500">Τύπος</p>
                  <p className="font-bold text-slate-800">{selectedTypeData?.name}</p>
                </div>
                <div>
                  <p className="text-slate-500">Κτηνίατρος</p>
                  <p className="font-bold text-slate-800">{selectedVetData?.name}</p>
                </div>
                <div>
                  <p className="text-slate-500">Ημ/νία & Ώρα</p>
                  <p className="font-bold text-slate-800">{selectedDate} στις {selectedTime}</p>
                </div>
              </div>
            </div>

            <Link
              href="/owner/appointments"
              className="inline-flex items-center gap-2 bg-teal-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-teal-700 transition-colors"
            >
              Δείτε τα ραντεβού σας
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}

        {/* Navigation Buttons */}
        {step < 4 && (
          <div className="flex justify-between mt-8 pt-6 border-t border-slate-100">
            <button
              onClick={() => setStep((s) => Math.max(1, s - 1) as Step)}
              disabled={step === 1}
              className="px-6 py-2 text-slate-600 font-bold rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Πίσω
            </button>
            <button
              onClick={handleNext}
              disabled={!canProceed() || submitting}
              className="px-6 py-2 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Αποστολή...
                </>
              ) : (
                step === 3 ? 'Επιβεβαίωση' : 'Συνέχεια'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
