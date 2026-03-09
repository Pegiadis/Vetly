'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  useVetClients,
  useVetClient,
  createVetClient,
  updateVetClient,
  deleteVetClient,
  generateClientInvite,
  addClientPet,
  updateClientPet,
  deleteClientPet,
  usePatientHistory,
  createReminder,
  type VetClient,
  type VetClientPet,
  type VetClientListItem,
  type LinkedPet,
} from '@/hooks/useVetData';
import Pagination from '@/components/Pagination';
import DatePicker from '@/components/DatePicker';

const statusConfig: Record<string, { label: string; bg: string }> = {
  managed: { label: 'Χωρίς λογαριασμό', bg: 'bg-slate-100 text-slate-600' },
  invited: { label: 'Προσκλήθηκε', bg: 'bg-amber-100 text-amber-700' },
  linked: { label: 'Συνδεδεμένος', bg: 'bg-green-100 text-green-700' },
};

const petTypeLabels: Record<string, string> = { Dog: 'Σκύλος', Cat: 'Γάτα', Other: 'Άλλο' };
const genderLabels: Record<string, string> = { Male: 'Αρσενικό', Female: 'Θηλυκό' };

// --- Add/Edit Client Dialog ---
function ClientDialog({
  client,
  onClose,
  onSaved,
}: {
  client?: VetClient | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: client?.name || '',
    email: client?.email || '',
    phone: client?.phone || '',
    address: client?.address || '',
    notes: client?.notes || '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleBlur = (field: string) => setTouched(prev => ({ ...prev, [field]: true }));

  const fieldErrors: Record<string, string> = {};
  if (form.name.length > 0 && form.name.trim().length < 2) fieldErrors.name = 'Τουλάχιστον 2 χαρακτήρες.';

  const inputErr = (field: string) => touched[field] && fieldErrors[field] ? 'border-red-300 bg-red-50/30' : 'border-slate-200';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        address: form.address.trim() || undefined,
        notes: form.notes.trim() || undefined,
      };
      if (client) {
        await updateVetClient(client.id, payload);
      } else {
        await createVetClient(payload);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Αποτυχία αποθήκευσης');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-5 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">
              {client ? 'Επεξεργασία Πελάτη' : 'Νέος Πελάτης'}
            </h2>
            <button onClick={onClose} className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/40 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Ονοματεπώνυμο *</label>
            <input
              type="text"
              required
              maxLength={255}
              value={form.name}
              onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setTouched(t => ({ ...t, name: true })); }}
              onBlur={() => handleBlur('name')}
              className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${inputErr('name')}`}
              placeholder="π.χ. Μαρία Παπαδοπούλου"
            />
            {touched.name && fieldErrors.name && <p className="text-xs text-red-600 mt-1">{fieldErrors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="maria@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Τηλέφωνο</label>
            <input
              type="tel"
              maxLength={50}
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="69xxxxxxxx"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Διεύθυνση</label>
            <input
              type="text"
              maxLength={500}
              value={form.address}
              onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Οδός, Πόλη"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Σημειώσεις</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={2}
              maxLength={2000}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="Προσθέστε σημειώσεις..."
            />
            {form.notes.length > 1800 && (
              <p className="text-xs text-slate-400 mt-1 text-right">{form.notes.length}/2000</p>
            )}
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors">
              Ακύρωση
            </button>
            <button type="submit" disabled={submitting || !form.name.trim() || Object.keys(fieldErrors).length > 0} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {submitting ? 'Αποθήκευση...' : 'Αποθήκευση'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Add/Edit Pet Dialog ---
function PetDialog({
  clientId,
  pet,
  onClose,
  onSaved,
}: {
  clientId: string;
  pet?: VetClientPet | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: pet?.name || '',
    type: pet?.type || 'Dog',
    breed: pet?.breed || '',
    age: pet?.age?.toString() || '',
    weight: pet?.weight?.toString() || '',
    gender: pet?.gender || '',
    notes: pet?.notes || '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [petTouched, setPetTouched] = useState<Record<string, boolean>>({});

  const handlePetBlur = (field: string) => setPetTouched(prev => ({ ...prev, [field]: true }));

  const petFieldErrors: Record<string, string> = {};
  if (form.name.length > 0 && form.name.trim().length < 2) petFieldErrors.name = 'Τουλάχιστον 2 χαρακτήρες.';

  const petInputErr = (field: string) => petTouched[field] && petFieldErrors[field] ? 'border-red-300 bg-red-50/30' : 'border-slate-200';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        name: form.name.trim(),
        type: form.type,
        breed: form.breed.trim() || undefined,
        age: form.age ? parseInt(form.age) : undefined,
        weight: form.weight ? parseFloat(form.weight) : undefined,
        gender: form.gender || undefined,
        notes: form.notes.trim() || undefined,
      };
      if (pet) {
        await updateClientPet(clientId, pet.id, payload);
      } else {
        await addClientPet(clientId, payload);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Αποτυχία αποθήκευσης');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-5 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">
              {pet ? 'Επεξεργασία Κατοικιδίου' : 'Νέο Κατοικίδιο'}
            </h2>
            <button onClick={onClose} className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/40 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Όνομα *</label>
            <input
              type="text"
              required
              maxLength={30}
              value={form.name}
              onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setPetTouched(t => ({ ...t, name: true })); }}
              onBlur={() => handlePetBlur('name')}
              className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${petInputErr('name')}`}
            />
            {petTouched.name && petFieldErrors.name && <p className="text-xs text-red-600 mt-1">{petFieldErrors.name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Είδος *</label>
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Dog">Σκύλος</option>
                <option value="Cat">Γάτα</option>
                <option value="Other">Άλλο</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Φύλο</label>
              <select
                value={form.gender}
                onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-</option>
                <option value="Male">Αρσενικό</option>
                <option value="Female">Θηλυκό</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Ράτσα</label>
            <input
              type="text"
              maxLength={100}
              value={form.breed}
              onChange={e => setForm(f => ({ ...f, breed: e.target.value }))}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Ηλικία</label>
              <input
                type="number"
                min={0}
                value={form.age}
                onChange={e => setForm(f => ({ ...f, age: e.target.value }))}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Βάρος (kg)</label>
              <input
                type="number"
                min={0}
                step={0.1}
                value={form.weight}
                onChange={e => setForm(f => ({ ...f, weight: e.target.value }))}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Σημειώσεις</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={2}
              maxLength={2000}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
            {form.notes.length > 1800 && (
              <p className="text-xs text-slate-400 mt-1 text-right">{form.notes.length}/2000</p>
            )}
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors">
              Ακύρωση
            </button>
            <button type="submit" disabled={submitting || !form.name.trim() || Object.keys(petFieldErrors).length > 0} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {submitting ? 'Αποθήκευση...' : 'Αποθήκευση'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Invite Dialog ---
function InviteDialog({
  inviteUrl,
  expiresAt,
  onClose,
}: {
  inviteUrl: string;
  expiresAt: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="text-center mb-4">
          <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-7 h-7 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-900">Σύνδεσμος Πρόσκλησης</h3>
          <p className="text-sm text-slate-500 mt-1">
            Μοιραστείτε αυτόν τον σύνδεσμο με τον πελάτη σας
          </p>
        </div>
        <div className="bg-slate-50 rounded-xl p-3 mb-3">
          <p className="text-sm text-slate-700 break-all font-mono">{inviteUrl}</p>
        </div>
        <p className="text-xs text-slate-400 text-center mb-4">
          Λήγει: {new Date(expiresAt).toLocaleDateString('el-GR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors">
            Κλείσιμο
          </button>
          <button
            onClick={handleCopy}
            className={`flex-1 py-2.5 rounded-xl font-bold transition-colors ${
              copied
                ? 'bg-green-600 text-white'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {copied ? 'Αντιγράφηκε!' : 'Αντιγραφή'}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Delete Confirmation ---
function DeleteConfirmDialog({
  title,
  message,
  onConfirm,
  onClose,
}: {
  title: string;
  message: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    await onConfirm();
    setDeleting(false);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-7 h-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">{title}</h3>
        <p className="text-sm text-slate-500 mb-5">{message}</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors">
            Ακύρωση
          </button>
          <button
            onClick={handleConfirm}
            disabled={deleting}
            className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {deleting ? 'Διαγραφή...' : 'Διαγραφή'}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Main Page ---
export default function VetClientsPage() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  // Dialogs
  const [showAddClient, setShowAddClient] = useState(false);
  const [editingClient, setEditingClient] = useState<VetClient | null>(null);
  const [showAddPet, setShowAddPet] = useState(false);
  const [editingPet, setEditingPet] = useState<VetClientPet | null>(null);
  const [inviteData, setInviteData] = useState<{ invite_url: string; expires_at: string } | null>(null);
  const [historyPetId, setHistoryPetId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'client' | 'pet'; id: string; petId?: string; name: string } | null>(null);
  const [showReminderPetId, setShowReminderPetId] = useState<string | null>(null);
  const [reminderForm, setReminderForm] = useState({ type: 'checkup', title: '', message: '', due_date: '', reminder_days_before: 14 });
  const [reminderSubmitting, setReminderSubmitting] = useState(false);
  const [reminderError, setReminderError] = useState('');

  // Debounce search
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (timer) clearTimeout(timer);
    setTimer(setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 300));
  };

  const { clients, totalPages, loading, error, refetch } = useVetClients(page, 10, debouncedSearch || undefined);
  const { client: selectedClient, loading: clientLoading, refetch: refetchClient } = useVetClient(selectedClientId);
  const { events: historyEvents, loading: historyLoading } = usePatientHistory(historyPetId);

  // Reset history when switching clients
  useEffect(() => {
    setHistoryPetId(null);
  }, [selectedClientId]);

  const handleClientSaved = () => {
    setShowAddClient(false);
    setEditingClient(null);
    refetch();
    if (selectedClientId) refetchClient();
  };

  const handlePetSaved = () => {
    setShowAddPet(false);
    setEditingPet(null);
    refetchClient();
    refetch();
  };

  const handleGenerateInvite = async (clientId: string) => {
    try {
      const data = await generateClientInvite(clientId);
      setInviteData(data);
      refetchClient();
      refetch();
    } catch {
      // silent
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'client') {
        await deleteVetClient(deleteTarget.id);
        setSelectedClientId(null);
        refetch();
      } else if (deleteTarget.type === 'pet' && selectedClientId) {
        await deleteClientPet(selectedClientId, deleteTarget.id);
        refetchClient();
        refetch();
      }
    } catch {
      // silent
    }
    setDeleteTarget(null);
  };

  const handleCreateReminder = async (petId: string) => {
    if (!reminderForm.title.trim() || !reminderForm.due_date) {
      setReminderError('Συμπληρώστε τα υποχρεωτικά πεδία.');
      return;
    }
    setReminderSubmitting(true);
    setReminderError('');
    try {
      await createReminder({
        pet_id: petId,
        type: reminderForm.type,
        title: reminderForm.title,
        message: reminderForm.message || undefined,
        due_date: reminderForm.due_date,
        reminder_days_before: reminderForm.reminder_days_before,
      });
      setShowReminderPetId(null);
      setReminderForm({ type: 'checkup', title: '', message: '', due_date: '', reminder_days_before: 14 });
    } catch (err) {
      setReminderError(err instanceof Error ? err.message : 'Σφάλμα κατά την αποθήκευση.');
    } finally {
      setReminderSubmitting(false);
    }
  };

  if (loading && clients.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <Link href="/vet/dashboard" className="text-slate-500 text-sm font-bold mb-2 hover:text-indigo-600 block">
            &larr; Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">Κάτοχοι Κατοικιδίων</h1>
        </div>
        <button
          onClick={() => setShowAddClient(true)}
          className="px-5 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Προσθήκη Κατόχου
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6">
        <div className="relative">
          <svg className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Αναζήτηση με όνομα, email ή τηλέφωνο..."
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            value={searchTerm}
            onChange={e => handleSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100">
                <th className="p-5 font-bold">Πελάτης</th>
                <th className="p-5 font-bold">Email</th>
                <th className="p-5 font-bold">Τηλέφωνο</th>
                <th className="p-5 font-bold">Κατάσταση</th>
                <th className="p-5 font-bold text-center">Κατοικίδια</th>
                <th className="p-5 font-bold text-right">Ενέργειες</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {clients.map(client => {
                const st = statusConfig[client.status] || statusConfig.managed;
                return (
                  <tr
                    key={client.id}
                    onClick={() => setSelectedClientId(client.id)}
                    className={`border-b border-slate-50 last:border-0 hover:bg-indigo-50/30 cursor-pointer transition-colors ${
                      selectedClientId === client.id ? 'bg-indigo-50' : ''
                    }`}
                  >
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-indigo-600 font-bold">{client.name.charAt(0)}</span>
                        </div>
                        <span className="font-bold text-slate-900">{client.name}</span>
                      </div>
                    </td>
                    <td className="p-5 text-slate-600">{client.email || '-'}</td>
                    <td className="p-5 text-slate-600">{client.phone || '-'}</td>
                    <td className="p-5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${st.bg}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="p-5 text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
                        {client.pet_count}
                      </span>
                    </td>
                    <td className="p-5 text-right">
                      <button className="text-indigo-600 hover:bg-indigo-100 p-2 rounded-lg transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {clients.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Δεν υπάρχουν πελάτες</h3>
            <p className="text-slate-500">Προσθέστε τον πρώτο σας πελάτη για να ξεκινήσετε.</p>
          </div>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Side Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto ${
          selectedClientId ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {selectedClientId && (
          <div className="min-h-screen flex flex-col">
            {/* Panel Header */}
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-5">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setSelectedClientId(null)}
                  className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/40 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                {selectedClient && (
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    statusConfig[selectedClient.status]?.bg || 'bg-slate-100 text-slate-600'
                  }`}>
                    {statusConfig[selectedClient.status]?.label || selectedClient.status}
                  </span>
                )}
              </div>
              {clientLoading ? (
                <div className="animate-pulse h-8 w-40 bg-white/30 rounded" />
              ) : selectedClient ? (
                <>
                  <h2 className="text-2xl font-bold text-white">{selectedClient.name}</h2>
                  {selectedClient.email && (
                    <p className="text-white/80 text-sm mt-1">{selectedClient.email}</p>
                  )}
                </>
              ) : null}
            </div>

            {clientLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
              </div>
            ) : selectedClient ? (
              <div className="p-5 space-y-5 flex-1">
                {/* Contact Info */}
                <div className="space-y-2">
                  {selectedClient.phone && (
                    <div className="flex items-center gap-3 text-sm">
                      <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span className="text-slate-700">{selectedClient.phone}</span>
                    </div>
                  )}
                  {selectedClient.address && (
                    <div className="flex items-center gap-3 text-sm">
                      <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-slate-700">{selectedClient.address}</span>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {selectedClient.notes && (
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Σημειώσεις</h3>
                    <p className="text-sm text-slate-700">{selectedClient.notes}</p>
                  </div>
                )}

                {/* Pets */}
                {selectedClient.status === 'linked' && selectedClient.linked_pets?.length > 0 ? (
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm mb-3">
                      Κατοικίδια ({selectedClient.linked_pets.length})
                    </h3>
                    <div className="space-y-2">
                      {selectedClient.linked_pets.map(pet => (
                        <div key={pet.id} className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm">
                          <div className="flex items-center gap-3">
                            {pet.image_url ? (
                              <img src={pet.image_url} alt={pet.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                            ) : (
                              <span className="text-lg flex-shrink-0">{pet.type === 'DOG' ? '🐕' : pet.type === 'CAT' ? '🐈' : '🐾'}</span>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-slate-800 text-sm">{pet.name}</p>
                              <p className="text-xs text-slate-500">
                                {petTypeLabels[pet.type] || pet.type}
                                {pet.breed ? ` · ${pet.breed}` : ''}
                                {pet.age != null ? ` · ${pet.age} ετών` : ''}
                                {pet.weight != null ? ` · ${pet.weight}kg` : ''}
                                {pet.gender ? ` · ${genderLabels[pet.gender] || pet.gender}` : ''}
                              </p>
                              {pet.chip_number && (
                                <p className="text-xs text-slate-400 mt-0.5">Microchip: {pet.chip_number}</p>
                              )}
                            </div>
                          </div>
                          {/* History toggle */}
                          <div className="mt-2 flex gap-2 flex-wrap">
                            <button
                              onClick={() => setHistoryPetId(historyPetId === pet.id ? null : pet.id)}
                              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                              Ιστορικό
                            </button>
                            <button
                              onClick={() => { setShowReminderPetId(showReminderPetId === pet.id ? null : pet.id); setReminderError(''); }}
                              className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Υπενθύμιση
                            </button>
                          </div>
                          {/* Create Reminder inline form */}
                          {showReminderPetId === pet.id && (
                            <div className="mt-3 border-t border-slate-100 pt-3 space-y-2">
                              <p className="text-xs font-bold text-slate-700">Νέα Υπενθύμιση</p>
                              {reminderError && (
                                <p className="text-xs text-red-600">{reminderError}</p>
                              )}
                              <select
                                value={reminderForm.type}
                                onChange={e => setReminderForm(f => ({ ...f, type: e.target.value }))}
                                className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-300"
                              >
                                <option value="vaccination">Εμβολιασμός</option>
                                <option value="checkup">Έλεγχος</option>
                                <option value="medication">Φαρμακευτική Αγωγή</option>
                                <option value="custom">Γενικό</option>
                              </select>
                              <input
                                type="text"
                                placeholder="Τίτλος *"
                                value={reminderForm.title}
                                onChange={e => setReminderForm(f => ({ ...f, title: e.target.value }))}
                                className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-300"
                              />
                              <DatePicker
                                value={reminderForm.due_date}
                                onChange={(v) => setReminderForm(f => ({ ...f, due_date: v }))}
                                placeholder="Ημερομηνία"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setShowReminderPetId(null)}
                                  className="flex-1 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
                                >
                                  Ακύρωση
                                </button>
                                <button
                                  onClick={() => handleCreateReminder(pet.id)}
                                  disabled={reminderSubmitting}
                                  className="flex-1 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                                >
                                  {reminderSubmitting ? '...' : 'Αποθήκευση'}
                                </button>
                              </div>
                            </div>
                          )}
                          {/* Medical History */}
                          {historyPetId === pet.id && (
                            <div className="mt-3 border-t border-slate-100 pt-3">
                              {historyLoading ? (
                                <div className="flex justify-center py-3">
                                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600" />
                                </div>
                              ) : historyEvents.length > 0 ? (
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                  {historyEvents.map(event => (
                                    <div key={event.id} className="bg-slate-50 rounded-lg p-2.5">
                                      <div className="flex items-center justify-between">
                                        <p className="font-bold text-slate-700 text-xs">{event.title}</p>
                                        <span className="text-[10px] text-slate-400">
                                          {new Date(event.date).toLocaleDateString('el-GR')}
                                        </span>
                                      </div>
                                      <span className="inline-block mt-1 px-1.5 py-0.5 bg-indigo-100 text-indigo-600 rounded text-[10px] font-bold">
                                        {event.event_type}
                                      </span>
                                      {event.notes && (
                                        <p className="text-xs text-slate-500 mt-1">{event.notes}</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-slate-400 italic text-center py-2">Δεν υπάρχει ιστορικό.</p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-slate-800 text-sm">Κατοικίδια ({selectedClient.pets.length})</h3>
                      <button
                        onClick={() => { setEditingPet(null); setShowAddPet(true); }}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Προσθήκη
                      </button>
                    </div>
                    {selectedClient.pets.length > 0 ? (
                      <div className="space-y-2">
                        {selectedClient.pets.map(pet => (
                          <div key={pet.id} className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{pet.type === 'Dog' ? '🐕' : pet.type === 'Cat' ? '🐈' : '🐾'}</span>
                                <div>
                                  <p className="font-bold text-slate-800 text-sm">{pet.name}</p>
                                  <p className="text-xs text-slate-500">
                                    {petTypeLabels[pet.type] || pet.type}
                                    {pet.breed ? ` · ${pet.breed}` : ''}
                                    {pet.age != null ? ` · ${pet.age} ετών` : ''}
                                    {pet.weight != null ? ` · ${pet.weight}kg` : ''}
                                    {pet.gender ? ` · ${genderLabels[pet.gender] || pet.gender}` : ''}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={(e) => { e.stopPropagation(); setEditingPet(pet); setShowAddPet(true); }}
                                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setDeleteTarget({ type: 'pet', id: pet.id, name: pet.name }); }}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                            {pet.notes && (
                              <p className="text-xs text-slate-500 mt-2 bg-slate-50 rounded-lg p-2">{pet.notes}</p>
                            )}
                            <div className="mt-2">
                              <button
                                onClick={(e) => { e.stopPropagation(); setShowReminderPetId(showReminderPetId === pet.id ? null : pet.id); setReminderError(''); }}
                                className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Δημιουργία Υπενθύμισης
                              </button>
                            </div>
                            {showReminderPetId === pet.id && (
                              <div className="mt-3 border-t border-slate-100 pt-3 space-y-2">
                                <p className="text-xs font-bold text-slate-700">Νέα Υπενθύμιση</p>
                                {reminderError && <p className="text-xs text-red-600">{reminderError}</p>}
                                <select
                                  value={reminderForm.type}
                                  onChange={e => setReminderForm(f => ({ ...f, type: e.target.value }))}
                                  className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-300"
                                >
                                  <option value="vaccination">Εμβολιασμός</option>
                                  <option value="checkup">Έλεγχος</option>
                                  <option value="medication">Φαρμακευτική Αγωγή</option>
                                  <option value="custom">Γενικό</option>
                                </select>
                                <input
                                  type="text"
                                  placeholder="Τίτλος *"
                                  value={reminderForm.title}
                                  onChange={e => setReminderForm(f => ({ ...f, title: e.target.value }))}
                                  className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-300"
                                />
                                <DatePicker
                                  value={reminderForm.due_date}
                                  onChange={(v) => setReminderForm(f => ({ ...f, due_date: v }))}
                                  placeholder="Ημερομηνία"
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => setShowReminderPetId(null)}
                                    className="flex-1 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
                                  >
                                    Ακύρωση
                                  </button>
                                  <button
                                    onClick={() => handleCreateReminder(pet.id)}
                                    disabled={reminderSubmitting}
                                    className="flex-1 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                                  >
                                    {reminderSubmitting ? '...' : 'Αποθήκευση'}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400 italic">Δεν έχουν καταχωρηθεί κατοικίδια.</p>
                    )}
                  </div>
                )}
              </div>
            ) : null}

            {/* Panel Footer Actions */}
            {selectedClient && (
              <div className="p-5 border-t border-slate-100 bg-slate-50 mt-auto space-y-2">
                {selectedClient.status !== 'linked' && (
                  <button
                    onClick={() => handleGenerateInvite(selectedClient.id)}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Πρόσκληση στο Vetly
                  </button>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingClient(selectedClient)}
                    className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-100 transition-colors text-sm"
                  >
                    Επεξεργασία
                  </button>
                  <button
                    onClick={() => setDeleteTarget({ type: 'client', id: selectedClient.id, name: selectedClient.name })}
                    className="flex-1 py-2.5 border border-red-200 text-red-600 rounded-xl font-bold hover:bg-red-50 transition-colors text-sm"
                  >
                    Διαγραφή
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Overlay */}
      {selectedClientId && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setSelectedClientId(null)}
        />
      )}

      {/* Dialogs */}
      {(showAddClient || editingClient) && (
        <ClientDialog
          client={editingClient}
          onClose={() => { setShowAddClient(false); setEditingClient(null); }}
          onSaved={handleClientSaved}
        />
      )}

      {showAddPet && selectedClientId && (
        <PetDialog
          clientId={selectedClientId}
          pet={editingPet}
          onClose={() => { setShowAddPet(false); setEditingPet(null); }}
          onSaved={handlePetSaved}
        />
      )}

      {inviteData && (
        <InviteDialog
          inviteUrl={inviteData.invite_url}
          expiresAt={inviteData.expires_at}
          onClose={() => setInviteData(null)}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmDialog
          title={deleteTarget.type === 'client' ? 'Διαγραφή Πελάτη' : 'Διαγραφή Κατοικιδίου'}
          message={`Είστε σίγουροι ότι θέλετε να διαγράψετε "${deleteTarget.name}";`}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
