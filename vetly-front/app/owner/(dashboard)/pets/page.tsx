'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  useMyPets,
  useMyAppointments,
  useDeletedPets,
  createPet,
  updatePet,
  deletePet,
  restorePet,
  uploadPetPhoto,
  uploadPetCover,
  Pet,
} from '@/hooks/useOwnerData';
import type { Appointment } from '@/hooks/useOwnerData';
import { getImageUrl, ApiError } from '@/lib/api';
import { ClinicButton, ClinicPanel, ClinicPageHeader, ClinicPagination, ClinicLoading } from '@/components/vet/ClinicUI';
import ClinicAvatar from '@/components/vet/ClinicAvatar';
import ClinicDrawer from '@/components/vet/ClinicDrawer';

function getLastVisit(petId: string, appointments: Appointment[]): string | null {
  const past = appointments
    .filter(a => a.pet_id === petId && a.status === 'completed')
    .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());
  if (past.length === 0) return null;
  return new Date(past[0].scheduled_at).toLocaleDateString('el-GR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function getNextAppointment(petId: string, appointments: Appointment[]): string | null {
  const now = new Date();
  const upcoming = appointments
    .filter(a => a.pet_id === petId && (a.status === 'confirmed' || a.status === 'pending') && new Date(a.scheduled_at) >= now)
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
  if (upcoming.length === 0) return null;
  return new Date(upcoming[0].scheduled_at).toLocaleDateString('el-GR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function PetTypeLabel({ type }: { type: string }) {
  const labels: Record<string, string> = {
    Dog: 'Σκύλος',
    Cat: 'Γάτα',
    Bird: 'Πτηνό',
    Rabbit: 'Κουνέλι',
    Hamster: 'Χάμστερ',
    Fish: 'Ψάρι',
    Reptile: 'Ερπετό',
    Other: 'Άλλο',
  };
  return <>{labels[type] || type}</>;
}

function GenderLabel({ gender }: { gender: string | null }) {
  if (!gender) return <>-</>;
  const labels: Record<string, string> = {
    Male: 'Αρσενικό',
    Female: 'Θηλυκό',
  };
  return <>{labels[gender] || gender}</>;
}

const CHIP_REGEX = /^\d{15}$/;
function isChipValid(value: string): boolean {
  return value === '' || CHIP_REGEX.test(value);
}

const EMPTY_FORM = {
  name: '',
  type: 'Dog',
  breed: '',
  age: '',
  weight: '',
  gender: 'Male',
  chip_number: '',
};

export default function PetsPage() {
  const [page, setPage] = useState(1);
  const { pets, total, totalPages, loading, error, refetch } = useMyPets(page, 6);
  const { appointments } = useMyAppointments(1, 100);
  const { pets: deletedPets, loading: deletedLoading, refetch: refetchDeleted } = useDeletedPets();
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSelectedPetId(params.get('selected'));
    if (params.get('action') === 'new') setShowCreate(true);
  }, []);

  const [createForm, setCreateForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [createTouched, setCreateTouched] = useState<Record<string, boolean>>({});

  // Edit modal
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [editForm, setEditForm] = useState({ name: '', breed: '', age: '', weight: '', chip_number: '' });
  const [editTouched, setEditTouched] = useState<Record<string, boolean>>({});

  // Delete confirmation dialog
  const [deleteDialog, setDeleteDialog] = useState<{
    petId: string;
    petName: string;
    confirmText: string;
    isDeleting: boolean;
  } | null>(null);

  // Pet photo upload
  const petPhotoRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [actionError, setActionError] = useState('');

  const handlePetPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedPet) return;
    setUploadingPhoto(true);
    setUploadError('');
    try {
      await uploadPetPhoto(selectedPet.id, file);
      refetch();
    } catch (err) {
      setUploadError(err instanceof ApiError ? err.message : 'Αποτυχία μεταφόρτωσης φωτογραφίας.');
    } finally {
      setUploadingPhoto(false);
      if (petPhotoRef.current) petPhotoRef.current.value = '';
    }
  };

  // Cover photo upload
  const coverPhotoRef = useRef<HTMLInputElement>(null);
  const [uploadingCover, setUploadingCover] = useState(false);

  const handleCoverPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedPet) return;
    setUploadingCover(true);
    setUploadError('');
    try {
      await uploadPetCover(selectedPet.id, file);
      refetch();
    } catch (err) {
      setUploadError(err instanceof ApiError ? err.message : 'Αποτυχία μεταφόρτωσης φωτογραφίας.');
    } finally {
      setUploadingCover(false);
      if (coverPhotoRef.current) coverPhotoRef.current.value = '';
    }
  };

  const selectedPet = useMemo(() => {
    if (pets.length === 0) return null;
    if (selectedPetId) return pets.find(p => p.id === selectedPetId) || pets[0];
    return pets[0];
  }, [pets, selectedPetId]);

  const handleCreate = async () => {
    if (submitting || !createForm.name || !createForm.breed || !createForm.age || !createForm.weight) return;
    setSubmitting(true);
    setFormError('');
    try {
      await createPet({
        name: createForm.name,
        type: createForm.type,
        breed: createForm.breed,
        age: parseInt(createForm.age),
        weight: parseFloat(createForm.weight),
        gender: createForm.gender,
        chip_number: createForm.chip_number || undefined,
      });
      setShowCreate(false);
      setCreateForm(EMPTY_FORM);
      refetch();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Παρουσιάστηκε σφάλμα. Δοκιμάστε ξανά.');
    } finally {
      setSubmitting(false);
    }
  };

  // Create form validation
  const createFieldErrors: Record<string, string> = {};
  if (createForm.name.length > 0 && createForm.name.trim().length < 2) createFieldErrors.name = 'Τουλάχιστον 2 χαρακτήρες.';
  if (createForm.breed.length > 0 && createForm.breed.trim().length < 2) createFieldErrors.breed = 'Τουλάχιστον 2 χαρακτήρες.';
  const createInputErr = (field: string) => createTouched[field] && createFieldErrors[field] ? 'border-red-300 bg-red-50/30' : 'border-ink-200';

  // Edit form validation
  const editFieldErrors: Record<string, string> = {};
  if (editForm.name.length > 0 && editForm.name.trim().length < 2) editFieldErrors.name = 'Τουλάχιστον 2 χαρακτήρες.';
  if (editForm.breed.length > 0 && editForm.breed.trim().length < 2) editFieldErrors.breed = 'Τουλάχιστον 2 χαρακτήρες.';
  const editInputErr = (field: string) => editTouched[field] && editFieldErrors[field] ? 'border-red-300 bg-red-50/30' : 'border-ink-200';

  const openEdit = (pet: Pet) => {
    setEditingPet(pet);
    setEditTouched({});
    setEditForm({
      name: (pet.name || '').slice(0, 30),
      breed: (pet.breed || '').slice(0, 100),
      age: pet.age != null ? String(pet.age) : '',
      weight: pet.weight != null ? String(pet.weight) : '',
      chip_number: pet.chip_number || '',
    });
  };

  const handleUpdate = async () => {
    if (!editingPet || submitting) return;
    setSubmitting(true);
    setFormError('');
    try {
      await updatePet(editingPet.id, {
        name: editForm.name || undefined,
        breed: editForm.breed || undefined,
        age: editForm.age ? parseInt(editForm.age) : undefined,
        weight: editForm.weight ? parseFloat(editForm.weight) : undefined,
        chip_number: editForm.chip_number || undefined,
      });
      setEditingPet(null);
      refetch();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Παρουσιάστηκε σφάλμα. Δοκιμάστε ξανά.');
      // error shown via formError state
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (petId: string, petName: string) => {
    setDeleteDialog({ petId, petName, confirmText: '', isDeleting: false });
  };

  const confirmDelete = async () => {
    if (!deleteDialog || deleteDialog.confirmText !== deleteDialog.petName) return;
    setDeleteDialog(prev => prev ? { ...prev, isDeleting: true } : null);
    try {
      await deletePet(deleteDialog.petId);
      if (selectedPetId === deleteDialog.petId) setSelectedPetId(null);
      setDeleteDialog(null);
      if (page > 1 && pets.length === 1) setPage(page - 1);
      else refetch();
      refetchDeleted();
    } catch {
      setActionError('Δεν έγινε η διαγραφή. Δοκίμασε ξανά.');
      setDeleteDialog(prev => prev ? { ...prev, isDeleting: false } : null);
    }
  };

  const handleRestore = async (petId: string) => {
    setActionError('');
    setRestoringId(petId);
    try {
      await restorePet(petId);
      refetch();
      refetchDeleted();
    } catch {
      setActionError('Δεν έγινε η επαναφορά. Δοκίμασε ξανά.');
      // error shown via formError state
    } finally {
      setRestoringId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-clinic-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700 font-medium">{error}</p>
          <ClinicButton className="mt-3" onClick={() => void refetch()}>Επανάληψη</ClinicButton>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1280px] space-y-5 text-ink-800">
      <ClinicPageHeader title="Τα κατοικίδιά μου" description="Τα στοιχεία, οι φωτογραφίες και η φροντίδα τους, σε ένα σημείο." actions={<div className="flex flex-wrap gap-2"><ClinicButton onClick={() => setShowDeleted(!showDeleted)} aria-pressed={showDeleted}>Διαγραμμένα ({deletedPets.length})</ClinicButton><ClinicButton variant="primary" onClick={() => { setCreateForm(EMPTY_FORM); setCreateTouched({}); setFormError(''); setShowCreate(true); }}>+ Προσθήκη κατοικιδίου</ClinicButton></div>} />
      {actionError && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{actionError}</div>}
      {showDeleted && <ClinicPanel className="p-5"><h2 className="text-sm font-semibold">Διαγραμμένα κατοικίδια</h2><p className="mt-1 text-xs leading-5 text-ink-500">Μπορείς να τα επαναφέρεις εντός 30 ημερών από τη διαγραφή.</p>{deletedLoading ? <ClinicLoading /> : deletedPets.length ? deletedPets.map(pet => <div key={pet.id} className="flex flex-wrap items-center justify-between gapx-3 py-2 border-b border-ink-100 py-4 last:border-0"><div className="flex min-w-0 items-center gap-3"><ClinicAvatar name={pet.name} imageUrl={pet.image_url} /><p className="break-words text-sm font-medium">{pet.name}</p></div><ClinicButton disabled={restoringId !== null} onClick={() => void handleRestore(pet.id)}>{restoringId === pet.id ? 'Επαναφορά…' : 'Επαναφορά'}</ClinicButton></div>) : <p className="mt-4 text-sm text-ink-500">Δεν υπάρχουν διαγραμμένα κατοικίδια.</p>}</ClinicPanel>}
      {pets.length === 0 ? <ClinicPanel className="p-8 text-center"><h2 className="text-base font-semibold">Δεν υπάρχουν κατοικίδια σε αυτή τη σελίδα.</h2><p className="mt-2 text-sm text-ink-500">Πρόσθεσε το κατοικίδιό σου για να οργανώσεις τη φροντίδα του.</p>{page > 1 && <ClinicButton className="mt-4" onClick={() => setPage(1)}>Πρώτη σελίδα</ClinicButton>}</ClinicPanel> : <div className="grid items-start gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
        <div className="min-w-0"><ClinicPanel className="overflow-hidden"><div className="border-b border-ink-200 px-4 py-3"><h2 className="text-sm font-semibold">Τα κατοικίδιά σου <span className="ml-1 text-ink-400">{total}</span></h2><p className="mt-1 text-xs text-ink-500">Επίλεξε για να δεις τον φάκελό του.</p></div>{pets.map(pet => <button key={pet.id} aria-label={`Επιλογή κατοικιδίου: ${pet.name}`} aria-pressed={selectedPet?.id === pet.id} disabled={uploadingPhoto || uploadingCover} onClick={() => { setSelectedPetId(pet.id); setUploadError(''); }} className={`flex w-full min-w-0 items-center gapx-3 py-2 border-b border-ink-100 p-4 text-left last:border-0 focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-clinic-600 ${selectedPet?.id === pet.id ? 'bg-clinic-50' : 'bg-white hover:bg-ink-50'}`}><ClinicAvatar name={pet.name} imageUrl={pet.image_url} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{pet.name}</p><p className="mt-1 truncate text-xs text-ink-500"><PetTypeLabel type={pet.type} /> · {pet.breed || 'Χωρίς καταχώριση ράτσας'}</p></div><span aria-hidden="true" className="text-clinic-700">→</span></button>)}</ClinicPanel><ClinicPagination page={page} totalPages={totalPages} onPageChange={setPage} /></div>
        {selectedPet && <div className="min-w-0 space-y-5" aria-label={`Φάκελος: ${selectedPet.name}`}>
          <ClinicPanel className="overflow-hidden">
            {selectedPet.cover_image_url && <img src={getImageUrl(selectedPet.cover_image_url)} alt={`Εξώφυλλο ${selectedPet.name}`} className="h-36 w-full object-cover sm:h-44" />}
            <div className="p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div className="flex min-w-0 items-center gap-3"><ClinicAvatar large name={selectedPet.name} imageUrl={selectedPet.image_url} /><div className="min-w-0"><h2 className="break-words text-xl font-semibold">{selectedPet.name}</h2><p className="mt-1 break-words text-xs text-ink-500"><PetTypeLabel type={selectedPet.type} /> · {selectedPet.breed || 'Δεν έχει οριστεί ράτσα'}</p></div></div><ClinicButton onClick={() => { setFormError(''); openEdit(selectedPet); }}>Επεξεργασία στοιχείων</ClinicButton></div>
              <div className="mt-4 flex flex-wrap gap-2"><ClinicButton disabled={uploadingPhoto || uploadingCover} onClick={() => petPhotoRef.current?.click()}>{uploadingPhoto ? 'Μεταφόρτωση…' : 'Αλλαγή φωτογραφίας'}</ClinicButton><ClinicButton disabled={uploadingCover || uploadingPhoto} onClick={() => coverPhotoRef.current?.click()}>{uploadingCover ? 'Μεταφόρτωση…' : selectedPet.cover_image_url ? 'Αλλαγή εξωφύλλου' : 'Προσθήκη εξωφύλλου'}</ClinicButton></div>
              <input ref={petPhotoRef} aria-label="Αρχείο φωτογραφίας κατοικιδίου" type="file" accept="image/jpeg,image/png" className="hidden" onChange={handlePetPhoto} /><input ref={coverPhotoRef} aria-label="Αρχείο εξωφύλλου" type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleCoverPhoto} />
              {uploadError && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{uploadError}</p>}
            </div>
            <div className="border-t border-ink-100 p-5"><h3 className="mb-4 text-sm font-semibold">Στοιχεία ταυτότητας</h3><dl className="grid grid-cols-2 gap-x-6 gap-y-5"><div><dt className="text-xs text-ink-500">Ηλικία</dt><dd className="mt-1 text-sm font-medium">{selectedPet.age != null ? `${selectedPet.age} ετών` : 'Δεν έχει οριστεί'}</dd></div><div><dt className="text-xs text-ink-500">Βάρος</dt><dd className="mt-1 text-sm font-medium">{selectedPet.weight != null ? `${selectedPet.weight} kg` : 'Δεν έχει οριστεί'}</dd></div><div><dt className="text-xs text-ink-500">Φύλο</dt><dd className="mt-1 text-sm font-medium"><GenderLabel gender={selectedPet.gender} /></dd></div><div className="min-w-0"><dt className="text-xs text-ink-500">Microchip</dt><dd className="mt-1 break-all text-sm font-medium tabular-nums">{selectedPet.chip_number || 'Δεν έχει οριστεί'}</dd></div></dl></div>
          </ClinicPanel>
          <ClinicPanel className="p-5"><h3 className="text-sm font-semibold">Φροντίδα και επισκέψεις</h3><p className="mt-1 text-xs leading-5 text-ink-500">Δες τις καταχωρίσεις του κτηνιάτρου και οργάνωσε την επόμενη επίσκεψη.</p><div className="mt-4 flex flex-wrap gap-2">{[['/owner/book','Κλείσε ραντεβού'],['/owner/medical','Ιατρικό ιστορικό'],['/owner/medications','Αγωγές']].map(([href,label]) => <Link key={href} href={href} className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-xs font-medium hover:bg-clinic-50">{label}</Link>)}</div><div className="mt-5 grid gap-4 border-t border-ink-100 pt-4 sm:grid-cols-2"><div><p className="text-xs text-ink-500">Τελευταία ολοκληρωμένη επίσκεψη</p><p className="mt-1 text-sm">{getLastVisit(selectedPet.id,appointments) || 'Δεν εμφανίζεται πρόσφατη επίσκεψη.'}</p></div><div><p className="text-xs text-ink-500">Επόμενο ραντεβού / αίτημα</p><p className="mt-1 text-sm">{getNextAppointment(selectedPet.id,appointments) || 'Δεν εμφανίζεται επερχόμενο ραντεβού.'}</p></div></div><p className="mt-3 text-xs text-ink-400">Από τα πρόσφατα ραντεβού του λογαριασμού. <Link href="/owner/appointments" className="text-clinic-700 underline">Προβολή όλων</Link></p></ClinicPanel>
          <div className="flex flex-wrap items-center justify-between gap-3 px-1"><p className="text-xs text-ink-500">Διαχείριση προφίλ κατοικιδίου</p><ClinicButton variant="danger" onClick={() => { setActionError(''); handleDelete(selectedPet.id,selectedPet.name); }}>Διαγραφή κατοικιδίου</ClinicButton></div>
        </div>}
      </div>}

      {/* Create Pet Modal */}
      {showCreate && (
        <ClinicDrawer label="Νέο κατοικίδιο" busy={submitting} onClose={() => { setShowCreate(false); setFormError(''); }}>
          <form className="bg-white p-5 w-full" onSubmit={e => { e.preventDefault(); void handleCreate(); }}><fieldset disabled={submitting} className="min-w-0">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-medium text-ink-900">Νέο Κατοικίδιο</h2>
              <button type="button"
                disabled={submitting} onClick={() => { setShowCreate(false); setFormError(''); }}
                aria-label="Κλείσιμο φόρμας" className="p-2 text-ink-400 hover:text-ink-600 rounded-xl hover:bg-ink-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">Όνομα</label>
                <input
                  type="text"
                  maxLength={30}
                  aria-label="Όνομα" required value={createForm.name}
                  onChange={e => { setCreateForm(prev => ({ ...prev, name: e.target.value })); setCreateTouched(t => ({ ...t, name: true })); }}
                  onBlur={() => setCreateTouched(t => ({ ...t, name: true }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-clinic-500 ${createInputErr('name')}`}
                />
                {createTouched.name && createFieldErrors.name && <p className="text-xs text-red-600 mt-1">{createFieldErrors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-2">Τύπος</label>
                  <select
                    aria-label="Τύπος" value={createForm.type}
                    onChange={e => setCreateForm(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-clinic-500 bg-white"
                  >
                    <option value="Dog">🐕 Σκύλος</option>
                    <option value="Cat">🐈 Γάτα</option>
                    <option value="Bird">🐦 Πτηνό</option>
                    <option value="Rabbit">🐰 Κουνέλι</option>
                    <option value="Hamster">🐹 Χάμστερ</option>
                    <option value="Fish">🐟 Ψάρι</option>
                    <option value="Reptile">🦎 Ερπετό</option>
                    <option value="Other">📦 Άλλο</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-2">Φύλο</label>
                  <select
                    aria-label="Φύλο" value={createForm.gender}
                    onChange={e => setCreateForm(prev => ({ ...prev, gender: e.target.value }))}
                    className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-clinic-500 bg-white"
                  >
                    <option value="Male">Αρσενικό</option>
                    <option value="Female">Θηλυκό</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">Ράτσα</label>
                <input
                  type="text"
                  maxLength={100}
                  aria-label="Ράτσα" required value={createForm.breed}
                  onChange={e => { setCreateForm(prev => ({ ...prev, breed: e.target.value })); setCreateTouched(t => ({ ...t, breed: true })); }}
                  onBlur={() => setCreateTouched(t => ({ ...t, breed: true }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-clinic-500 ${createInputErr('breed')}`}
                />
                {createTouched.breed && createFieldErrors.breed && <p className="text-xs text-red-600 mt-1">{createFieldErrors.breed}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-2">Ηλικία (έτη)</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    aria-label="Ηλικία (έτη)" required value={createForm.age}
                    onChange={e => setCreateForm(prev => ({ ...prev, age: e.target.value }))}
                    className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-clinic-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-2">Βάρος (kg)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    aria-label="Βάρος (kg)" required value={createForm.weight}
                    onChange={e => setCreateForm(prev => ({ ...prev, weight: e.target.value }))}
                    className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-clinic-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">Microchip <span className="font-normal text-ink-400">(προαιρετικό, 15 ψηφία)</span></label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={15}
                  aria-label="Microchip" value={createForm.chip_number}
                  onChange={e => setCreateForm(prev => ({ ...prev, chip_number: e.target.value }))}
                  placeholder="15 ψηφία"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-clinic-500 ${
                    createForm.chip_number && !isChipValid(createForm.chip_number)
                      ? 'border-red-400 bg-red-50'
                      : 'border-ink-200'
                  }`}
                />
                {createForm.chip_number && !isChipValid(createForm.chip_number) && (
                  <p className="text-red-500 text-xs mt-1">Ο αριθμός microchip πρέπει να αποτελείται από ακριβώς 15 ψηφία.</p>
                )}
              </div>
            </div>

            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center justify-between mt-4">
                <span>{formError}</span>
                <button onClick={() => setFormError('')} className="text-red-400 hover:text-red-600 ml-3">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button type="button"
                disabled={submitting} onClick={() => { setShowCreate(false); setFormError(''); }}
                className="flex-1 py-3 border border-ink-200 text-ink-600 rounded-xl font-medium hover:bg-ink-50 transition-colors"
              >
                Ακύρωση
              </button>
              <button type="submit"
                disabled={submitting || !createForm.name || !createForm.breed || !createForm.age || !createForm.weight || !isChipValid(createForm.chip_number) || Object.keys(createFieldErrors).length > 0}
                className="flex-1 py-3 bg-clinic-600 text-white rounded-xl font-medium hover:bg-clinic-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Αποθήκευση...' : 'Προσθήκη'}
              </button>
            </div>
          </fieldset></form>
        </ClinicDrawer>
      )}

      {/* Edit Pet Modal */}
      {editingPet && (
        <ClinicDrawer label="Επεξεργασία κατοικιδίου" busy={submitting} onClose={() => { setEditingPet(null); setFormError(''); }}>
          <form className="bg-white p-5 w-full" onSubmit={e => { e.preventDefault(); void handleUpdate(); }}><fieldset disabled={submitting} className="min-w-0">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-medium text-ink-900">Επεξεργασία: {editingPet.name}</h2>
              <button type="button"
                disabled={submitting} onClick={() => { setEditingPet(null); setFormError(''); }}
                aria-label="Κλείσιμο φόρμας" className="p-2 text-ink-400 hover:text-ink-600 rounded-xl hover:bg-ink-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">Όνομα</label>
                <input
                  type="text"
                  maxLength={30}
                  aria-label="Όνομα" value={editForm.name}
                  onChange={e => { setEditForm(prev => ({ ...prev, name: e.target.value })); setEditTouched(t => ({ ...t, name: true })); }}
                  onBlur={() => setEditTouched(t => ({ ...t, name: true }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-clinic-500 ${editInputErr('name')}`}
                />
                {editTouched.name && editFieldErrors.name && <p className="text-xs text-red-600 mt-1">{editFieldErrors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">Ράτσα</label>
                <input
                  type="text"
                  maxLength={100}
                  aria-label="Ράτσα" value={editForm.breed}
                  onChange={e => { setEditForm(prev => ({ ...prev, breed: e.target.value })); setEditTouched(t => ({ ...t, breed: true })); }}
                  onBlur={() => setEditTouched(t => ({ ...t, breed: true }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-clinic-500 ${editInputErr('breed')}`}
                />
                {editTouched.breed && editFieldErrors.breed && <p className="text-xs text-red-600 mt-1">{editFieldErrors.breed}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-2">Ηλικία (έτη)</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    aria-label="Ηλικία (έτη)" value={editForm.age}
                    onChange={e => setEditForm(prev => ({ ...prev, age: e.target.value }))}
                    className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-clinic-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-2">Βάρος (kg)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    aria-label="Βάρος (kg)" value={editForm.weight}
                    onChange={e => setEditForm(prev => ({ ...prev, weight: e.target.value }))}
                    className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-clinic-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">Microchip <span className="font-normal text-ink-400">(15 ψηφία)</span></label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={15}
                  aria-label="Microchip" value={editForm.chip_number}
                  onChange={e => setEditForm(prev => ({ ...prev, chip_number: e.target.value }))}
                  placeholder="15 ψηφία"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-clinic-500 ${
                    editForm.chip_number && !isChipValid(editForm.chip_number)
                      ? 'border-red-400 bg-red-50'
                      : 'border-ink-200'
                  }`}
                />
                {editForm.chip_number && !isChipValid(editForm.chip_number) && (
                  <p className="text-red-500 text-xs mt-1">Ο αριθμός microchip πρέπει να αποτελείται από ακριβώς 15 ψηφία.</p>
                )}
              </div>
            </div>

            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center justify-between mt-4">
                <span>{formError}</span>
                <button onClick={() => setFormError('')} className="text-red-400 hover:text-red-600 ml-3">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button type="button"
                disabled={submitting} onClick={() => { setEditingPet(null); setFormError(''); }}
                className="flex-1 py-3 border border-ink-200 text-ink-600 rounded-xl font-medium hover:bg-ink-50 transition-colors"
              >
                Ακύρωση
              </button>
              <button type="submit"
                disabled={submitting || !isChipValid(editForm.chip_number) || Object.keys(editFieldErrors).length > 0}
                className="flex-1 py-3 bg-clinic-600 text-white rounded-xl font-medium hover:bg-clinic-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Αποθήκευση...' : 'Αποθήκευση'}
              </button>
            </div>
          </fieldset></form>
        </ClinicDrawer>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteDialog && (
        <ClinicDrawer label="Διαγραφή κατοικιδίου" busy={deleteDialog.isDeleting} onClose={() => setDeleteDialog(null)}>
          <div className="bg-white p-5 w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-medium text-ink-900">Διαγραφή Κατοικιδίου</h2>
              <button type="button"
                disabled={deleteDialog.isDeleting} onClick={() => setDeleteDialog(null)}
                aria-label="Κλείσιμο φόρμας" className="p-2 text-ink-400 hover:text-ink-600 rounded-xl hover:bg-ink-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {actionError && <p role="alert" className="mb-3 text-sm text-red-700">{actionError}</p>}
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5">
              <p className="text-red-700 text-sm font-medium">
                Μπορείτε να επαναφέρετε το κατοικίδιο εντός 30 ημερών. Τα δεδομένα του
                (ιατρικό ιστορικό, ραντεβού, φάρμακα) θα διαγραφούν οριστικά μετά από 30 ημέρες.
              </p>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-ink-700 mb-2">
                Πληκτρολογήστε <span className="text-red-600">{deleteDialog.petName}</span> για επιβεβαίωση
              </label>
              <input
                type="text"
                value={deleteDialog.confirmText}
                onChange={e => setDeleteDialog(prev => prev ? { ...prev, confirmText: e.target.value } : null)}
                className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
                placeholder={deleteDialog.petName}
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button type="button"
                disabled={deleteDialog.isDeleting} onClick={() => setDeleteDialog(null)}
                className="flex-1 py-3 border border-ink-200 text-ink-600 rounded-xl font-medium hover:bg-ink-50 transition-colors"
              >
                Ακύρωση
              </button>
              <button type="button"
                onClick={confirmDelete}
                disabled={deleteDialog.confirmText !== deleteDialog.petName || deleteDialog.isDeleting}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteDialog.isDeleting ? 'Διαγραφή...' : 'Διαγραφή'}
              </button>
            </div>
          </div>
        </ClinicDrawer>
      )}
    </div>
  );
}
