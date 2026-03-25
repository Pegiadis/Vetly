'use client';

import { useState, useEffect, useRef } from 'react';
import {
  useVetReminders,
  deleteVetReminder,
  createReminder,
  useVetClients,
  useVetClient,
  type VetReminder,
  type VetClientListItem,
  type LinkedPet,
} from '@/hooks/useVetData';
import Pagination from '@/components/Pagination';
import DatePicker from '@/components/DatePicker';

const DEFAULT_TYPE_LABELS: Record<string, string> = {
  vaccination: 'Εμβολιασμός',
  checkup: 'Έλεγχος',
  medication: 'Φαρμακευτική Αγωγή',
  custom: 'Γενικό',
};

const TYPE_BADGE_CLASSES: Record<string, string> = {
  vaccination: 'bg-green-100 text-green-700',
  checkup: 'bg-blue-100 text-blue-700',
  medication: 'bg-purple-100 text-purple-700',
  custom: 'bg-slate-100 text-slate-600',
};

function getTypeBadgeClass(type: string): string {
  return TYPE_BADGE_CLASSES[type] || 'bg-slate-100 text-slate-600';
}

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
  return 'text-slate-700';
}

// --- Create Reminder Dialog ---
interface CreateReminderDialogProps {
  onClose: () => void;
  onSaved: () => void;
}

function petEmoji(type: string) {
  if (type === 'Dog') return '🐕';
  if (type === 'Cat') return '🐈';
  return '🐾';
}

