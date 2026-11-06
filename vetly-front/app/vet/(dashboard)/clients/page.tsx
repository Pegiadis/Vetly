'use client';


import ClinicDrawer from '@/components/vet/ClinicDrawer';
import { ClinicButton, ClinicInput, ClinicPanel, ClinicSelect, ClinicTextarea, ClinicTable, ClinicTableHead, ClinicTableCell } from '@/components/vet/ClinicUI';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import ClinicAvatar from '@/components/vet/ClinicAvatar';
import {
  useVetClients,
  useVetClient,
  createVetClient,
  updateVetClient,
  deleteVetClient,
  generateClientInvite,
  resendClientInvite,
  addClientPet,
  updateClientPet,
  deleteClientPet,
  usePatientHistory,
  createReminder,
  getCustomReminderTypes,
  updateCustomReminderTypes,
  type VetClient,
  type VetClientPet,
  type VetClientListItem,
  type LinkedPet,
} from '@/hooks/useVetData';
import DatePicker from '@/components/DatePicker';
import { getImageUrl } from '@/lib/api';

const statusConfig: Record<string, { label: string; bg: string }> = {
  managed: { label: 'Χωρίς λογαριασμό', bg: 'bg-ink-100 text-ink-600' },
  invited: { label: 'Προσκλήθηκε', bg: 'bg-amber-100 text-amber-700' },
  linked: { label: 'Συνδεδεμένος', bg: 'bg-green-100 text-green-700' },
};

const petTypeLabels: Record<string, string> = { Dog: 'Σκύλος', Cat: 'Γάτα', Other: 'Άλλο' };
const genderLabels: Record<string, string> = { Male: 'Αρσενικό', Female: 'Θηλυκό' };

