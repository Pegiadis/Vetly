'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useMyPets, useVets, useAvailableSlots, useVetServices, createAppointment, createBatchAppointments, Vet, PublicVetService } from '@/hooks/useOwnerData';
import { ApiError } from '@/lib/api';
import CalendarPicker from '@/components/CalendarPicker';
import { getImageUrl } from '@/lib/api';
import { VetSearchMap } from '@/components/MapView';

const dayLabels: Record<string, string> = {
  monday: 'Δευτέρα', tuesday: 'Τρίτη', wednesday: 'Τετάρτη',
  thursday: 'Πέμπτη', friday: 'Παρασκευή', saturday: 'Σάββατο', sunday: 'Κυριακή',
};

type Step = 1 | 2 | 3 | 4;

export default function BookPage() {
  const { pets, loading: petsLoading } = useMyPets();
  const { vets, loading: vetsLoading, refetch: refetchVets } = useVets();

  const [step, setStep] = useState<Step>(1);
  const [selectedPets, setSelectedPets] = useState<Set<string>>(new Set());
  const [selectedVet, setSelectedVet] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<PublicVetService | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { slots: availableSlots, loading: slotsLoading, refetch: refetchSlots } = useAvailableSlots(selectedVet, selectedDate);
  const { services: vetServices, loading: servicesLoading } = useVetServices(selectedVet);

  // Clear selected time when vet or date changes
  useEffect(() => {
    setSelectedTime(null);
  }, [selectedVet, selectedDate]);

  // Clear selected service when vet changes
  useEffect(() => {
    setSelectedService(null);
  }, [selectedVet]);

  // Refetch vets when reaching step 2 to get latest ratings
  useEffect(() => {
    if (step === 2 && refetchVets) {
      refetchVets();
    }
  }, [step, refetchVets]);

  const canProceed = () => {
    switch (step) {
      case 1: return selectedPets.size > 0;
      case 2: return selectedVet !== null && selectedService !== null;
      case 3: return selectedDate && selectedTime;
      case 4: return true;
      default: return false;
    }
  };

  const handleConfirm = async () => {
    if (selectedPets.size === 0 || !selectedVet || !selectedDate || !selectedTime || !selectedService) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const scheduledAt = `${selectedDate}T${selectedTime}:00`;

      if (selectedPets.size === 1) {
        const petId = [...selectedPets][0];
        await createAppointment({
          vet_id: selectedVet!,
          pet_id: petId,
          scheduled_at: scheduledAt,
          type: selectedService.name,
          duration_minutes: selectedService.duration_minutes,
          service_type_id: selectedService.id,
          notes: notes || undefined,
        });
      } else {
        const types: Record<string, string> = {};
        selectedPets.forEach(petId => { types[petId] = selectedService.name; });
        await createBatchAppointments({
          vet_id: selectedVet!,
          pet_ids: [...selectedPets],
          scheduled_at: scheduledAt,
          types,
          duration_minutes: selectedService.duration_minutes,
          service_type_id: selectedService.id,
          notes: notes || undefined,
        });
      }
      setStep(4);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setSubmitError(err.message);
        setSelectedTime(null);
        refetchSlots();
      } else {
        setSubmitError(err instanceof Error ? err.message : 'Αποτυχία δημιουργίας ραντεβού. Δοκιμάστε ξανά.');
      }
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

  const selectedVetData = vets.find(v => v.id === selectedVet);

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
          <span>Κατοικίδια</span>
          <span>Κτηνίατρος & Υπηρεσία</span>
          <span>Ημ/νία</span>
          <span>Επιβεβαίωση</span>
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        {/* Step 1: Select Pets */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-slate-800 mb-1">Επιλέξτε κατοικίδια</h3>
              <p className="text-sm text-slate-500 mb-4">Μπορείτε να επιλέξετε πολλαπλά κατοικίδια για το ίδιο ραντεβού.</p>
              {petsLoading ? (
                <div className="text-center py-8 text-slate-500">Φόρτωση κατοικιδίων...</div>
              ) : pets.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-500 mb-4">Δεν έχετε καταχωρημένα κατοικίδια.</p>
                  <Link href="/owner/pets" className="text-teal-600 font-medium hover:underline">
                    Προσθέστε κατοικίδιο
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {pets.map((pet) => (
                    <button
                      key={pet.id}
                      onClick={() => {
                        setSelectedPets(prev => {
                          const next = new Set(prev);
                          if (next.has(pet.id)) {
                            next.delete(pet.id);
                          } else {
                            next.add(pet.id);
                          }
                          return next;
                        });
                      }}
                      className={`p-4 rounded-xl border-2 transition-all text-center relative ${
                        selectedPets.has(pet.id)
                          ? 'border-teal-500 bg-teal-50'
                          : 'border-slate-100 hover:border-teal-200'
                      }`}
                    >
                      {selectedPets.has(pet.id) && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-teal-600 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
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
              <>
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
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <div className="flex items-center gap-1 text-amber-500">
                            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                            </svg>
                            <span className="font-bold text-slate-800 text-sm">{Number(vet.rating_average).toFixed(1)}</span>
                          </div>
                          <p className="text-xs text-slate-400">{vet.reviews_count} αξιολ.</p>
                          {vet.coordinates_lat && vet.coordinates_lng && (
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${vet.coordinates_lat},${vet.coordinates_lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              title="Οδηγίες Google Maps"
                              className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors text-xs font-medium"
                            >
                              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              Google Maps
                            </a>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Vet Detail Card */}
              {selectedVetData && (
                <div className="mt-4 bg-teal-50/50 border border-teal-200 rounded-2xl p-5">
                  {/* Vet Info Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-teal-100 flex items-center justify-center">
                      {selectedVetData.image_url ? (
                        <img src={getImageUrl(selectedVetData.image_url)} alt={selectedVetData.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl">👨‍⚕️</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-800 text-lg">{selectedVetData.name}</h4>
                      <p className="text-sm text-teal-600 font-medium">{selectedVetData.specialty}</p>
                      {selectedVetData.address && (
                        <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {selectedVetData.address}{selectedVetData.city ? `, ${selectedVetData.city}` : ''}
                        </p>
                      )}
                      <div className="flex items-center gap-1 mt-1">
                        <svg className="w-3.5 h-3.5 fill-current text-amber-500" viewBox="0 0 20 20">
                          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                        </svg>
                        <span className="font-bold text-slate-800 text-sm">{Number(selectedVetData.rating_average).toFixed(1)}</span>
                        <span className="text-xs text-slate-400">({selectedVetData.reviews_count} αξιολ.)</span>
                      </div>
                    </div>
                  </div>

                  {/* Services Section */}
                  <div className="border-t border-teal-200/60 pt-4">
                    <h5 className="font-bold text-slate-700 text-sm mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Υπηρεσίες & Τιμές
                    </h5>

                    {servicesLoading ? (
                      <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="animate-pulse flex justify-between items-center p-2">
                            <div className="flex-1">
                              <div className="h-4 bg-teal-100 rounded w-32 mb-1" />
                              <div className="h-3 bg-teal-100 rounded w-20" />
                            </div>
                            <div className="h-5 bg-teal-100 rounded w-16" />
                          </div>
                        ))}
                      </div>
                    ) : vetServices.length === 0 ? (
                      <p className="text-sm text-slate-400 italic">Ο κτηνίατρος δεν έχει καταχωρήσει υπηρεσίες ακόμα.</p>
                    ) : (
                      <div className="space-y-2">
                        {vetServices.map((service) => (
                          <button
                            key={service.id}
                            onClick={() => setSelectedService(service)}
                            className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 border-2 transition-all text-left ${
                              selectedService?.id === service.id
                                ? 'border-teal-500 bg-teal-50 shadow-sm'
                                : 'border-slate-100 bg-white hover:border-teal-200'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-slate-800 text-sm">{service.name}</p>
                              {service.description && (
                                <p className="text-xs text-slate-400 truncate">{service.description}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                              <span className="text-xs text-slate-400">{service.duration_minutes} λεπ.</span>
                              <span className="font-bold text-teal-700 text-sm">{Number(service.price).toFixed(2)} €</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Working Hours Section */}
                  {selectedVetData.hours && (
                    <div className="border-t border-teal-200/60 pt-4 mt-4">
                      <h5 className="font-bold text-slate-700 text-sm mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Ωράριο
                      </h5>
                      <div className="grid grid-cols-2 gap-1.5">
                        {Object.entries(dayLabels).map(([key, label]) => {
                          const day = selectedVetData.hours?.[key];
                          return (
                            <div key={key} className="flex items-center justify-between bg-white rounded-lg px-2.5 py-1.5 border border-slate-100">
                              <span className="text-xs font-medium text-slate-600">{label}</span>
                              <span className={`text-xs font-medium ${day?.closed ? 'text-red-400' : 'text-slate-800'}`}>
                                {day?.closed ? 'Κλειστά' : (() => {
                                  const parts: string[] = [];
                                  if (day?.morning?.open && day?.morning?.close) parts.push(`${day.morning.open} - ${day.morning.close}`);
                                  if (day?.afternoon?.open && day?.afternoon?.close) parts.push(`${day.afternoon.open} - ${day.afternoon.close}`);
                                  return parts.length > 0 ? parts.join(', ') : '—';
                                })()}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
              </>
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
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              {selectedPets.size > 1 ? 'Τα αιτήματα στάλθηκαν!' : 'Το αίτημα στάλθηκε!'}
            </h2>
            <p className="text-slate-500 mb-8">Θα ενημερωθείτε όταν επιβεβαιωθεί το ραντεβού.</p>

            <div className="bg-slate-50 rounded-xl p-4 text-left mb-8 space-y-3 text-sm">
              <div>
                <p className="text-slate-500 mb-1">Κατοικίδια</p>
                {Array.from(selectedPets).map((petId) => {
                  const pet = pets.find(p => p.id === petId);
                  return (
                    <p key={petId} className="font-bold text-slate-800">{pet?.name}</p>
                  );
                })}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-slate-500">Κτηνίατρος</p>
                  <p className="font-bold text-slate-800">{selectedVetData?.name}</p>
                </div>
                <div>
                  <p className="text-slate-500">Υπηρεσία</p>
                  <p className="font-bold text-slate-800">{selectedService?.name}</p>
                  <p className="text-xs text-slate-500">{selectedService?.duration_minutes} λεπτά — {Number(selectedService?.price ?? 0).toFixed(2)} €</p>
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