function CreateReminderDialog({ onClose, onSaved }: CreateReminderDialogProps) {
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
    type: 'checkup',
    title: '',
    message: '',
    due_date: '',
    reminder_days_before: 14,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Custom type state
  const [customTypes, setCustomTypes] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem('vetly_custom_reminder_types') || '[]');
    } catch { return []; }
  });
  const [showAddType, setShowAddType] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');

  // Data hooks
  const { clients, loading: clientsLoading } = useVetClients(1, 20, debouncedSearch || undefined);
  const { client: clientDetail, loading: clientDetailLoading } = useVetClient(selectedClientId);
  const availablePets = clientDetail?.linked_pets ?? [];

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
    if (!selectedPet || !form.type.trim() || !form.due_date) {
      setError('Συμπληρώστε τα υποχρεωτικά πεδία.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await createReminder({
        pet_id: selectedPet.id,
        type: form.type.trim(),
        title: form.title.trim() || undefined,
        message: form.message || undefined,
        due_date: form.due_date,
        reminder_days_before: form.reminder_days_before,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Σφάλμα κατά την αποθήκευση.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">Δημιουργία Υπενθύμισης</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Client (Owner) Search */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">
              Κάτοχος <span className="text-red-500">*</span>
            </label>

            {selectedClientId ? (
              <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3">
                <div className="w-9 h-9 bg-indigo-200 rounded-full flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
                  {selectedClientName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-indigo-900 text-sm truncate">{selectedClientName}</p>
                  {clientDetail && (
                    <p className="text-xs text-indigo-600 truncate">
                      {clientDetail.email || clientDetail.phone || ''}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleClearClient}
                  className="text-indigo-400 hover:text-indigo-600 transition-colors p-0.5 shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Αναζήτηση κατόχου..."
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-slate-800"
                  />
                  {clientsLoading && searchTerm.length >= 2 && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600" />
                    </div>
                  )}
                </div>

                {showDropdown && (
                  <div
                    ref={dropdownRef}
                    className="absolute z-10 w-full mt-2 bg-white rounded-xl shadow-xl border border-slate-200 max-h-80 overflow-y-auto"
                  >
                    {clients.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleSelectClient(c)}
                        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-indigo-50 transition-colors text-left first:rounded-t-xl last:rounded-b-xl border-b border-slate-100 last:border-b-0"
                      >
                        <div className="w-11 h-11 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-bold text-base shrink-0">
                          {c.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-800">{c.name}</p>
                          <p className="text-sm text-slate-500 truncate mt-0.5">
                            {c.email || c.phone || ''}
                            {c.pet_count > 0 && ` · ${c.pet_count} κατοικίδια`}
                          </p>
                        </div>
                        {c.status === 'linked' && (
                          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full shrink-0">Vetly</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Pet Selection */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">
              Κατοικίδιο <span className="text-red-500">*</span>
            </label>

            {!selectedClientId ? (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 text-sm">
                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Επιλέξτε πρώτα κάτοχο
              </div>
            ) : clientDetailLoading ? (
              <div className="flex items-center justify-center py-3 rounded-xl border border-slate-200">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600" />
              </div>
            ) : availablePets.length === 0 ? (
              <div className="px-4 py-3 rounded-xl border border-dashed border-slate-200 bg-slate-50">
                <p className="text-slate-400 text-sm">Δεν υπάρχουν κατοικίδια</p>
              </div>
            ) : availablePets.length === 1 ? (
              (() => {
                const pet = availablePets[0];
                if (!selectedPet) setSelectedPet(pet);
                return (
                  <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3">
                    <span className="text-xl">{petEmoji(pet.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-indigo-900 text-sm">{pet.name}</p>
                      <p className="text-xs text-indigo-600">{pet.breed || pet.type}</p>
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
                        ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-200'
                        : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-lg">{petEmoji(pet.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-sm ${selectedPet?.id === pet.id ? 'text-indigo-900' : 'text-slate-800'}`}>
                        {pet.name}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {pet.breed || pet.type}
                        {pet.age != null && ` · ${pet.age} ετών`}
                      </p>
                    </div>
                    {selectedPet?.id === pet.id && (
                      <svg className="w-5 h-5 text-indigo-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">
              Τύπος <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <select
                value={form.type}
                onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value }))}
                className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
              >
                <option value="vaccination">Εμβολιασμός</option>
                <option value="checkup">Έλεγχος</option>
                <option value="medication">Φαρμακευτική Αγωγή</option>
                <option value="custom">Γενικό</option>
                {customTypes.map((ct) => (
                  <option key={ct} value={ct}>{ct}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowAddType(!showAddType)}
                className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300 transition-all shrink-0"
                title="Προσθήκη νέου τύπου"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
            {showAddType && (
              <div className="flex gap-2 mt-2">
                <input
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
                      localStorage.setItem('vetly_custom_reminder_types', JSON.stringify(updated));
                      setForm(prev => ({ ...prev, type: trimmed }));
                      setNewTypeName('');
                      setShowAddType(false);
                    }
                  }}
                  placeholder="Πληκτρολογήστε νέο τύπο..."
                  className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    const trimmed = newTypeName.trim();
                    if (!trimmed) return;
                    const updated = [...customTypes, trimmed];
                    setCustomTypes(updated);
                    localStorage.setItem('vetly_custom_reminder_types', JSON.stringify(updated));
                    setForm(prev => ({ ...prev, type: trimmed }));
                    setNewTypeName('');
                    setShowAddType(false);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors shrink-0"
                >
                  Προσθήκη
                </button>
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">
              Τίτλος <span className="text-slate-400 font-normal">(προαιρετικό)</span>
            </label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Προαιρετικό - θα δημιουργηθεί αυτόματα"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">
              Μήνυμα <span className="text-slate-400 font-normal">(προαιρετικό)</span>
            </label>
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              rows={3}
              placeholder="Επιπλέον πληροφορίες..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
            />
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">
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
            <label className="block text-sm font-bold text-slate-700 mb-1">
              Υπενθύμιση πριν (ημέρες)
            </label>
            <input
              type="number"
              name="reminder_days_before"
              value={form.reminder_days_before}
              onChange={handleChange}
              min={1}
              max={365}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
            >
              Ακύρωση
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 bg-indigo-600 rounded-xl text-sm font-bold text-white hover:bg-indigo-700 transition-all disabled:opacity-50"
            >
              {submitting ? 'Αποθήκευση...' : 'Δημιουργία'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Delete Reminder Dialog ---
function DeleteReminderDialog({
  reminder,
  onClose,
  onSuccess,
}: {
  reminder: VetReminder;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const typeLabel = getTypeLabel(reminder.type);

  const handleDelete = async () => {
    try {
      setSubmitting(true);
      setError(null);
      await deleteVetReminder(reminder.id);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Αποτυχία διαγραφής');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
          <div className="p-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 text-center mb-2">Διαγραφή Υπενθύμισης</h3>
            <p className="text-sm text-slate-500 text-center mb-4">
              Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την υπενθύμιση;
            </p>

            <div className="bg-slate-50 rounded-xl p-4 mb-4 space-y-1 text-sm">
              <p className="text-slate-700"><span className="font-bold">Τίτλος:</span> {reminder.title}</p>
              <p className="text-slate-700"><span className="font-bold">Κατοικίδιο:</span> {reminder.pet_name || '-'}</p>
              <p className="text-slate-700"><span className="font-bold">Τύπος:</span> {typeLabel}</p>
              <p className="text-slate-700"><span className="font-bold">Ημερομηνία:</span> {formatDate(reminder.due_date)}</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm font-medium mb-4">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={submitting}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
              >
                Πίσω
              </button>
              <button
                onClick={handleDelete}
                disabled={submitting}
                className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// --- Main Page ---
export default function VetRemindersPage() {
  const [page, setPage] = useState(1);
  const { reminders, totalPages, loading, error, refetch } = useVetReminders(page, 10);
  const [deleteDialog, setDeleteDialog] = useState<VetReminder | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const handleDeleteSuccess = () => {
    setDeleteDialog(null);
    refetch();
  };

  const handleCreated = () => {
    setShowCreate(false);
    refetch();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {showCreate && (
        <CreateReminderDialog
          onClose={() => setShowCreate(false)}
          onSaved={handleCreated}
        />
      )}

      {deleteDialog && (
        <DeleteReminderDialog
          reminder={deleteDialog}
          onClose={() => setDeleteDialog(null)}
          onSuccess={handleDeleteSuccess}
        />
      )}

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Υπενθυμίσεις</h1>
          <p className="text-slate-500 mt-1">
            Διαχείριση υπενθυμίσεων για τους ασθενείς σας
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Νέα Υπενθύμιση
        </button>
      </div>

      {/* Table / List */}
      {reminders.length > 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Κατοικίδιο</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Τύπος</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Τίτλος</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Ημ/νία</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Υπενθύμιση</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Κατάσταση</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {reminders.map((reminder: VetReminder) => {
                  const typeBadge = getTypeBadgeClass(reminder.type);
                  const typeLabel = getTypeLabel(reminder.type);
                  const dueDateColor = getDueDateStyle(reminder.due_date);

                  return (
                    <tr key={reminder.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 flex-shrink-0">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                          </div>
                          <span className="text-sm font-semibold text-slate-800">
                            {reminder.pet_name || '-'}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${typeBadge}`}>
                          {typeLabel}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-slate-800 font-medium">{reminder.title}</p>
                        {reminder.message && (
                          <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{reminder.message}</p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-sm font-semibold ${dueDateColor}`}>
                          {formatDate(reminder.due_date)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-slate-600">
                          {formatDate(reminder.reminder_date)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {reminder.is_dismissed ? (
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">
                            Απορρίφθηκε
                          </span>
                        ) : reminder.is_sent ? (
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-700">
                            Εστάλη
                          </span>
                        ) : (
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
                            Εκκρεμεί
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => setDeleteDialog(reminder)}
                          className="text-slate-400 hover:text-red-600 transition-colors"
                          title="Διαγραφή"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-100 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Δεν υπάρχουν υπενθυμίσεις</h3>
          <p className="text-slate-500 mb-6">Δημιουργήστε την πρώτη σας υπενθύμιση.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Νέα Υπενθύμιση
          </button>
        </div>
      )}

      <div className="mt-4">
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}
