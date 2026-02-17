'use client';

import { useState, useMemo, useRef } from 'react';
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

function getLastVisit(petId: string, appointments: Appointment[]): string | null {
  const past = appointments
    .filter(a => a.pet_id === petId && (a.status === 'completed' || a.status === 'cancelled'))
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
  const { pets, loading, error, refetch } = useMyPets();
  const { appointments } = useMyAppointments();
  const { pets: deletedPets, loading: deletedLoading, refetch: refetchDeleted } = useDeletedPets();
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Edit modal
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [editForm, setEditForm] = useState({ name: '', breed: '', age: '', weight: '', chip_number: '' });

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
    if (!createForm.name || !createForm.breed || !createForm.age || !createForm.weight) return;
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

  const openEdit = (pet: Pet) => {
    setEditingPet(pet);
    setEditForm({
      name: pet.name,
      breed: pet.breed || '',
      age: pet.age != null ? String(pet.age) : '',
      weight: pet.weight != null ? String(pet.weight) : '',
      chip_number: pet.chip_number || '',
    });
  };

  const handleUpdate = async () => {
    if (!editingPet) return;
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
      // silent
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
      refetch();
      refetchDeleted();
    } catch {
      setDeleteDialog(prev => prev ? { ...prev, isDeleting: false } : null);
    }
  };

  const handleRestore = async (petId: string) => {
    setRestoringId(petId);
    try {
      await restorePet(petId);
      refetch();
      refetchDeleted();
    } catch {
      // silent
    } finally {
      setRestoringId(null);
    }
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
      <div className="max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-700 font-medium">{error}</p>
          <p className="text-red-500 text-sm mt-1">Παρακαλώ δοκιμάστε ξανά αργότερα.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Τα Κατοικίδιά Μου</h1>
          <p className="text-slate-500 mt-1">Διαχειριστείτε τα προφίλ των κατοικιδίων σας.</p>
        </div>
        <div className="flex items-center gap-3">
          {deletedPets.length > 0 && (
            <button
              onClick={() => setShowDeleted(!showDeleted)}
              className={`px-4 py-2 rounded-xl font-bold transition-colors flex items-center gap-2 ${
                showDeleted
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Διαγραμμένα ({deletedPets.length})
            </button>
          )}
          <button
            onClick={() => {
              setCreateForm(EMPTY_FORM);
              setShowCreate(true);
            }}
            className="bg-teal-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-teal-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Προσθήκη
          </button>
        </div>
      </div>

      {/* Deleted Pets */}
      {showDeleted && (
        <div className="mb-8 bg-red-50 border border-red-200 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-red-800 mb-1">Διαγραμμένα Κατοικίδια</h2>
          <p className="text-red-600 text-sm mb-4">Τα κατοικίδια διαγράφονται οριστικά μετά από 30 ημέρες.</p>
          {deletedLoading ? (
            <div className="text-center py-4 text-red-400">Φόρτωση...</div>
          ) : deletedPets.length === 0 ? (
            <p className="text-red-400 text-sm">Δεν υπάρχουν διαγραμμένα κατοικίδια.</p>
          ) : (
            <div className="space-y-3">
              {deletedPets.map(pet => (
                <div key={pet.id} className="bg-white rounded-xl p-4 flex items-center justify-between border border-red-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600 font-bold">
                      {pet.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{pet.name}</p>
                      <p className="text-xs text-slate-500">
                        Διαγράφηκε {pet.deleted_at ? new Date(pet.deleted_at).toLocaleDateString('el-GR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRestore(pet.id)}
                    disabled={restoringId === pet.id}
                    className="px-4 py-2 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition-colors disabled:opacity-50 text-sm"
                  >
                    {restoringId === pet.id ? 'Επαναφορά...' : 'Επαναφορά'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {pets.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-100 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Δεν έχετε κατοικίδια</h3>
          <p className="text-slate-500 mb-6">Προσθέστε το πρώτο σας κατοικίδιο.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pet List */}
          <div className="lg:col-span-1 space-y-4">
            {pets.map((pet) => (
              <button
                key={pet.id}
                onClick={() => setSelectedPetId(pet.id)}
                className={`w-full p-4 rounded-2xl border transition-all text-left ${
                  selectedPet?.id === pet.id
                    ? 'bg-teal-50 border-teal-200 shadow-md'
                    : 'bg-white border-slate-100 hover:border-teal-200'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-slate-100 bg-teal-50 flex items-center justify-center flex-shrink-0">
                    {pet.image_url ? (
                      <img src={getImageUrl(pet.image_url)} alt={pet.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-teal-600 font-bold text-xl">{pet.name.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{pet.name}</h3>
                    <p className="text-sm text-slate-500"><PetTypeLabel type={pet.type} /> • {pet.breed || '-'}</p>
                    <p className="text-xs text-slate-400 mt-1">{pet.age != null ? `${pet.age} ετών` : ''}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Pet Details */}
          {selectedPet && (
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {/* Pet Header */}
                <div
                  className="relative h-48 bg-slate-100 group/cover cursor-pointer"
                  style={selectedPet.cover_image_url ? {
                    backgroundImage: `url(${getImageUrl(selectedPet.cover_image_url)})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  } : undefined}
                  onClick={() => coverPhotoRef.current?.click()}
                >
                  <div className={`absolute inset-0 transition-colors flex items-center justify-center ${selectedPet.cover_image_url ? 'bg-black/0 group-hover/cover:bg-black/30' : ''}`}>
                    <div className={`transition-opacity flex items-center gap-2 px-4 py-2 rounded-xl ${selectedPet.cover_image_url ? 'opacity-0 group-hover/cover:opacity-100 text-white bg-black/40' : 'text-slate-400'}`}>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-sm font-bold">{uploadingCover ? 'Μεταφόρτωση...' : selectedPet.cover_image_url ? 'Αλλαγή Εξωφύλλου' : 'Προσθήκη Εξωφύλλου'}</span>
                    </div>
                  </div>
                  <input
                    ref={coverPhotoRef}
                    type="file"
                    accept="image/jpeg,image/png"
                    className="hidden"
                    onChange={handleCoverPhoto}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="absolute -bottom-12 left-6">
                    <div
                      className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-white shadow-lg bg-teal-100 flex items-center justify-center cursor-pointer relative group"
                      onClick={(e) => { e.stopPropagation(); petPhotoRef.current?.click(); }}
                    >
                      {selectedPet.image_url ? (
                        <img src={getImageUrl(selectedPet.image_url)} alt={selectedPet.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-teal-600 font-bold text-3xl">{selectedPet.name.charAt(0)}</span>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                    </div>
                    <input
                      ref={petPhotoRef}
                      type="file"
                      accept="image/jpeg,image/png"
                      className="hidden"
                      onChange={handlePetPhoto}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="absolute top-4 right-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => openEdit(selectedPet)}
                      className={`backdrop-blur-sm p-2 rounded-xl transition-colors ${selectedPet.cover_image_url ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(selectedPet.id, selectedPet.name)}
                      disabled={deleteDialog?.isDeleting && deleteDialog.petId === selectedPet.id}
                      className={`backdrop-blur-sm p-2 rounded-xl transition-colors disabled:opacity-50 ${selectedPet.cover_image_url ? 'bg-white/20 text-white hover:bg-red-500/80' : 'bg-slate-200 text-slate-600 hover:bg-red-500 hover:text-white'}`}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Pet Info */}
                <div className="pt-16 p-6">
                  <h2 className="text-2xl font-bold text-slate-900">{selectedPet.name}</h2>
                  <p className="text-slate-500"><PetTypeLabel type={selectedPet.type} /> • {selectedPet.breed || '-'}</p>

                  {uploadError && (
                    <div className="mt-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center justify-between">
                      <span>{uploadError}</span>
                      <button onClick={() => setUploadError('')} className="text-red-400 hover:text-red-600 ml-3">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="bg-slate-50 p-4 rounded-xl">
                      <p className="text-xs text-slate-500 uppercase font-bold">Ηλικία</p>
                      <p className="text-lg font-bold text-slate-900">{selectedPet.age != null ? `${selectedPet.age} ετών` : '-'}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl">
                      <p className="text-xs text-slate-500 uppercase font-bold">Βάρος</p>
                      <p className="text-lg font-bold text-slate-900">{selectedPet.weight != null ? `${selectedPet.weight} kg` : '-'}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl">
                      <p className="text-xs text-slate-500 uppercase font-bold">Φύλο</p>
                      <p className="text-lg font-bold text-slate-900"><GenderLabel gender={selectedPet.gender} /></p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl">
                      <p className="text-xs text-slate-500 uppercase font-bold">Microchip</p>
                      <p className="text-lg font-bold text-slate-900">{selectedPet.chip_number || '-'}</p>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      href="/owner/book"
                      className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Κλείστε Ραντεβού
                    </Link>
                    <Link
                      href="/owner/medical"
                      className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                      Ιατρικό Ιστορικό
                    </Link>
                    <Link
                      href="/owner/medications"
                      className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                      Φάρμακα
                    </Link>
                  </div>

                  {/* Recent Activity */}
                  <div className="mt-8">
                    <h3 className="font-bold text-slate-800 mb-4">Πρόσφατη Δραστηριότητα</h3>
                    <div className="space-y-3">
                      {(() => {
                        const lastVisit = getLastVisit(selectedPet.id, appointments);
                        const nextApt = getNextAppointment(selectedPet.id, appointments);
                        if (!lastVisit && !nextApt) {
                          return (
                            <p className="text-sm text-slate-400 py-4">Δεν υπάρχει πρόσφατη δραστηριότητα.</p>
                          );
                        }
                        return (
                          <>
                            {lastVisit && (
                              <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                  </svg>
                                </div>
                                <div>
                                  <p className="font-medium text-slate-800">Τελευταία επίσκεψη</p>
                                  <p className="text-sm text-slate-500">{lastVisit}</p>
                                </div>
                              </div>
                            )}
                            {nextApt && (
                              <div className="flex items-center gap-4 p-3 bg-teal-50 rounded-xl">
                                <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center text-teal-600">
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                                <div>
                                  <p className="font-medium text-teal-800">Επόμενο ραντεβού</p>
                                  <p className="text-sm text-teal-600">{nextApt}</p>
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Pet Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Νέο Κατοικίδιο</h2>
              <button
                onClick={() => { setShowCreate(false); setFormError(''); }}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Όνομα</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={e => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Τύπος</label>
                  <select
                    value={createForm.type}
                    onChange={e => setCreateForm(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    <option value="Dog">Σκύλος</option>
                    <option value="Cat">Γάτα</option>
                    <option value="Other">Άλλο</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Φύλο</label>
                  <select
                    value={createForm.gender}
                    onChange={e => setCreateForm(prev => ({ ...prev, gender: e.target.value }))}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    <option value="Male">Αρσενικό</option>
                    <option value="Female">Θηλυκό</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Ράτσα</label>
                <input
                  type="text"
                  value={createForm.breed}
                  onChange={e => setCreateForm(prev => ({ ...prev, breed: e.target.value }))}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Ηλικία (έτη)</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={createForm.age}
                    onChange={e => setCreateForm(prev => ({ ...prev, age: e.target.value }))}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Βάρος (kg)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={createForm.weight}
                    onChange={e => setCreateForm(prev => ({ ...prev, weight: e.target.value }))}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Microchip <span className="font-normal text-slate-400">(προαιρετικό, 15 ψηφία)</span></label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={15}
                  value={createForm.chip_number}
                  onChange={e => setCreateForm(prev => ({ ...prev, chip_number: e.target.value }))}
                  placeholder="15 ψηφία"
                  className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    createForm.chip_number && !isChipValid(createForm.chip_number)
                      ? 'border-red-400 bg-red-50'
                      : 'border-slate-200'
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
              <button
                onClick={() => { setShowCreate(false); setFormError(''); }}
                className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors"
              >
                Ακύρωση
              </button>
              <button
                onClick={handleCreate}
                disabled={submitting || !createForm.name || !createForm.breed || !createForm.age || !createForm.weight || !isChipValid(createForm.chip_number)}
                className="flex-1 py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Αποθήκευση...' : 'Προσθήκη'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Pet Modal */}
      {editingPet && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Επεξεργασία: {editingPet.name}</h2>
              <button
                onClick={() => { setEditingPet(null); setFormError(''); }}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Όνομα</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Ράτσα</label>
                <input
                  type="text"
                  value={editForm.breed}
                  onChange={e => setEditForm(prev => ({ ...prev, breed: e.target.value }))}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Ηλικία (έτη)</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={editForm.age}
                    onChange={e => setEditForm(prev => ({ ...prev, age: e.target.value }))}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Βάρος (kg)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={editForm.weight}
                    onChange={e => setEditForm(prev => ({ ...prev, weight: e.target.value }))}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Microchip <span className="font-normal text-slate-400">(15 ψηφία)</span></label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={15}
                  value={editForm.chip_number}
                  onChange={e => setEditForm(prev => ({ ...prev, chip_number: e.target.value }))}
                  placeholder="15 ψηφία"
                  className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    editForm.chip_number && !isChipValid(editForm.chip_number)
                      ? 'border-red-400 bg-red-50'
                      : 'border-slate-200'
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
              <button
                onClick={() => { setEditingPet(null); setFormError(''); }}
                className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors"
              >
                Ακύρωση
              </button>
              <button
                onClick={handleUpdate}
                disabled={submitting || !isChipValid(editForm.chip_number)}
                className="flex-1 py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Αποθήκευση...' : 'Αποθήκευση'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">Διαγραφή Κατοικιδίου</h2>
              <button
                onClick={() => setDeleteDialog(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5">
              <p className="text-red-700 text-sm font-medium">
                Αυτή η ενέργεια είναι μη αναστρέψιμη. Όλα τα δεδομένα του κατοικιδίου
                (ιατρικό ιστορικό, ραντεβού, φάρμακα) θα διαγραφούν οριστικά μετά από 30 ημέρες.
              </p>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Πληκτρολογήστε <span className="text-red-600">{deleteDialog.petName}</span> για επιβεβαίωση
              </label>
              <input
                type="text"
                value={deleteDialog.confirmText}
                onChange={e => setDeleteDialog(prev => prev ? { ...prev, confirmText: e.target.value } : null)}
                className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400"
                placeholder={deleteDialog.petName}
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteDialog(null)}
                className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors"
              >
                Ακύρωση
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteDialog.confirmText !== deleteDialog.petName || deleteDialog.isDeleting}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteDialog.isDeleting ? 'Διαγραφή...' : 'Διαγραφή'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