// --- Add Client Dialog ---
function ClientDialog({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleBlur = (field: string) => setTouched(prev => ({ ...prev, [field]: true }));

  const fieldErrors: Record<string, string> = {};
  if (form.name.length > 0 && form.name.trim().length < 2) fieldErrors.name = 'Τουλάχιστον 2 χαρακτήρες.';

  const inputErr = (field: string) => touched[field] && fieldErrors[field] ? 'border-red-300 bg-red-50/30' : 'border-ink-200';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await createVetClient({
        name: form.name.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        address: form.address.trim() || undefined,
        notes: form.notes.trim() || undefined,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Αποτυχία αποθήκευσης');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <div className="bg-white rounded-xl border border-ink-200 shadow-xs w-full">
        <div className="border-b border-ink-200 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink-900">
              Νέος Κηδεμόνας
            </h2>
            <ClinicButton variant="secondary" onClick={onClose} aria-label="Κλείσιμο φόρμας" className="">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </ClinicButton>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-1">Ονοματεπώνυμο *</label>
            <input
              type="text"
              required
              maxLength={255}
              value={form.name}
              onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setTouched(t => ({ ...t, name: true })); }}
              onBlur={() => handleBlur('name')}
              className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-clinic-500 ${inputErr('name')}`}
              placeholder="π.χ. Μαρία Παπαδοπούλου"
            />
            {touched.name && fieldErrors.name && <p className="text-xs text-red-600 mt-1">{fieldErrors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-1">Email</label>
            <ClinicInput
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full px-3 py-2.5"
              placeholder="maria@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-1">Τηλέφωνο</label>
            <ClinicInput
              type="tel"
              maxLength={50}
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="w-full px-3 py-2.5"
              placeholder="69xxxxxxxx"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-1">Διεύθυνση</label>
            <ClinicInput
              type="text"
              maxLength={500}
              value={form.address}
              onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              className="w-full px-3 py-2.5"
              placeholder="Οδός, Πόλη"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-1">Σημειώσεις</label>
            <ClinicTextarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={2}
              maxLength={2000}
              className="w-full px-3 py-2.5 resize-none"
              placeholder="Προσθέστε σημειώσεις..."
            />
            {form.notes.length > 1800 && (
              <p className="text-xs text-ink-400 mt-1 text-right">{form.notes.length}/2000</p>
            )}
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
          )}
          <div className="flex gap-3 pt-2">
            <ClinicButton variant="secondary" type="button" onClick={onClose} className="flex-1">
              Ακύρωση
            </ClinicButton>
            <ClinicButton variant="primary" type="submit" disabled={submitting || !form.name.trim() || Object.keys(fieldErrors).length > 0} className="flex-1 disabled:opacity-50">
              {submitting ? 'Αποθήκευση...' : 'Αποθήκευση'}
            </ClinicButton>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Edit Client Dialog ---
function EditClientDialog({
  client,
  onClose,
  onSaved,
}: {
  client: VetClient;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: client.name,
    email: client.email || '',
    phone: client.phone || '',
    address: client.address || '',
    notes: client.notes || '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleBlur = (field: string) => setTouched(prev => ({ ...prev, [field]: true }));

  const fieldErrors: Record<string, string> = {};
  if (form.name.length > 0 && form.name.trim().length < 2) fieldErrors.name = 'Τουλάχιστον 2 χαρακτήρες.';

  const inputErr = (field: string) => touched[field] && fieldErrors[field] ? 'border-red-300 bg-red-50/30' : 'border-ink-200';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await updateVetClient(client.id, {
        name: form.name.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        address: form.address.trim() || undefined,
        notes: form.notes.trim() || undefined,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Αποτυχία αποθήκευσης');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <div className="bg-white rounded-xl border border-ink-200 shadow-xs w-full">
        <div className="border-b border-ink-200 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink-900">
              Επεξεργασία Κηδεμόνα
            </h2>
            <ClinicButton variant="secondary" onClick={onClose} aria-label="Κλείσιμο φόρμας" className="">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </ClinicButton>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-1">Ονοματεπώνυμο *</label>
            <input
              type="text"
              required
              maxLength={255}
              value={form.name}
              onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setTouched(t => ({ ...t, name: true })); }}
              onBlur={() => handleBlur('name')}
              className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-clinic-500 ${inputErr('name')}`}
            />
            {touched.name && fieldErrors.name && <p className="text-xs text-red-600 mt-1">{fieldErrors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-1">Email</label>
            <ClinicInput
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full px-3 py-2.5"
              placeholder="maria@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-1">Τηλέφωνο</label>
            <ClinicInput
              type="tel"
              maxLength={50}
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="w-full px-3 py-2.5"
              placeholder="69xxxxxxxx"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-1">Διεύθυνση</label>
            <ClinicInput
              type="text"
              maxLength={500}
              value={form.address}
              onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              className="w-full px-3 py-2.5"
              placeholder="Οδός, Πόλη"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-1">Σημειώσεις</label>
            <ClinicTextarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={2}
              maxLength={2000}
              className="w-full px-3 py-2.5 resize-none"
              placeholder="Προσθέστε σημειώσεις..."
            />
            {form.notes.length > 1800 && (
              <p className="text-xs text-ink-400 mt-1 text-right">{form.notes.length}/2000</p>
            )}
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
          )}
          <div className="flex gap-3 pt-2">
            <ClinicButton variant="secondary" type="button" onClick={onClose} className="flex-1">
              Ακύρωση
            </ClinicButton>
            <ClinicButton variant="primary" type="submit" disabled={submitting || !form.name.trim() || Object.keys(fieldErrors).length > 0} className="flex-1 disabled:opacity-50">
              {submitting ? 'Αποθήκευση...' : 'Αποθήκευση'}
            </ClinicButton>
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

  const petInputErr = (field: string) => petTouched[field] && petFieldErrors[field] ? 'border-red-300 bg-red-50/30' : 'border-ink-200';

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
    <div className="w-full">
      <div className="bg-white rounded-xl border border-ink-200 shadow-xs w-full">
        <div className="border-b border-ink-200 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink-900">
              {pet ? 'Επεξεργασία Κατοικιδίου' : 'Νέο Κατοικίδιο'}
            </h2>
            <ClinicButton variant="secondary" onClick={onClose} aria-label="Κλείσιμο φόρμας" className="">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </ClinicButton>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-1">Όνομα *</label>
            <input
              type="text"
              required
              maxLength={30}
              value={form.name}
              onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setPetTouched(t => ({ ...t, name: true })); }}
              onBlur={() => handlePetBlur('name')}
              className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-clinic-500 ${petInputErr('name')}`}
            />
            {petTouched.name && petFieldErrors.name && <p className="text-xs text-red-600 mt-1">{petFieldErrors.name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-1">Είδος *</label>
              <ClinicSelect
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full px-3 py-2.5"
              >
                <option value="Dog">Σκύλος</option>
                <option value="Cat">Γάτα</option>
                <option value="Other">Άλλο</option>
              </ClinicSelect>
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-1">Φύλο</label>
              <ClinicSelect
                value={form.gender}
                onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                className="w-full px-3 py-2.5"
              >
                <option value="">-</option>
                <option value="Male">Αρσενικό</option>
                <option value="Female">Θηλυκό</option>
              </ClinicSelect>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-1">Ράτσα</label>
            <ClinicInput
              type="text"
              maxLength={100}
              value={form.breed}
              onChange={e => setForm(f => ({ ...f, breed: e.target.value }))}
              className="w-full px-3 py-2.5"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-1">Ηλικία</label>
              <ClinicInput
                type="number"
                min={0}
                value={form.age}
                onChange={e => setForm(f => ({ ...f, age: e.target.value }))}
                className="w-full px-3 py-2.5"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-1">Βάρος (kg)</label>
              <ClinicInput
                type="number"
                min={0}
                step={0.1}
                value={form.weight}
                onChange={e => setForm(f => ({ ...f, weight: e.target.value }))}
                className="w-full px-3 py-2.5"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-1">Σημειώσεις</label>
            <ClinicTextarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={2}
              maxLength={2000}
              className="w-full px-3 py-2.5 resize-none"
            />
            {form.notes.length > 1800 && (
              <p className="text-xs text-ink-400 mt-1 text-right">{form.notes.length}/2000</p>
            )}
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
          )}
          <div className="flex gap-3 pt-2">
            <ClinicButton variant="secondary" type="button" onClick={onClose} className="flex-1">
              Ακύρωση
            </ClinicButton>
            <ClinicButton variant="primary" type="submit" disabled={submitting || !form.name.trim() || Object.keys(petFieldErrors).length > 0} className="flex-1 disabled:opacity-50">
              {submitting ? 'Αποθήκευση...' : 'Αποθήκευση'}
            </ClinicButton>
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
    <div className="w-full">
      <div className="bg-white rounded-xl border border-ink-200 shadow-xs w-full p-6">
        <div className="text-center mb-4">
          <div className="w-14 h-14 bg-clinic-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-7 h-7 text-clinic-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-ink-900">Σύνδεσμος Πρόσκλησης</h3>
          <p className="text-sm text-ink-500 mt-1">
            Μοιραστείτε αυτόν τον σύνδεσμο με τον πελάτη σας
          </p>
        </div>
        <div className="bg-ink-50 rounded-xl p-3 mb-3">
          <p className="text-sm text-ink-700 break-all font-mono">{inviteUrl}</p>
        </div>
        <p className="text-xs text-ink-400 text-center mb-4">
          Λήγει: {new Date(expiresAt).toLocaleDateString('el-GR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
        <div className="flex gap-3">
          <ClinicButton variant="secondary" onClick={onClose} className="flex-1">
            Κλείσιμο
          </ClinicButton>
          <button
            onClick={handleCopy}
            className={`flex-1 py-2.5 rounded-xl font-semibold transition-colors ${
              copied
                ? 'bg-green-600 text-white'
                : 'bg-clinic-600 text-white hover:bg-clinic-700'
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
    <ClinicDrawer label={title} narrow busy={deleting} onClose={onClose}>
      <div className="relative min-h-full bg-white w-full p-5 text-left shadow-xl">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-7 h-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-ink-900 mb-1">{title}</h3>
        <p className="text-sm text-ink-500 mb-5">{message}</p>
        <div className="flex gap-3">
          <ClinicButton variant="secondary" onClick={onClose} disabled={deleting} className="flex-1">
            Ακύρωση
          </ClinicButton>
          <ClinicButton variant="secondary"
            onClick={handleConfirm}
            disabled={deleting}
            className="flex-1 disabled:opacity-50"
          >
            {deleting ? 'Διαγραφή...' : 'Διαγραφή'}
          </ClinicButton>
        </div>
      </div>
    </ClinicDrawer>
  );
}

