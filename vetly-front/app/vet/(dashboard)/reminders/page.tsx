'use client';


import { ClinicListRow, ClinicLoading, ClinicEmptyState, ClinicButton, ClinicInput, ClinicPanel, ClinicTextarea, ClinicPageHeader } from '@/components/vet/ClinicUI';
import { useState, useEffect, useRef } from 'react';
import {
  useVetReminders,
  deleteVetReminder,
  createReminder,
  useVetClients,
  useVetClient,
  getCustomReminderTypes,
  updateCustomReminderTypes,
  type VetReminder,
  type VetClientListItem,
  type LinkedPet,
} from '@/hooks/useVetData';
import { api } from '@/lib/api';
import { ClinicPagination as Pagination } from '@/components/vet/ClinicUI';
import DatePicker from '@/components/DatePicker';
import { getImageUrl } from '@/lib/api';
import ClinicAvatar from '@/components/vet/ClinicAvatar';

const DEFAULT_TYPE_LABELS: Record<string, string> = {
  vaccination: 'Εμβολιασμός',
  checkup: 'Έλεγχος',
  medication: 'Φαρμακευτική Αγωγή',
  custom: 'Γενικό',
};

function getTypeLabel(type: string): string {
  return DEFAULT_TYPE_LABELS[type] || type;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('el-GR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getDueDateStyle(dueDateStr: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDateStr);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((due.getTime() - today.getTime()) / 86400000);
  if (diffDays < 0) return 'text-red-600';
  if (diffDays <= 7) return 'text-amber-600';
  return 'text-ink-700';
}

// --- Create Reminder Dialog ---
interface CreateReminderDialogProps {
  reminder?: VetReminder;
  onClose: () => void;
  onSaved: () => void;
  onBusyChange: (busy: boolean) => void;
}

function CreateReminderDialog({ onClose, onSaved, reminder, onBusyChange }: CreateReminderDialogProps) {
  // Client search state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Client & pet selection
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedClientName, setSelectedClientName] = useState('');
  const [selectedPet, setSelectedPet] = useState<LinkedPet | null>(null);

  // Form state
  const [form, setForm] = useState({
    type: reminder?.type || 'checkup',
    title: reminder?.title || '',
    message: reminder?.message || '',
    due_date: reminder?.due_date || '',
    reminder_days_before: reminder ? Math.max(1, Math.round((new Date(reminder.due_date).getTime()-new Date(reminder.reminder_date).getTime())/86400000)) : 14,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Custom type state
  const [customTypes, setCustomTypes] = useState<string[]>([]);
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [showAddType, setShowAddType] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [editingTypeIndex, setEditingTypeIndex] = useState<number | null>(null);
  const [editingTypeName, setEditingTypeName] = useState('');
  const typeDropdownRef = useRef<HTMLDivElement>(null);

  // Load custom types from API
  useEffect(() => {
    getCustomReminderTypes().then(setCustomTypes).catch(() => {});
  }, []);

  // Close type dropdown on click outside
  useEffect(() => {
    function handleTypeClickOutside(e: MouseEvent) {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(e.target as Node)) {
        setTypeDropdownOpen(false);
        setEditingTypeIndex(null);
      }
    }
    document.addEventListener('mousedown', handleTypeClickOutside);
    return () => document.removeEventListener('mousedown', handleTypeClickOutside);
  }, []);

  // Data hooks
  const { clients, loading: clientsLoading } = useVetClients(1, 20, debouncedSearch || undefined);
  const { client: clientDetail, loading: clientDetailLoading } = useVetClient(selectedClientId);
  const availablePets = clientDetail?.id === selectedClientId ? clientDetail.linked_pets ?? [] : [];
  const chosenPet = selectedPet || (availablePets.length === 1 ? availablePets[0] : null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Show dropdown when results exist
  useEffect(() => {
    if (debouncedSearch.length >= 2 && clients.length > 0 && !selectedClientId) {
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  }, [debouncedSearch, clients, selectedClientId]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset pet when client changes
  useEffect(() => {
    setSelectedPet(null);
  }, [selectedClientId]);

  const handleSelectClient = (client: VetClientListItem) => {
    setSelectedClientId(client.id);
    setSelectedClientName(client.name);
    setSearchTerm('');
    setShowDropdown(false);
  };

  const handleClearClient = () => {
    setSelectedClientId(null);
    setSelectedClientName('');
    setSelectedPet(null);
    setSearchTerm('');
    setDebouncedSearch('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: name === 'reminder_days_before' ? Number(value) : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if ((!chosenPet && !reminder) || !form.type.trim() || !form.due_date) {
      setError('Συμπληρώστε τα υποχρεωτικά πεδία.');
      return;
    }
    setSubmitting(true);
    onBusyChange(true);
    setError('');
    try {
      const payload = {
        pet_id: reminder?.pet_id || chosenPet!.id,
        type: form.type.trim(),
        title: form.title.trim() || undefined,
        message: form.message || undefined,
        due_date: form.due_date,
        reminder_days_before: form.reminder_days_before,
      };
      if (reminder) await api.put(`/vet/reminders/${reminder.id}`, payload);
      else await createReminder(payload);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Σφάλμα κατά την αποθήκευση.');
    } finally {
      setSubmitting(false);
      onBusyChange(false);
    }
  };

  return (
    <div className="w-full">
      <div className="bg-white rounded-xl border border-ink-200 shadow-xs w-full">
        <div className="flex items-center justify-between gap-2 p-5 border-b border-ink-200">
          <h2 className="text-base font-semibold text-ink-900">{reminder ? 'Επεξεργασία Υπενθύμισης' : 'Δημιουργία Υπενθύμισης'}</h2>
          <button
            onClick={onClose}
            disabled={submitting}
            aria-label="Κλείσιμο φόρμας υπενθύμισης"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-ink-400 hover:text-ink-700 hover:bg-ink-100 transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}><fieldset disabled={submitting} className="min-w-0 p-5 space-y-4">
          {error && (
            <div role="alert" className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {reminder && <div className="flex items-center gap-3 rounded-lg border border-clinic-100 bg-clinic-50/50 p-3"><ClinicAvatar name={reminder.pet_name || 'Ασθενής'} imageUrl={reminder.pet_image_url} /><div><p className="text-xs text-ink-500">Ασθενής</p><p className="text-sm font-semibold">{reminder.pet_name}</p></div></div>}
          <div className={reminder ? 'hidden' : 'space-y-4'}>
          {/* Client (Owner) Search */}
          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1.5">
              Κάτοχος <span className="text-red-500">*</span>
            </label>

            {selectedClientId ? (
              <div className="flex items-center gap-3 bg-clinic-50 border border-clinic-200 rounded-xl px-4 py-3">
                <div className="w-9 h-9 bg-clinic-200 rounded-full flex items-center justify-center text-clinic-700 font-semibold text-sm shrink-0">
                  {selectedClientName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-clinic-900 text-sm truncate">{selectedClientName}</p>
                  {clientDetail && (
                    <p className="text-xs text-clinic-600 truncate">
                      {clientDetail.email || clientDetail.phone || ''}
                    </p>
                  )}
                </div>
                <ClinicButton variant="ghost"
                  type="button"
                  onClick={handleClearClient}
                  className="shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </ClinicButton>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <ClinicInput
                    ref={inputRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Αναζήτηση κατόχου..."
                    className="w-full pl-12 pr-4 py-3"
                  />
                  {clientsLoading && searchTerm.length >= 2 && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-clinic-600" />
                    </div>
                  )}
                </div>

                {showDropdown && (
                  <ClinicPanel
                    ref={dropdownRef}
                    className="absolute z-10 w-full mt-2 max-h-80 overflow-y-auto"
                  >
                    {clients.map((c) => (
                      <ClinicButton variant="secondary"
                        key={c.id}
                        type="button"
                        onClick={() => handleSelectClient(c)}
                        className="w-full text-left"
                      >
                        <div className="w-11 h-11 bg-ink-100 rounded-full flex items-center justify-center text-ink-600 font-semibold text-base shrink-0">
                          {c.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-ink-800">{c.name}</p>
                          <p className="text-sm text-ink-500 truncate mt-0.5">
                            {c.email || c.phone || ''}
                            {c.pet_count > 0 && ` · ${c.pet_count} κατοικίδια`}
                          </p>
                        </div>
                        {c.status === 'linked' && (
                          <span className="text-xs font-semibold text-clinic-600 bg-clinic-50 px-2.5 py-1 rounded-full shrink-0">Vetly</span>
                        )}
                      </ClinicButton>
                    ))}
                  </ClinicPanel>
                )}
              </div>
            )}
          </div>

          {/* Pet Selection */}
          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1.5">
              Κατοικίδιο <span className="text-red-500">*</span>
            </label>

            {!selectedClientId ? (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-ink-200 bg-ink-50 text-ink-400 text-sm">
                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Επιλέξτε πρώτα κάτοχο
              </div>
            ) : clientDetailLoading ? (
              <div className="flex items-center justify-center py-3 rounded-xl border border-ink-200">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-clinic-600" />
              </div>
            ) : availablePets.length === 0 ? (
              <div className="px-4 py-3 rounded-xl border border-dashed border-ink-200 bg-ink-50">
                <p className="text-ink-400 text-sm">Δεν υπάρχουν κατοικίδια</p>
              </div>
            ) : availablePets.length === 1 ? (
              (() => {
                const pet = availablePets[0];
                return (
                  <div className="flex items-center gap-3 bg-clinic-50 border border-clinic-200 rounded-xl px-4 py-3">
                    <div className="w-9 h-9 rounded-full bg-clinic-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {pet.image_url ? (
                        <img src={getImageUrl(pet.image_url)} alt={pet.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl">{pet.type === 'Dog' ? '🐕' : pet.type === 'Cat' ? '🐈' : '🐾'}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-clinic-900 text-sm">{pet.name}</p>
                      <p className="text-xs text-clinic-600">{pet.breed || pet.type}</p>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="space-y-1.5">
                {availablePets.map((pet) => (
                  <button
                    key={pet.id}
                    type="button"
                    onClick={() => setSelectedPet(selectedPet?.id === pet.id ? null : pet)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border text-left transition-all ${
                      selectedPet?.id === pet.id
                        ? 'bg-clinic-50 border-clinic-300 ring-2 ring-clinic-200'
                        : 'bg-white border-ink-200 hover:bg-ink-50 hover:border-ink-300'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-clinic-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {pet.image_url ? (
                        <img src={getImageUrl(pet.image_url)} alt={pet.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg">{pet.type === 'Dog' ? '🐕' : pet.type === 'Cat' ? '🐈' : '🐾'}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-sm ${selectedPet?.id === pet.id ? 'text-clinic-900' : 'text-ink-800'}`}>
                        {pet.name}
                      </p>
                      <p className="text-xs text-ink-500 truncate">
                        {pet.breed || pet.type}
                        {pet.age != null && ` · ${pet.age} ετών`}
                      </p>
                    </div>
                    {selectedPet?.id === pet.id && (
                      <svg className="w-5 h-5 text-clinic-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          </div>
          <h3 className="border-t border-ink-200 pt-4 text-sm font-semibold">Περιεχόμενο υπενθύμισης</h3>
          {/* Type */}
          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1.5">
              Τύπος <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1" ref={typeDropdownRef}>
                <ClinicButton variant="secondary"
                  type="button"
                  onClick={() => { setTypeDropdownOpen(!typeDropdownOpen); setEditingTypeIndex(null); }}
                  className="w-full justify-between"
                >
                  <span>{getTypeLabel(form.type)}</span>
                  <svg className={`w-4 h-4 text-ink-400 transition-transform ${typeDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </ClinicButton>
                {typeDropdownOpen && (
                  <ClinicPanel className="absolute z-20 w-full mt-1 overflow-hidden">
                    {[
                      { value: 'vaccination', label: 'Εμβολιασμός' },
                      { value: 'checkup', label: 'Έλεγχος' },
                      { value: 'medication', label: 'Φαρμακευτική Αγωγή' },
                      { value: 'custom', label: 'Γενικό' },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => { setForm(prev => ({ ...prev, type: opt.value })); setTypeDropdownOpen(false); }}
                        className={`w-full text-left px-3 py-2.5 text-sm hover:bg-clinic-50 transition-colors ${form.type === opt.value ? 'bg-clinic-50 text-clinic-700 font-semibold' : 'text-ink-700'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                    {customTypes.length > 0 && (
                      <div className="border-t border-ink-200">
                        {customTypes.map((ct, idx) => (
                          <div key={idx} className="group relative">
                            {editingTypeIndex === idx ? (
                              <div className="flex items-center gap-1.5 px-3 py-2">
                                <ClinicInput
                                  type="text"
                                  value={editingTypeName}
                                  onChange={(e) => setEditingTypeName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      const trimmed = editingTypeName.trim();
                                      if (!trimmed) return;
                                      const updated = customTypes.map((t, i) => i === idx ? trimmed : t);
                                      setCustomTypes(updated);
                                      updateCustomReminderTypes(updated).catch(() => {});
                                      if (form.type === ct) setForm(prev => ({ ...prev, type: trimmed }));
                                      setEditingTypeIndex(null);
                                    }
                                    if (e.key === 'Escape') setEditingTypeIndex(null);
                                  }}
                                  className="flex-1 px-2 py-1"
                                  autoFocus
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <ClinicButton variant="ghost"
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const trimmed = editingTypeName.trim();
                                    if (!trimmed) return;
                                    const updated = customTypes.map((t, i) => i === idx ? trimmed : t);
                                    setCustomTypes(updated);
                                    updateCustomReminderTypes(updated).catch(() => {});
                                    if (form.type === ct) setForm(prev => ({ ...prev, type: trimmed }));
                                    setEditingTypeIndex(null);
                                  }}
                                  className=""
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                  </svg>
                                </ClinicButton>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => { setForm(prev => ({ ...prev, type: ct })); setTypeDropdownOpen(false); }}
                                className={`w-full text-left px-3 py-2.5 text-sm hover:bg-clinic-50 transition-colors flex items-center ${form.type === ct ? 'bg-clinic-50 text-clinic-700 font-semibold' : 'text-ink-700'}`}
                              >
                                <span className="flex-1">{ct}</span>
                                <span className="hidden group-hover:flex items-center gap-1">
                                  <span
                                    role="button"
                                    onClick={(e) => { e.stopPropagation(); setEditingTypeIndex(idx); setEditingTypeName(ct); }}
                                    className="text-ink-400 hover:text-clinic-600 p-0.5 transition-colors"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                  </span>
                                  <span
                                    role="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const updated = customTypes.filter((_, i) => i !== idx);
                                      setCustomTypes(updated);
                                      updateCustomReminderTypes(updated).catch(() => {});
                                      if (form.type === ct) setForm(prev => ({ ...prev, type: 'checkup' }));
                                    }}
                                    className="text-ink-400 hover:text-red-500 p-0.5 transition-colors"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </span>
                                </span>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {showAddType && (
                      <div className="border-t border-ink-200 p-2">
                        <div className="flex gap-1.5">
                          <ClinicInput
                            type="text"
                            value={newTypeName}
                            onChange={(e) => setNewTypeName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const trimmed = newTypeName.trim();
                                if (!trimmed) return;
                                const updated = [...customTypes, trimmed];
                                setCustomTypes(updated);
                                updateCustomReminderTypes(updated).catch(() => {});
                                setForm(prev => ({ ...prev, type: trimmed }));
                                setNewTypeName('');
                                setShowAddType(false);
                                setTypeDropdownOpen(false);
                              }
                              if (e.key === 'Escape') setShowAddType(false);
                            }}
                            placeholder="Νέος τύπος..."
                            className="flex-1 px-2.5 py-1.5"
                            autoFocus
                          />
                          <ClinicButton variant="primary"
                            type="button"
                            onClick={() => {
                              const trimmed = newTypeName.trim();
                              if (!trimmed) return;
                              const updated = [...customTypes, trimmed];
                              setCustomTypes(updated);
                              updateCustomReminderTypes(updated).catch(() => {});
                              setForm(prev => ({ ...prev, type: trimmed }));
                              setNewTypeName('');
                              setShowAddType(false);
                              setTypeDropdownOpen(false);
                            }}
                            className="shrink-0"
                          >
                            Προσθήκη
                          </ClinicButton>
                        </div>
                      </div>
                    )}
                  </ClinicPanel>
                )}
              </div>
              <button
                type="button"
                onClick={() => { setShowAddType(true); setTypeDropdownOpen(true); }}
                className="w-10 h-10 flex items-center justify-center rounded-xl border border-ink-200 text-ink-500 hover:bg-clinic-50 hover:text-clinic-600 hover:border-clinic-300 transition-all shrink-0"
                title="Προσθήκη νέου τύπου"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1.5">
              Τίτλος <span className="text-ink-400 font-normal">(προαιρετικό)</span>
            </label>
            <ClinicInput
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Προαιρετικό - θα δημιουργηθεί αυτόματα"
              className="w-full px-3 py-2.5"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1.5">
              Μήνυμα <span className="text-ink-400 font-normal">(προαιρετικό)</span>
            </label>
            <ClinicTextarea
              name="message"
              value={form.message}
              onChange={handleChange}
              rows={3}
              placeholder="Επιπλέον πληροφορίες..."
              className="w-full px-3 py-2.5 resize-none"
            />
          </div>

          <h3 className="border-t border-ink-200 pt-4 text-sm font-semibold">Προγραμματισμός</h3>
          {/* Due Date */}
          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1.5">
              Ημερομηνία <span className="text-red-500">*</span>
            </label>
            <DatePicker
              value={form.due_date}
              onChange={(v) => setForm(f => ({ ...f, due_date: v }))}
              placeholder="Επιλέξτε ημερομηνία"
            />
          </div>

          {/* Reminder days before */}
          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1.5">
              Υπενθύμιση πριν (ημέρες)
            </label>
            <ClinicInput
              type="number"
              name="reminder_days_before"
              value={form.reminder_days_before}
              onChange={handleChange}
              min={1}
              max={365}
              className="w-full px-3 py-2.5"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <ClinicButton variant="secondary"
              type="button"
              onClick={onClose}
              className="flex-1"
            >
              Ακύρωση
            </ClinicButton>
            <ClinicButton variant="primary"
              type="submit"
              disabled={submitting}
              className="flex-1 disabled:opacity-50"
            >
              {submitting ? 'Αποθήκευση...' : reminder ? 'Αποθήκευση' : 'Δημιουργία'}
            </ClinicButton>
          </div>
        </fieldset></form>
      </div>
    </div>
  );
}

// --- Delete Reminder Dialog ---
function DeleteReminderDialog({
  reminder,
  onClose,
  onSuccess,
  onBusyChange,
}: {
  onBusyChange: (busy: boolean) => void;
  reminder: VetReminder;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const typeLabel = getTypeLabel(reminder.type);

  const handleDelete = async () => {
    if (submitting) return;
    onBusyChange(true);
    try {
      setSubmitting(true);
      setError(null);
      await deleteVetReminder(reminder.id);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Αποτυχία διαγραφής');
    } finally {
      setSubmitting(false);
      onBusyChange(false);
    }
  };

  return (
    <>

      <div className="w-full">
        <div className="bg-white rounded-xl border border-ink-200 w-full" onClick={(e) => e.stopPropagation()}>
          <div className="p-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-ink-900 text-center mb-2">Διαγραφή Υπενθύμισης</h3>
            <p className="text-sm text-ink-500 text-center mb-4">
              Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την υπενθύμιση;
            </p>

            <div className="bg-ink-50 rounded-xl p-4 mb-4 space-y-1 text-sm">
              <p className="text-ink-700"><span className="font-semibold">Τίτλος:</span> {reminder.title}</p>
              <p className="text-ink-700"><span className="font-semibold">Κατοικίδιο:</span> {reminder.pet_name || '-'}</p>
              <p className="text-ink-700"><span className="font-semibold">Τύπος:</span> {typeLabel}</p>
              <p className="text-ink-700"><span className="font-semibold">Ημερομηνία:</span> {formatDate(reminder.due_date)}</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm font-medium mb-4">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <ClinicButton variant="secondary"
                onClick={onClose}
                disabled={submitting}
                className="flex-1"
              >
                Πίσω
              </ClinicButton>
              <ClinicButton variant="secondary"
                onClick={handleDelete}
                disabled={submitting}
                className="flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Διαγραφή...
                  </span>
                ) : (
                  'Διαγραφή'
                )}
              </ClinicButton>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function VetRemindersPage() {
  const [page, setPage] = useState(1);
  const { reminders, total, totalPages, loading, error, refetch } = useVetReminders(page, 10);
  const [deleteDialog, setDeleteDialog] = useState<VetReminder | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<VetReminder | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);
  const panelOpen = showCreate || !!editing || !!deleteDialog;
  useEffect(() => { if (panelOpen) { panelRef.current?.focus({preventScroll:true}); if(window.innerWidth < 1280) panelRef.current?.scrollIntoView({block:'start'}); } }, [panelOpen, editing, deleteDialog]);
  const close = () => { setShowCreate(false); setEditing(null); setDeleteDialog(null); };
  const saved = () => { setNotice(editing ? 'Η υπενθύμιση ενημερώθηκε.' : 'Η υπενθύμιση δημιουργήθηκε.'); close(); void refetch(); };
  const deleted = () => { close(); setNotice('Η υπενθύμιση διαγράφηκε.'); if(page > 1 && reminders.length === 1) setPage(page-1); else void refetch(); };
  return <div>
    <ClinicPageHeader title="Υπενθυμίσεις" description="Ημερομηνίες φροντίδας και προγραμματισμένες ειδοποιήσεις για τους ασθενείς σας." actions={<ClinicButton variant="primary" disabled={busy} onClick={() => { close(); setShowCreate(true); setNotice(''); }}>Νέα Υπενθύμιση</ClinicButton>} />
    {notice && <p role="status" className="mb-4 rounded-lg border border-clinic-200 bg-clinic-50 p-3 text-sm">{notice}</p>}
    <div className={`grid items-start gap-4 ${panelOpen ? 'xl:grid-cols-[minmax(0,1fr)_390px]' : ''}`}>
      <div className="order-2 min-w-0 xl:order-1">
        <ClinicPanel className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-200 px-4 py-3"><h2 className="text-sm font-semibold">Πρόγραμμα φροντίδας</h2><span className="text-xs text-ink-500">{loading ? 'Φόρτωση…' : `${total} υπενθυμίσεις`}</span></div>
          {loading ? <ClinicLoading label="Φόρτωση υπενθυμίσεων…" /> : error ? <div role="alert" className="p-5"><p className="mb-3 text-sm text-red-700">{error}</p><ClinicButton onClick={() => void refetch()}>Δοκιμή ξανά</ClinicButton></div> : !reminders.length ? <ClinicEmptyState title="Δεν υπάρχουν υπενθυμίσεις" description="Προσθέστε μια υπενθύμιση για την επόμενη φροντίδα ενός ασθενούς." /> : <><div aria-hidden="true" className="hidden gap-x-3 border-b border-ink-200 bg-ink-50 px-5 py-2 text-xs font-medium text-ink-500 md:grid md:grid-cols-[minmax(0,1.6fr)_112px_112px_96px_auto]"><span>Υπενθύμιση</span><span>Φροντίδα</span><span>Ειδοποίηση</span><span>Κατάσταση</span><span className="w-[168px]" /></div>{reminders.map(reminder => <ClinicListRow key={reminder.id} className={editing?.id === reminder.id || deleteDialog?.id === reminder.id ? 'py-2! bg-clinic-50/60! shadow-[inset_3px_0_0_var(--color-clinic-600)]' : 'py-2!'}>
            <div className="grid grid-cols-1 items-center gap-x-3 gap-y-1.5 md:grid-cols-[minmax(0,1.6fr)_112px_112px_96px_auto]">
              <div className="flex min-w-0 items-center gap-2.5"><ClinicAvatar name={reminder.pet_name || 'Ασθενής'} imageUrl={reminder.pet_image_url} /><div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-ink-900">{reminder.title}</h3>
                <p className="truncate text-xs text-ink-500" title={reminder.message || undefined}>{reminder.pet_name || 'Ασθενής'} · {getTypeLabel(reminder.type)}{reminder.message ? ` · ${reminder.message}` : ''}</p>
              </div></div>
              <p className={`pl-[46px] text-sm tabular-nums md:pl-0 ${!reminder.is_sent && !reminder.is_dismissed ? getDueDateStyle(reminder.due_date) : 'text-ink-700'}`}><span className="text-xs text-ink-500 md:hidden">Φροντίδα: </span>{formatDate(reminder.due_date)}</p>
              <p className="pl-[46px] text-sm tabular-nums text-ink-600 md:pl-0"><span className="text-xs text-ink-500 md:hidden">Ειδοποίηση: </span>{formatDate(reminder.reminder_date)}</p>
              <div className="pl-[46px] md:pl-0"><span className={`inline-flex h-5 items-center whitespace-nowrap rounded-full px-2 text-xs font-medium ${reminder.is_dismissed ? 'bg-ink-100 text-ink-500' : reminder.is_sent ? 'bg-clinic-100 text-clinic-800' : 'bg-[#ffe0c7] text-[#622700]'}`}>{reminder.is_dismissed ? 'Απορρίφθηκε' : reminder.is_sent ? 'Εστάλη' : 'Εκκρεμεί'}</span></div>
              <div className="flex gap-1 pl-[46px] md:w-[168px] md:justify-end md:pl-0"><ClinicButton variant="ghost" aria-label={`Επεξεργασία: ${reminder.title}`} title={reminder.is_sent || reminder.is_dismissed ? 'Δεν είναι διαθέσιμη η επεξεργασία μετά την αποστολή ή την απόρριψη.' : undefined} disabled={busy || reminder.is_sent || reminder.is_dismissed} onClick={() => { close(); setEditing(reminder); setNotice(''); }}>Επεξεργασία</ClinicButton><ClinicButton variant="ghost" title="Διαγραφή" aria-label={`Διαγραφή: ${reminder.title}`} disabled={busy} onClick={() => { close(); setDeleteDialog(reminder); }}>Διαγραφή</ClinicButton></div>
            </div>
          </ClinicListRow>)}</>}
        </ClinicPanel>
        <div inert={busy}><Pagination page={page} totalPages={totalPages} onPageChange={value => { setPage(value); close(); }} /></div>
      </div>
      {panelOpen && <div ref={panelRef} tabIndex={-1} aria-label="Πάνελ υπενθύμισης" className="order-1 min-w-0 scroll-mt-20 outline-none xl:order-2 xl:sticky xl:top-20 xl:max-h-[calc(100dvh-6rem)] xl:overflow-y-auto">
        {(showCreate || editing) && <CreateReminderDialog key={editing?.id || 'new'} reminder={editing || undefined} onClose={close} onSaved={saved} onBusyChange={setBusy} />}
        {deleteDialog && <DeleteReminderDialog key={deleteDialog.id} reminder={deleteDialog} onClose={close} onSuccess={deleted} onBusyChange={setBusy} />}
      </div>}
    </div>
  </div>;
}
