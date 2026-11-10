'use client';

import { Suspense, useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMyPets, useVets, useAvailableSlots, useVetServices, createAppointment, createBatchAppointments, PublicVetService } from '@/hooks/useOwnerData';
import { ApiError } from '@/lib/api';
import CalendarPicker from '@/components/CalendarPicker';
import { ClinicPanel, ClinicPageHeader, ClinicButton, ClinicInput, ClinicTextarea, ClinicLoading, ClinicPagination } from '@/components/vet/ClinicUI';
import ClinicAvatar from '@/components/vet/ClinicAvatar';
import { VetSearchMap } from '@/components/MapView';

const dayLabels: Record<string, string> = {
  monday: 'Δευτέρα', tuesday: 'Τρίτη', wednesday: 'Τετάρτη',
  thursday: 'Πέμπτη', friday: 'Παρασκευή', saturday: 'Σάββατο', sunday: 'Κυριακή',
};

type Step = 1 | 2 | 3 | 4;

export default function BookPage() {
  return (
    <Suspense fallback={<ClinicLoading />}>
      <BookFlow />
    </Suspense>
  );
}

function BookFlow() {
  // `?vet=` carries the vet's id (UUID) from the public profile link.
  const vetParam = useSearchParams().get('vet');
  const presetApplied = useRef(false);
  const [changeVet, setChangeVet] = useState(false);
  const [petPage, setPetPage] = useState(1);
  const [petNames, setPetNames] = useState<Record<string,string>>({});
  const { pets, totalPages: petTotalPages, loading: petsLoading, error: petsError, refetch: refetchPets } = useMyPets(petPage,6);
  const { vets, loading: vetsLoading, error: vetsError, refetch: refetchVets } = useVets();

  const [serviceRetry, setServiceRetry] = useState(0);
  const [step, setStep] = useState<Step>(1);
  const [selectedPets, setSelectedPets] = useState<Set<string>>(new Set());
  const [selectedVet, setSelectedVet] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<PublicVetService | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { slots: availableSlots, loading: slotsLoading, error: slotsError, refetch: refetchSlots } = useAvailableSlots(selectedVet, selectedDate, selectedService?.duration_minutes ?? 30);
  const { services: vetServices, loading: servicesLoading, error: servicesError } = useVetServices(selectedVet, serviceRetry);

  // Clear selected time when vet or date changes
  useEffect(() => {
    setSelectedTime(null);
  }, [selectedVet, selectedDate, selectedService]);

  // Clear selected service when vet changes
  useEffect(() => {
    setSelectedService(null);
  }, [selectedVet]);

  // Preselect the vet named in the link once the vet list has loaded
  const presetVet = vetParam ? vets.find(v => v.id === vetParam) : undefined;
  const presetMissing = Boolean(vetParam) && !vetsLoading && !vetsError && !presetVet;
  useEffect(() => {
    if (presetVet && !presetApplied.current) {
      presetApplied.current = true;
      setSelectedVet(presetVet.id);
    }
  }, [presetVet]);
  const showVetList = !presetVet || changeVet;

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
      case 3: return Boolean(selectedDate && selectedTime && !slotsLoading && !slotsError && availableSlots.includes(selectedTime));
      case 4: return true;
      default: return false;
    }
  };

  const handleConfirm = async () => {
    if (submitting || slotsLoading || !selectedTime || !availableSlots.includes(selectedTime) || selectedPets.size === 0 || !selectedVet || !selectedDate || !selectedTime || !selectedService) return;

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

  const [search, setSearch] = useState('');
  const visibleVets = vets.filter(v => `${v.name} ${v.city || ''} ${v.specialty}`.toLocaleLowerCase('el-GR').includes(search.toLocaleLowerCase('el-GR')));
  const titles = ['Κατοικίδια', 'Κτηνίατρος & υπηρεσία', 'Ημερομηνία & ώρα', 'Το αίτημά σου'];
  return <div className="mx-auto max-w-[1280px] space-y-5 text-ink-800">
    <ClinicPageHeader title="Κράτηση ραντεβού" description="Διάλεξε ποιον θα επισκεφθείς και πότε. Ο κτηνίατρος θα επιβεβαιώσει το αίτημά σου." />
    {presetMissing && <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Ο κτηνίατρος του συνδέσμου δεν βρέθηκε ή δεν δέχεται κρατήσεις αυτή τη στιγμή. Μπορείς να επιλέξεις κάποιον άλλον στο βήμα 2.</p>}
    <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Βήματα κράτησης">{titles.map((title,i) => <li key={title} aria-current={step === i+1 ? 'step' : undefined} className={`flex min-w-0 items-center gap-2 rounded-lg border px-3 py-3 text-xs ${step === i+1 ? 'border-clinic-200 bg-clinic-50 text-clinic-800' : 'border-ink-200 bg-white text-ink-500'}`}><span className={`grid h-6 w-6 shrink-0 place-items-center rounded-md ${step >= i+1 ? 'bg-clinic-600 text-white' : 'bg-ink-100'}`}>{i+1}</span>{title}</li>)}</ol>
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <ClinicPanel className="min-w-0 overflow-hidden"><div className="border-b border-ink-200 px-5 py-4"><h2 className="text-sm font-semibold">{titles[step-1]}</h2><p className="mt-1 text-xs leading-5 text-ink-500">{step === 1 ? 'Επίλεξε ένα ή περισσότερα κατοικίδια για κοινή επίσκεψη.' : step === 2 ? 'Βρες κτηνίατρο και επίλεξε υπηρεσία, διάρκεια και κόστος.' : step === 3 ? 'Εμφανίζονται οι διαθέσιμες ώρες για την υπηρεσία σου.' : 'Το αίτημα στάλθηκε και περιμένει την έγκριση του κτηνιάτρου.'}</p></div>
      <fieldset disabled={submitting} className="min-w-0 p-4 sm:p-5">
        {step === 1 && <>{petsLoading ? <ClinicLoading /> : petsError ? <div role="alert"><p>Δεν φορτώθηκαν τα κατοικίδια.</p><ClinicButton onClick={() => void refetchPets()}>Επανάληψη</ClinicButton></div> : pets.length === 0 ? <div className="py-6 text-sm"><p>Πρόσθεσε πρώτα το κατοικίδιό σου.</p><Link className="mt-3 inline-block text-clinic-700 underline" href="/owner/pets?action=new">Προσθήκη κατοικιδίου</Link></div> : <div className="space-y-2">{pets.map(pet => <button key={pet.id} aria-pressed={selectedPets.has(pet.id)} onClick={() => { setPetNames(old => ({...old,[pet.id]:pet.name})); setSelectedPets(old => { const next = new Set(old); if(next.has(pet.id))next.delete(pet.id);else next.add(pet.id);return next; }); }} className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left ${selectedPets.has(pet.id) ? 'border-clinic-200 bg-clinic-50' : 'border-ink-200 hover:bg-ink-50'}`}><ClinicAvatar name={pet.name} imageUrl={pet.image_url} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{pet.name}</p><p className="truncate text-xs text-ink-500">{pet.breed || pet.type}</p></div><span className="text-clinic-700" aria-hidden="true">{selectedPets.has(pet.id) ? '✓' : '+'}</span></button>)}</div>}<ClinicPagination page={petPage} totalPages={petTotalPages} onPageChange={setPetPage} /></>}
        {step === 2 && <div className="space-y-4">{!showVetList && presetVet && <div className="flex items-start gap-3 rounded-lg border border-clinic-200 bg-clinic-50 p-3"><ClinicAvatar name={presetVet.name} imageUrl={presetVet.image_url} /><div className="min-w-0 flex-1"><p className="break-words text-sm font-semibold">{presetVet.name}</p><p className="mt-1 break-words text-xs text-ink-500">{presetVet.specialty} · {presetVet.city || 'Χωρίς πόλη'}</p></div><ClinicButton onClick={() => setChangeVet(true)}>Άλλος κτηνίατρος</ClinicButton></div>}{!showVetList && vetsLoading && <ClinicLoading />}{showVetList && <><ClinicInput type="search" aria-label="Αναζήτηση κτηνιάτρου" placeholder="Όνομα, πόλη ή ειδικότητα" value={search} onChange={e => setSearch(e.target.value)} className="w-full" />{vetsLoading ? <ClinicLoading /> : vetsError ? <div role="alert"><p>Δεν φορτώθηκαν οι κτηνίατροι.</p><ClinicButton onClick={() => void refetchVets()}>Επανάληψη</ClinicButton></div> : <>
          <div className="max-h-[360px] space-y-2 overflow-y-auto">{visibleVets.map(v => <button key={v.id} aria-pressed={selectedVet === v.id} onClick={() => { setSelectedVet(v.id); setSelectedService(null); setSelectedTime(null); }} className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left ${selectedVet === v.id ? 'border-clinic-200 bg-clinic-50' : 'border-ink-200 hover:bg-ink-50'}`}><ClinicAvatar name={v.name} imageUrl={v.image_url} /><div className="min-w-0 flex-1"><p className="break-words text-sm font-semibold">{v.name}</p><p className="mt-1 break-words text-xs text-ink-500">{v.specialty} · {v.city || 'Χωρίς πόλη'}</p><p className="mt-1 break-words text-xs text-ink-500">{v.address}</p><p className="mt-2 text-xs text-ink-600">{Number(v.rating_average).toFixed(1)} / 5 · {v.reviews_count} αξιολογήσεις</p></div>{selectedVet === v.id && <span aria-hidden="true" className="text-clinic-700">✓</span>}</button>)}{!visibleVets.length && <p className="py-5 text-sm text-ink-500">Δεν βρέθηκαν κτηνίατροι με αυτή την αναζήτηση.</p>}</div>
          <details className="rounded-lg border border-ink-200"><summary className="cursor-pointer p-3 text-xs font-medium">Προβολή στον χάρτη</summary><div className="h-[280px] overflow-hidden"><VetSearchMap vets={visibleVets.filter(v => v.coordinates_lat != null && v.coordinates_lng != null).map(v => ({...v,lat:v.coordinates_lat!,lng:v.coordinates_lng!}))} selectedVetId={selectedVet} onSelectVet={id => { setSelectedVet(id); setSelectedService(null); setSelectedTime(null); }} /></div></details>
        </>}</>}{selectedVetData && <section className="border-t border-ink-200 pt-4"><h3 className="text-sm font-semibold">Υπηρεσίες · {selectedVetData.name}</h3><div className="mt-3 space-y-2">{servicesLoading ? <ClinicLoading /> : servicesError ? <p role="alert" className="text-sm text-red-700">Δεν φορτώθηκαν οι υπηρεσίες. <ClinicButton onClick={() => setServiceRetry(n => n+1)}>Επανάληψη</ClinicButton></p> : vetServices.length ? vetServices.map(service => <button key={service.id} aria-pressed={selectedService?.id === service.id} onClick={() => {setSelectedService(service);setSelectedTime(null);}} className={`flex w-full flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-left ${selectedService?.id === service.id ? 'border-clinic-200 bg-clinic-50' : 'border-ink-200 hover:bg-ink-50'}`}><div className="min-w-0"><p className="break-words text-sm font-medium">{service.name}</p>{service.description && <p className="mt-1 break-words text-xs text-ink-500">{service.description}</p>}</div><span className="text-xs font-medium text-clinic-800">{service.duration_minutes} λεπτά · {Number(service.price).toFixed(2)} €</span></button>) : <p className="text-sm text-ink-500">Δεν υπάρχουν διαθέσιμες υπηρεσίες για κράτηση.</p>}</div>{selectedVetData.hours && <details className="mt-4"><summary className="cursor-pointer text-xs text-ink-600">Ωράριο κτηνιατρείου</summary><dl className="mt-3 space-y-2">{Object.entries(dayLabels).map(([key,label]) => { const d=selectedVetData.hours?.[key];return <div key={key} className="flex flex-wrap justify-between gap-2 text-xs"><dt>{label}</dt><dd>{d?.closed ? 'Κλειστά' : [d?.morning,d?.afternoon].filter(Boolean).map(h=>`${h!.open}–${h!.close}`).join(', ') || 'Δεν έχει οριστεί'}</dd></div>;})}</dl></details>}</section>}</div>}
        {step === 3 && <div className="space-y-5"><div className="grid gap-5 md:grid-cols-2"><div className="min-w-0"><h3 className="mb-3 text-sm font-semibold">Ημερομηνία</h3><CalendarPicker value={selectedDate || ''} onChange={date => {setSelectedDate(date);setSelectedTime(null);}} minDate={new Date()} maxDate={maxDate} accentColor="indigo" /></div><div><h3 className="mb-3 text-sm font-semibold">Διαθέσιμες ώρες</h3>{!selectedDate ? <p className="text-sm text-ink-500">Επίλεξε πρώτα ημερομηνία.</p> : slotsLoading ? <ClinicLoading /> : slotsError ? <div role="alert"><p className="text-sm text-red-700">Δεν φορτώθηκαν οι ώρες.</p><ClinicButton onClick={() => void refetchSlots()}>Επανάληψη</ClinicButton></div> : availableSlots.length ? <div className="grid grid-cols-3 gap-2">{availableSlots.map(time => <ClinicButton key={time} aria-pressed={selectedTime === time} variant={selectedTime === time ? 'primary' : 'secondary'} disabled={submitting} onClick={() => setSelectedTime(time)}>{time}</ClinicButton>)}</div> : <p className="text-sm text-ink-500">Δεν υπάρχουν διαθέσιμες ώρες. Δοκίμασε άλλη ημέρα.</p>}</div></div><label className="block text-xs text-ink-600">Σημειώσεις προς τον κτηνίατρο (προαιρετικά)<ClinicTextarea className="mt-2 w-full" value={notes} maxLength={2000} disabled={submitting} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Τι θα ήθελες να γνωρίζει πριν την επίσκεψη;" /></label>{submitError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{submitError}</p>}</div>}
        {step === 4 && <div className="py-7"><span className="mb-4 inline-block rounded-lg bg-clinic-100 px-3 py-2 text-clinic-800">✓ Το αίτημα στάλθηκε</span><h3 className="text-xl font-semibold">Αναμένεις επιβεβαίωση από τον κτηνίατρο.</h3><p className="mt-3 text-sm leading-6 text-ink-500">Θα ενημερωθείς όταν απαντήσει. Μπορείς να παρακολουθείς την κατάσταση στα ραντεβού σου.</p><Link href="/owner/appointments" className="mt-5 inline-block rounded-lg bg-clinic-600 px-4 py-3 text-xs font-medium text-white">Τα ραντεβού μου →</Link></div>}
      </fieldset>{step < 4 && <div className="flex flex-wrap justify-between gap-3 border-t border-ink-200 p-4"><ClinicButton disabled={step === 1 || submitting} onClick={() => setStep(s => Math.max(1,s-1) as Step)}>Πίσω</ClinicButton><ClinicButton variant="primary" disabled={!canProceed() || submitting} onClick={handleNext}>{submitting ? 'Αποστολή…' : step === 3 ? 'Αποστολή αιτήματος' : 'Συνέχεια'}</ClinicButton></div>}</ClinicPanel>
      <ClinicPanel className="min-w-0 p-5 xl:sticky xl:top-24"><h2 className="text-sm font-semibold">Η επίσκεψή σου</h2><dl className="mt-4 space-y-4 text-sm"><div><dt className="text-xs text-ink-500">Κατοικίδια</dt><dd className="mt-1 break-words">{[...selectedPets].map(id => petNames[id]).join(', ') || 'Δεν έχουν επιλεγεί'}</dd></div><div><dt className="text-xs text-ink-500">Κτηνίατρος</dt><dd className="mt-1 break-words">{selectedVetData?.name || 'Δεν έχει επιλεγεί'}</dd></div><div><dt className="text-xs text-ink-500">Υπηρεσία</dt><dd className="mt-1 break-words">{selectedService ? `${selectedService.name} · ${selectedService.duration_minutes} λεπτά` : 'Δεν έχει επιλεγεί'}</dd></div><div><dt className="text-xs text-ink-500">Ημερομηνία και ώρα</dt><dd className="mt-1">{selectedDate ? new Date(`${selectedDate}T12:00:00`).toLocaleDateString('el-GR') : 'Δεν έχει επιλεγεί'}{selectedTime ? ` · ${selectedTime}` : ''}</dd></div></dl>{selectedService && <div className="mt-4 border-t border-ink-200 pt-4"><p className="text-xs text-ink-500">Τιμή υπηρεσίας ανά κατοικίδιο</p><p className="mt-1 text-lg font-semibold text-clinic-800">{Number(selectedService.price).toFixed(2)} €</p>{selectedPets.size > 1 && <p className="mt-1 text-xs text-ink-500">{selectedPets.size} κατοικίδια · Σύνολο {(Number(selectedService.price)*selectedPets.size).toFixed(2)} €</p>}</div>}<p className="mt-4 text-xs leading-5 text-ink-500">Η κράτηση ολοκληρώνεται όταν ο κτηνίατρος εγκρίνει το αίτημα.</p></ClinicPanel>
    </div>
  </div>;
}