// --- Main Page ---
export default function VetClientsPage() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const search = new URLSearchParams(window.location.search).get('search');
    if (search) {
      setSearchTerm(search);
      setDebouncedSearch(search);
    }
  }, []);
  const [selectedClientId, setClientId] = useState<string | null>(null);
  const setSelectedClientId = (id: string | null) => {
    setClientId(id); setShowAddClient(false); setShowEditClient(false); setShowAddPet(false); setEditingPet(null); setInviteData(null); setShowReminderPetId(null); setReminderError('');
  };

  // Dialogs
  const [showAddClient, setShowAddClient] = useState(false);
  const [showEditClient, setShowEditClient] = useState(false);
  const [showAddPet, setShowAddPet] = useState(false);
  const [editingPet, setEditingPet] = useState<VetClientPet | null>(null);
  const [inviteData, setInviteData] = useState<{ invite_url: string; expires_at: string } | null>(null);
  const [historyPetId, setHistoryPetId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'pet' | 'client'; id: string; name: string } | null>(null);
  const [showReminderPetId, setShowReminderPetId] = useState<string | null>(null);
  const [reminderForm, setReminderForm] = useState({ type: 'checkup', title: '', message: '', due_date: '', reminder_days_before: 14 });
  const [reminderSubmitting, setReminderSubmitting] = useState(false);
  const [reminderError, setReminderError] = useState('');
  const [reminderSuccess, setReminderSuccess] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const panelOpen = !!selectedClientId || showAddClient;
  const formOpen = showAddClient || showEditClient || showAddPet || !!inviteData;
  useEffect(() => {
    if (panelOpen) {
      panelRef.current?.focus({ preventScroll: true });
      panelRef.current?.scrollTo({ top: 0 });
      if (window.innerWidth < 1280) panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [panelOpen, selectedClientId, showAddClient, showEditClient, showAddPet, inviteData]);

  // Custom reminder types
  const [customReminderTypes, setCustomReminderTypes] = useState<string[]>([]);
  const [reminderTypeDropdownOpen, setReminderTypeDropdownOpen] = useState(false);
  const [showAddReminderType, setShowAddReminderType] = useState(false);
  const [newReminderTypeName, setNewReminderTypeName] = useState('');
  const reminderTypeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getCustomReminderTypes().then(setCustomReminderTypes).catch(() => {});
  }, []);

  useEffect(() => {
    function handleReminderTypeClickOutside(e: MouseEvent) {
      if (reminderTypeDropdownRef.current && !reminderTypeDropdownRef.current.contains(e.target as Node)) {
        setReminderTypeDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleReminderTypeClickOutside);
    return () => document.removeEventListener('mousedown', handleReminderTypeClickOutside);
  }, []);

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

  const { clients, total, totalPages, loading, error, refetch } = useVetClients(page, 10, debouncedSearch || undefined);
  const { client: loadedClient, loading: clientLoading, error: clientError, refetch: refetchClient } = useVetClient(selectedClientId);
  const selectedClient = loadedClient?.id === selectedClientId ? loadedClient : null;
  const { events: historyEvents, loading: historyLoading } = usePatientHistory(historyPetId);

  // Reset history when switching clients
  useEffect(() => {
    setHistoryPetId(null);
  }, [selectedClientId]);

  const handleClientSaved = () => {
    setShowAddClient(false);
    setShowEditClient(false);
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
      alert('Κάτι πήγε στραβά. Παρακαλώ δοκιμάστε ξανά.');
    }
  };

  const handleResendInvite = async (clientId: string) => {
    try {
      const data = await resendClientInvite(clientId);
      setInviteData(data);
      refetchClient();
      refetch();
    } catch {
      alert('Κάτι πήγε στραβά. Παρακαλώ δοκιμάστε ξανά.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'client') {
        await deleteVetClient(deleteTarget.id);
        setSelectedClientId(null);
      } else if (selectedClientId) {
        await deleteClientPet(selectedClientId, deleteTarget.id);
        refetchClient();
      }
      refetch();
    } catch {
      alert('Κάτι πήγε στραβά. Παρακαλώ δοκιμάστε ξανά.');
    }
    setDeleteTarget(null);
  };

  const handleCreateReminder = async (petId: string) => {
    if (!reminderForm.due_date) {
      setReminderError('Επιλέξτε ημερομηνία.');
      return;
    }
    setReminderSubmitting(true);
    setReminderError('');
    try {
      await createReminder({
        pet_id: petId,
        type: reminderForm.type,
        title: reminderForm.title || undefined,
        message: reminderForm.message || undefined,
        due_date: reminderForm.due_date,
        reminder_days_before: reminderForm.reminder_days_before,
      });
      setShowReminderPetId(null);
      setReminderForm({ type: 'checkup', title: '', message: '', due_date: '', reminder_days_before: 14 });
      setReminderSuccess(true);
      setTimeout(() => setReminderSuccess(false), 3000);
    } catch (err) {
      setReminderError(err instanceof Error ? err.message : 'Σφάλμα κατά την αποθήκευση.');
    } finally {
      setReminderSubmitting(false);
    }
  };

  if (loading && clients.length === 0) {
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
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto relative">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-ink-900">
          <svg aria-hidden="true" className="h-5 w-5 text-ink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2m20 0v-2a4 4 0 00-3-3.87M9 11a4 4 0 100-8 4 4 0 000 8zm8-7.87a4 4 0 010 7.75" /></svg>
          Κηδεμόνες
        </h1>
        <ClinicButton variant="primary" className="bg-ink-900! border-ink-900! hover:bg-ink-700!" onClick={() => { setSelectedClientId(null); setShowAddClient(true); }}>Προσθήκη Κηδεμόνα</ClinicButton>
      </header>

      <div className={`grid items-start gap-4 ${panelOpen ? 'xl:grid-cols-[minmax(0,1fr)_400px]' : ''}`}><div className="min-w-0 space-y-4">
        <ClinicPanel className="overflow-hidden">
          <div className="px-5 py-4">
            <p className="text-sm font-semibold text-ink-900" aria-live="polite">{total} {debouncedSearch ? 'αποτελέσματα αναζήτησης' : 'κηδεμόνες'}</p>
            <p className="mt-1 text-xs text-ink-500">{debouncedSearch ? `Για «${debouncedSearch}» στο μητρώο σας` : 'Το μητρώο κηδεμόνων του ιατρείου σας'}</p>
          </div>
          <div className="border-t border-ink-100 bg-ink-50/50 px-5 py-3 text-xs leading-5 text-ink-500">Επιλέξτε έναν κηδεμόνα για στοιχεία επικοινωνίας, κατοικίδια και ιστορικό φροντίδας.</div>
        </ClinicPanel>

        <ClinicPanel className="overflow-hidden" aria-busy={loading}>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-200 px-3 py-2.5">
            <span className="rounded-md bg-ink-100 px-3 py-1.5 text-xs font-semibold text-ink-800">{debouncedSearch ? 'Αναζήτηση' : 'Όλοι οι κηδεμόνες'}</span>
            {searchTerm && <button type="button" onClick={() => handleSearchChange('')} className="px-2 py-1 text-xs text-ink-600 underline underline-offset-2">Καθαρισμός</button>}
          </div>
          <div className="relative border-b border-ink-200 p-3">
            <svg aria-hidden="true" className="absolute left-6 top-5.5 h-4 w-4 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <ClinicInput aria-label="Αναζήτηση κηδεμόνων" type="search" placeholder="Αναζήτηση με όνομα, email ή τηλέφωνο..." className="w-full pl-9 text-xs!" value={searchTerm} onChange={e => handleSearchChange(e.target.value)} />
          </div>
          <ClinicTable className="table-fixed [&_th]:py-2! [&_td]:py-3! [&_th]:px-3! [&_td]:px-3!">
            <thead><tr>
              <ClinicTableHead className={panelOpen ? 'w-[58%] sm:w-[45%]' : 'w-[58%] sm:w-[30%]'}>Κηδεμόνας</ClinicTableHead>
              <ClinicTableHead className={panelOpen ? 'hidden' : 'hidden lg:table-cell'}>Email</ClinicTableHead>
              <ClinicTableHead className="hidden sm:table-cell">Τηλέφωνο</ClinicTableHead>
              <ClinicTableHead>Λογαριασμός</ClinicTableHead>
              <ClinicTableHead className="hidden w-20 text-right! sm:table-cell">Κατοικίδια</ClinicTableHead>
            </tr></thead>
            <tbody>
              {clients.map(client => {
                const st = statusConfig[client.status] || statusConfig.managed;
                return <tr key={client.id} onClick={() => setSelectedClientId(client.id)} className={`cursor-pointer ${selectedClientId === client.id ? 'bg-ink-100! shadow-[inset_3px_0_0_#303030]' : ''}`}>
                  <ClinicTableCell>
                    <div className="flex items-start gap-2"><ClinicAvatar name={client.name} imageUrl={client.image_url} /><div className="min-w-0"><button type="button" aria-label={`Στοιχεία: ${client.name}`} aria-expanded={selectedClientId === client.id} onClick={e => { e.stopPropagation(); setSelectedClientId(client.id); }} className="text-left text-[13px] font-semibold text-ink-900 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clinic-600">{client.name}</button>
                    <p className="mt-1 text-xs text-ink-500 sm:hidden">{client.phone || 'Χωρίς τηλέφωνο'} · {client.pet_count} κατοικίδια</p></div></div>
                  </ClinicTableCell>
                  <ClinicTableCell className={panelOpen ? 'hidden' : 'hidden break-all text-xs! lg:table-cell'}>{client.email || '—'}</ClinicTableCell>
                  <ClinicTableCell className="hidden text-xs! tabular-nums sm:table-cell">{client.phone || '—'}</ClinicTableCell>
                  <ClinicTableCell><span className={`inline-block rounded-md px-1.5 py-0.5 text-[11px] leading-4 ${st.bg}`}>{st.label}</span></ClinicTableCell>
                  <ClinicTableCell className="hidden text-right! text-xs! tabular-nums sm:table-cell">{client.pet_count}</ClinicTableCell>
                </tr>;
              })}
            </tbody>
          </ClinicTable>
          {clients.length === 0 && <div className="px-5 py-14 text-center"><h2 className="text-sm font-semibold text-ink-800">{debouncedSearch ? 'Δεν βρέθηκαν κηδεμόνες' : 'Το μητρώο σας είναι έτοιμο'}</h2><p className="mt-2 text-xs text-ink-500">{debouncedSearch ? 'Δοκιμάστε άλλο όνομα, email ή τηλέφωνο.' : 'Προσθέστε τον πρώτο κηδεμόνα και τα κατοικίδιά του.'}</p></div>}
          <footer className="flex items-center justify-between gap-2 border-t border-ink-200 bg-ink-50/50 px-3 py-2">
            <p className="text-xs text-ink-500">{total > 0 ? `${(page - 1) * 10 + 1}–${Math.min(page * 10, total)} από ${total}` : '0 κηδεμόνες'}</p>
            <div className="flex gap-1">
              <ClinicButton aria-label="Προηγούμενη σελίδα" disabled={page <= 1 || loading} onClick={() => setPage(page - 1)}>‹</ClinicButton>
              <ClinicButton aria-label="Επόμενη σελίδα" disabled={page >= totalPages || loading} onClick={() => setPage(page + 1)}>›</ClinicButton>
            </div>
          </footer>
        </ClinicPanel>
      </div>
      {panelOpen && <div ref={panelRef} tabIndex={-1} aria-label="Πάνελ κηδεμόνα" className="min-w-0 scroll-mt-20 outline-none xl:sticky xl:top-20 xl:max-h-[calc(100vh-6rem)] xl:overflow-y-auto">
      <div className={formOpen ? 'hidden' : 'overflow-hidden rounded-xl border border-ink-200 bg-white shadow-xs'}>
        {selectedClientId && (
          <div className="flex flex-col">
            {/* Panel Header */}
            <div className="border-b border-ink-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <ClinicButton variant="secondary"
                  onClick={() => setSelectedClientId(null)}
                  aria-label="Κλείσιμο στοιχείων κηδεμόνα"
                  className="backdrop-blur-md"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </ClinicButton>
                {selectedClient && (
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    statusConfig[selectedClient.status]?.bg || 'bg-ink-100 text-ink-600'
                  }`}>
                    {statusConfig[selectedClient.status]?.label || selectedClient.status}
                  </span>
                )}
              </div>
              {clientLoading ? (
                <div className="animate-pulse h-8 w-40 bg-white/30 rounded" />
              ) : selectedClient ? (
                <>
                  <div className="mb-3"><ClinicAvatar large name={selectedClient.name} imageUrl={clients.find(client => client.id === selectedClient.id)?.image_url} /></div><h2 className="text-xl font-semibold text-ink-900">{selectedClient.name}</h2>
                  {selectedClient.email && (
                    <p className="text-ink-500 text-sm mt-1 break-all">{selectedClient.email}</p>
                  )}
                </>
              ) : null}
            </div>

            {clientLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-clinic-600" />
              </div>
            ) : selectedClient ? (
              <div className="p-5 space-y-5 flex-1">
                {/* Contact Info */}
                <section className="space-y-2 border-b border-ink-200 pb-4">
                  <h3 className="text-sm font-semibold text-ink-900">Επικοινωνία</h3>
                  {selectedClient.email && <a href={`mailto:${selectedClient.email}`} className="block break-all text-sm text-clinic-700 hover:underline">{selectedClient.email}</a>}
                  {selectedClient.phone && (
                    <div className="flex items-center gap-3 text-sm">
                      <svg className="w-4 h-4 text-ink-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <a href={`tel:${selectedClient.phone}`} className="text-clinic-700 hover:underline">{selectedClient.phone}</a>
                    </div>
                  )}
                  {selectedClient.address && (
                    <div className="flex items-center gap-3 text-sm">
                      <svg className="w-4 h-4 text-ink-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-ink-700">{selectedClient.address}</span>
                    </div>
                  )}
                </section>

                {/* Notes */}
                {selectedClient.notes && (
                  <div className="border-b border-ink-200 pb-4">
                    <h3 className="text-sm font-semibold text-ink-900 mb-2">Σημειώσεις</h3>
                    <p className="text-sm text-ink-700">{selectedClient.notes}</p>
                  </div>
                )}

                {/* Success Banner */}
                {reminderSuccess && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2 animate-in fade-in duration-200">
                    <svg className="w-5 h-5 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm font-semibold text-green-700">Η υπενθύμιση δημιουργήθηκε και στάλθηκε στον ιδιοκτήτη!</p>
                  </div>
                )}

                {/* Pets */}
                {selectedClient.status === 'linked' && selectedClient.linked_pets?.length > 0 ? (
                  <div>
                    <h3 className="font-semibold text-ink-800 text-sm mb-3">
                      Κατοικίδια ({selectedClient.linked_pets.length})
                    </h3>
                    <div className="space-y-2">
                      {selectedClient.linked_pets.map(pet => (
                        <ClinicPanel key={pet.id} className="p-3">
                          <div className="flex items-center gap-3">
                            {pet.image_url ? (
                              <img src={getImageUrl(pet.image_url)} alt={pet.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                            ) : (
                              <span className="text-lg flex-shrink-0">{pet.type === 'DOG' ? '🐕' : pet.type === 'CAT' ? '🐈' : '🐾'}</span>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-ink-800 text-sm">{pet.name}</p>
                              <p className="text-xs text-ink-500">
                                {petTypeLabels[pet.type] || pet.type}
                                {pet.breed ? ` · ${pet.breed}` : ''}
                                {pet.age != null ? ` · ${pet.age} ετών` : ''}
                                {pet.weight != null ? ` · ${pet.weight}kg` : ''}
                                {pet.gender ? ` · ${genderLabels[pet.gender] || pet.gender}` : ''}
                              </p>
                              {pet.chip_number && (
                                <p className="text-xs text-ink-400 mt-0.5">Microchip: {pet.chip_number}</p>
                              )}
                            </div>
                          </div>
                          {/* History toggle */}
                          <div className="mt-2 flex gap-2 flex-wrap">
                            <ClinicButton variant="ghost"
                              onClick={() => setHistoryPetId(historyPetId === pet.id ? null : pet.id)}
                              className=""
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                              Ιστορικό
                            </ClinicButton>
                            <ClinicButton variant="ghost"
                              onClick={() => { setShowReminderPetId(showReminderPetId === pet.id ? null : pet.id); setReminderError(''); }}
                              className="text-teal-600 hover:text-teal-700"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Υπενθύμιση
                            </ClinicButton>
                          </div>
                          {/* Create Reminder inline form */}
                          {showReminderPetId === pet.id && (
                            <div className="mt-3 border-t border-ink-200 pt-3 space-y-2">
                              <p className="text-xs font-semibold text-ink-700">Νέα Υπενθύμιση</p>
                              {reminderError && (
                                <p className="text-xs text-red-600">{reminderError}</p>
                              )}
                              <div className="flex gap-1.5">
                                <div className="relative flex-1" ref={reminderTypeDropdownRef}>
                                  <ClinicButton variant="secondary"
                                    type="button"
                                    onClick={() => setReminderTypeDropdownOpen(!reminderTypeDropdownOpen)}
                                    className="w-full justify-between"
                                  >
                                    <span>{{ vaccination: 'Εμβολιασμός', checkup: 'Έλεγχος', medication: 'Φαρμακευτική Αγωγή', custom: 'Γενικό' }[reminderForm.type] || reminderForm.type}</span>
                                    <svg className={`w-3.5 h-3.5 text-ink-400 transition-transform ${reminderTypeDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </ClinicButton>
                                  {reminderTypeDropdownOpen && (
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
                                          onClick={() => { setReminderForm(f => ({ ...f, type: opt.value })); setReminderTypeDropdownOpen(false); }}
                                          className={`w-full text-left px-2.5 py-2 text-xs hover:bg-clinic-50 transition-colors ${reminderForm.type === opt.value ? 'bg-clinic-50 text-clinic-700 font-semibold' : 'text-ink-700'}`}
                                        >
                                          {opt.label}
                                        </button>
                                      ))}
                                      {customReminderTypes.length > 0 && (
                                        <div className="border-t border-ink-200">
                                          {customReminderTypes.map((ct, idx) => (
                                            <div key={idx} className="group">
                                              <button
                                                type="button"
                                                onClick={() => { setReminderForm(f => ({ ...f, type: ct })); setReminderTypeDropdownOpen(false); }}
                                                className={`w-full text-left px-2.5 py-2 text-xs hover:bg-clinic-50 transition-colors flex items-center ${reminderForm.type === ct ? 'bg-clinic-50 text-clinic-700 font-semibold' : 'text-ink-700'}`}
                                              >
                                                <span className="flex-1">{ct}</span>
                                                <span className="hidden group-hover:flex items-center gap-0.5">
                                                  <span
                                                    role="button"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      const newName = prompt('Μετονομασία τύπου:', ct);
                                                      if (newName && newName.trim() && newName.trim() !== ct) {
                                                        const updated = customReminderTypes.map((t, i) => i === idx ? newName.trim() : t);
                                                        setCustomReminderTypes(updated);
                                                        updateCustomReminderTypes(updated).catch(() => {});
                                                        if (reminderForm.type === ct) setReminderForm(f => ({ ...f, type: newName.trim() }));
                                                      }
                                                    }}
                                                    className="text-ink-400 hover:text-clinic-600 p-0.5 transition-colors"
                                                  >
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                  </span>
                                                  <span
                                                    role="button"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      const updated = customReminderTypes.filter((_, i) => i !== idx);
                                                      setCustomReminderTypes(updated);
                                                      updateCustomReminderTypes(updated).catch(() => {});
                                                      if (reminderForm.type === ct) setReminderForm(f => ({ ...f, type: 'checkup' }));
                                                    }}
                                                    className="text-ink-400 hover:text-red-500 p-0.5 transition-colors"
                                                  >
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                  </span>
                                                </span>
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                      {showAddReminderType && (
                                        <div className="border-t border-ink-200 p-1.5">
                                          <div className="flex gap-1">
                                            <ClinicInput
                                              type="text"
                                              value={newReminderTypeName}
                                              onChange={(e) => setNewReminderTypeName(e.target.value)}
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                  e.preventDefault();
                                                  const trimmed = newReminderTypeName.trim();
                                                  if (!trimmed) return;
                                                  const updated = [...customReminderTypes, trimmed];
                                                  setCustomReminderTypes(updated);
                                                  updateCustomReminderTypes(updated).catch(() => {});
                                                  setReminderForm(f => ({ ...f, type: trimmed }));
                                                  setNewReminderTypeName('');
                                                  setShowAddReminderType(false);
                                                  setReminderTypeDropdownOpen(false);
                                                }
                                                if (e.key === 'Escape') setShowAddReminderType(false);
                                              }}
                                              placeholder="Νέος τύπος..."
                                              className="flex-1 px-2 py-1"
                                              autoFocus
                                            />
                                            <ClinicButton variant="primary"
                                              type="button"
                                              onClick={() => {
                                                const trimmed = newReminderTypeName.trim();
                                                if (!trimmed) return;
                                                const updated = [...customReminderTypes, trimmed];
                                                setCustomReminderTypes(updated);
                                                updateCustomReminderTypes(updated).catch(() => {});
                                                setReminderForm(f => ({ ...f, type: trimmed }));
                                                setNewReminderTypeName('');
                                                setShowAddReminderType(false);
                                                setReminderTypeDropdownOpen(false);
                                              }}
                                              className="shrink-0"
                                            >
                                              OK
                                            </ClinicButton>
                                          </div>
                                        </div>
                                      )}
                                    </ClinicPanel>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => { setShowAddReminderType(true); setReminderTypeDropdownOpen(true); }}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-ink-200 text-ink-500 hover:bg-clinic-50 hover:text-clinic-600 hover:border-clinic-300 transition-all shrink-0"
                                  title="Προσθήκη νέου τύπου"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                  </svg>
                                </button>
                              </div>
                              <ClinicInput
                                type="text"
                                placeholder="Τίτλος (προαιρετικό)"
                                value={reminderForm.title}
                                onChange={e => setReminderForm(f => ({ ...f, title: e.target.value }))}
                                className="w-full px-2 py-1.5"
                              />
                              <DatePicker
                                value={reminderForm.due_date}
                                onChange={(v) => setReminderForm(f => ({ ...f, due_date: v }))}
                                placeholder="Ημερομηνία *"
                              />
                              <div>
                                <label className="text-xs text-ink-500 mb-1 block">Υπενθύμιση πριν (ημέρες)</label>
                                <ClinicInput
                                  type="number"
                                  value={reminderForm.reminder_days_before}
                                  onChange={e => setReminderForm(f => ({ ...f, reminder_days_before: Number(e.target.value) }))}
                                  min={1}
                                  max={365}
                                  className="w-full px-2 py-1.5"
                                />
                              </div>
                              <ClinicTextarea
                                placeholder="Μήνυμα (προαιρετικό)"
                                value={reminderForm.message}
                                onChange={e => setReminderForm(f => ({ ...f, message: e.target.value }))}
                                rows={2}
                                className="w-full px-2 py-1.5 resize-none"
                              />
                              <div className="flex gap-2">
                                <ClinicButton variant="secondary"
                                  onClick={() => setShowReminderPetId(null)}
                                  className="flex-1"
                                >
                                  Ακύρωση
                                </ClinicButton>
                                <ClinicButton variant="primary"
                                  onClick={() => handleCreateReminder(pet.id)}
                                  disabled={reminderSubmitting}
                                  className="flex-1 disabled:opacity-50"
                                >
                                  {reminderSubmitting ? '...' : 'Αποθήκευση'}
                                </ClinicButton>
                              </div>
                            </div>
                          )}
                          {/* Medical History */}
                          {historyPetId === pet.id && (
                            <div className="mt-3 border-t border-ink-200 pt-3">
                              {historyLoading ? (
                                <div className="flex justify-center py-3">
                                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-clinic-600" />
                                </div>
                              ) : historyEvents.length > 0 ? (
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                  {historyEvents.map(event => (
                                    <div key={event.id} className="bg-ink-50 rounded-lg p-2.5">
                                      <div className="flex items-center justify-between">
                                        <p className="font-semibold text-ink-700 text-xs">{event.title}</p>
                                        <span className="text-[10px] text-ink-400">
                                          {new Date(event.date).toLocaleDateString('el-GR')}
                                        </span>
                                      </div>
                                      <span className="inline-block mt-1 px-1.5 py-0.5 bg-clinic-100 text-clinic-600 rounded text-[10px] font-semibold">
                                        {event.event_type}
                                      </span>
                                      {event.notes && (
                                        <p className="text-xs text-ink-500 mt-1">{event.notes}</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-ink-400 italic text-center py-2">Δεν υπάρχει ιστορικό.</p>
                              )}
                            </div>
                          )}
                        </ClinicPanel>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    {reminderSuccess && (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-3 flex items-center gap-2 animate-in fade-in duration-200">
                        <svg className="w-5 h-5 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm font-semibold text-green-700">Η υπενθύμιση δημιουργήθηκε και στάλθηκε στον ιδιοκτήτη!</p>
                      </div>
                    )}
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-ink-800 text-sm">Κατοικίδια ({selectedClient.pets.length})</h3>
                      <ClinicButton variant="ghost"
                        onClick={() => { setEditingPet(null); setShowAddPet(true); }}
                        className=""
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Προσθήκη
                      </ClinicButton>
                    </div>
                    {selectedClient.pets.length > 0 ? (
                      <div className="space-y-2">
                        {selectedClient.pets.map(pet => (
                          <ClinicPanel key={pet.id} className="p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{pet.type === 'Dog' ? '🐕' : pet.type === 'Cat' ? '🐈' : '🐾'}</span>
                                <div>
                                  <p className="font-semibold text-ink-800 text-sm">{pet.name}</p>
                                  <p className="text-xs text-ink-500">
                                    {petTypeLabels[pet.type] || pet.type}
                                    {pet.breed ? ` · ${pet.breed}` : ''}
                                    {pet.age != null ? ` · ${pet.age} ετών` : ''}
                                    {pet.weight != null ? ` · ${pet.weight}kg` : ''}
                                    {pet.gender ? ` · ${genderLabels[pet.gender] || pet.gender}` : ''}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <ClinicButton variant="secondary"
                                  aria-label={`Επεξεργασία κατοικιδίου: ${pet.name}`}
                                  onClick={(e) => { e.stopPropagation(); setEditingPet(pet); setShowAddPet(true); }}
                                  className=""
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                </ClinicButton>
                                <ClinicButton variant="danger"
                                  onClick={(e) => { e.stopPropagation(); setDeleteTarget({ type: 'pet', id: pet.id, name: pet.name }); }}
                                  className=""
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </ClinicButton>
                              </div>
                            </div>
                            {pet.notes && (
                              <p className="text-xs text-ink-500 mt-2 bg-ink-50 rounded-lg p-2">{pet.notes}</p>
                            )}
                            <div className="mt-2">
                              <ClinicButton variant="ghost"
                                onClick={(e) => { e.stopPropagation(); setShowReminderPetId(showReminderPetId === pet.id ? null : pet.id); setReminderError(''); }}
                                className="text-teal-600 hover:text-teal-700"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Δημιουργία Υπενθύμισης
                              </ClinicButton>
                            </div>
                            {showReminderPetId === pet.id && (
                              <div className="mt-3 border-t border-ink-200 pt-3 space-y-2">
                                <p className="text-xs font-semibold text-ink-700">Νέα Υπενθύμιση</p>
                                {reminderError && <p className="text-xs text-red-600">{reminderError}</p>}
                                <ClinicSelect
                                  value={reminderForm.type}
                                  onChange={e => setReminderForm(f => ({ ...f, type: e.target.value }))}
                                  className="w-full px-2 py-1.5"
                                >
                                  <option value="vaccination">Εμβολιασμός</option>
                                  <option value="checkup">Έλεγχος</option>
                                  <option value="medication">Φαρμακευτική Αγωγή</option>
                                  <option value="custom">Γενικό</option>
                                </ClinicSelect>
                                <ClinicInput
                                  type="text"
                                  placeholder="Τίτλος *"
                                  value={reminderForm.title}
                                  onChange={e => setReminderForm(f => ({ ...f, title: e.target.value }))}
                                  className="w-full px-2 py-1.5"
                                />
                                <DatePicker
                                  value={reminderForm.due_date}
                                  onChange={(v) => setReminderForm(f => ({ ...f, due_date: v }))}
                                  placeholder="Ημερομηνία"
                                />
                                <div className="flex gap-2">
                                  <ClinicButton variant="secondary"
                                    onClick={() => setShowReminderPetId(null)}
                                    className="flex-1"
                                  >
                                    Ακύρωση
                                  </ClinicButton>
                                  <ClinicButton variant="primary"
                                    onClick={() => handleCreateReminder(pet.id)}
                                    disabled={reminderSubmitting}
                                    className="flex-1 disabled:opacity-50"
                                  >
                                    {reminderSubmitting ? '...' : 'Αποθήκευση'}
                                  </ClinicButton>
                                </div>
                              </div>
                            )}
                          </ClinicPanel>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-ink-400 italic">Δεν έχουν καταχωρηθεί κατοικίδια.</p>
                    )}
                  </div>
                )}
              </div>
            ) : null}

            {clientError && <div role="alert" className="p-5 text-sm text-red-700">{clientError}<ClinicButton onClick={refetchClient}>Δοκιμή ξανά</ClinicButton></div>}
            {/* Panel Footer Actions */}
            {selectedClient && (
              <div className="p-5 border-t border-ink-200 bg-ink-50 mt-auto space-y-2">
                {selectedClient.status === 'managed' && (
                  <ClinicButton variant="primary"
                    onClick={() => handleGenerateInvite(selectedClient.id)}
                    className="w-full"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Πρόσκληση στο Vetly
                  </ClinicButton>
                )}
                {selectedClient.status === 'invited' && (
                  <ClinicButton variant="secondary"
                    onClick={() => handleResendInvite(selectedClient.id)}
                    className="w-full"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Αποστολή ξανά
                  </ClinicButton>
                )}
                <div className="flex gap-2">
                  <ClinicButton variant="secondary"
                    onClick={() => setShowEditClient(true)}
                    className="flex-1"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Επεξεργασία
                  </ClinicButton>
                  <ClinicButton variant="danger"
                    onClick={() => setDeleteTarget({ type: 'client', id: selectedClient.id, name: selectedClient.name })}
                    className="flex-1"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Διαγραφή
                  </ClinicButton>
                </div>
                </div>
            )}
          </div>
        )}
      </div>

      {/* Dialogs */}
      {showAddClient && (
        <ClientDialog
          onClose={() => setShowAddClient(false)}
          onSaved={handleClientSaved}
        />
      )}

      {showAddPet && selectedClientId && (
        <PetDialog
          key={`${selectedClientId}-${editingPet?.id || 'new'}`}
          clientId={selectedClientId}
          pet={editingPet}
          onClose={() => { setShowAddPet(false); setEditingPet(null); }}
          onSaved={handlePetSaved}
        />
      )}

      {showEditClient && selectedClient && (
        <EditClientDialog
          key={selectedClient.id}
          client={selectedClient}
          onClose={() => setShowEditClient(false)}
          onSaved={handleClientSaved}
        />
      )}

      {inviteData && (
        <InviteDialog
          inviteUrl={inviteData.invite_url}
          expiresAt={inviteData.expires_at}
          onClose={() => setInviteData(null)}
        />
      )}

      </div>}
      </div>
      {deleteTarget && (
        <DeleteConfirmDialog
          title={deleteTarget.type === 'client' ? 'Διαγραφή Πελάτη' : 'Διαγραφή Κατοικιδίου'}
          message={
            deleteTarget.type === 'client'
              ? `Είστε σίγουροι ότι θέλετε να διαγράψετε αυτόν τον πελάτη;`
              : `Είστε σίγουροι ότι θέλετε να διαγράψετε "${deleteTarget.name}";`
          }
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
