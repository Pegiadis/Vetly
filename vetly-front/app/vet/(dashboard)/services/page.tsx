'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  useServiceTypes,
  createServiceType,
  updateServiceType,
  deleteServiceType,
  type ServiceType,
} from '@/hooks/useVetData';

function formatPrice(price: number | string): string {
  return `${Number(price).toFixed(2)} €`;
}

// --- Service Dialog (Create / Edit) ---
function ServiceDialog({
  service,
  onClose,
  onSaved,
}: {
  service?: ServiceType | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: service?.name || '',
    description: service?.description || '',
    price: service?.price?.toString() || '',
    duration_minutes: service?.duration_minutes?.toString() || '',
    is_active: service?.is_active ?? true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleBlur = (field: string) => setTouched(prev => ({ ...prev, [field]: true }));
  const handleDurationChange = (value: string) => {
    if (!value) {
      setForm(f => ({ ...f, duration_minutes: '' }));
      return;
    }

    const normalized = value.replace(/^0+/, '');
    setForm(f => ({ ...f, duration_minutes: normalized }));
  };

  const fieldErrors: Record<string, string> = {};
  if (form.name.length > 0 && form.name.trim().length < 2) fieldErrors.name = 'Τουλάχιστον 2 χαρακτήρες.';
  if (form.price && (isNaN(parseFloat(form.price)) || parseFloat(form.price) < 0)) fieldErrors.price = 'Εισάγετε έγκυρη τιμή.';
  if (form.duration_minutes && parseInt(form.duration_minutes) < 15) fieldErrors.duration_minutes = 'Τουλάχιστον 15 λεπτά.';

  const inputErr = (field: string) => touched[field] && fieldErrors[field] ? 'border-red-300 bg-red-50/30' : 'border-slate-200';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.price) return;

    const price = parseFloat(form.price);
    if (isNaN(price) || price < 0) {
      setError('Εισάγετε έγκυρη τιμή');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        price,
        duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes) : undefined,
        is_active: form.is_active,
      };

      if (service) {
        await updateServiceType(service.id, payload);
      } else {
        await createServiceType(payload);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Αποτυχία αποθήκευσης');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-5 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">
              {service ? 'Επεξεργασία Υπηρεσίας' : 'Νέα Υπηρεσία'}
            </h2>
            <button
              onClick={onClose}
              className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/40 transition-colors"
            >
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
              maxLength={255}
              value={form.name}
              onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setTouched(t => ({ ...t, name: true })); }}
              onBlur={() => handleBlur('name')}
              className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${inputErr('name')}`}
              placeholder="π.χ. Γενική Εξέταση"
            />
            {touched.name && fieldErrors.name && <p className="text-xs text-red-600 mt-1">{fieldErrors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Περιγραφή</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
              maxLength={2000}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="Περιγράψτε την υπηρεσία..."
            />
            {form.description.length > 1800 && (
              <p className="text-xs text-slate-400 mt-1 text-right">{form.description.length}/2000</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Τιμή (€) *</label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min={0}
                  step={0.01}
                  value={form.price}
                  onChange={e => { setForm(f => ({ ...f, price: e.target.value })); setTouched(t => ({ ...t, price: true })); }}
                  onBlur={() => handleBlur('price')}
                  className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-8 ${inputErr('price')}`}
                  placeholder="0.00"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">€</span>
              </div>
              {touched.price && fieldErrors.price && <p className="text-xs text-red-600 mt-1">{fieldErrors.price}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Διάρκεια (λεπτά)</label>
              <input
                type="number"
                min={15}
                max={480}
                value={form.duration_minutes}
                onChange={e => { handleDurationChange(e.target.value); setTouched(t => ({ ...t, duration_minutes: true })); }}
                onBlur={() => handleBlur('duration_minutes')}
                className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${inputErr('duration_minutes')}`}
                placeholder="π.χ. 30"
              />
              {touched.duration_minutes && fieldErrors.duration_minutes && <p className="text-xs text-red-600 mt-1">{fieldErrors.duration_minutes}</p>}
            </div>
          </div>

          {service && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                className={`w-11 h-6 rounded-full relative transition-colors ${
                  form.is_active ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
              >
                <div
                  className="w-5 h-5 bg-white rounded-full shadow absolute top-0.5 transition-transform"
                  style={{ left: form.is_active ? '22px' : '2px' }}
                />
              </button>
              <span className="text-sm font-bold text-slate-700">
                {form.is_active ? 'Ενεργή' : 'Ανενεργή'}
              </span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors"
            >
              Ακύρωση
            </button>
            <button
              type="submit"
              disabled={submitting || !form.name.trim() || !form.price || Object.keys(fieldErrors).length > 0}
              className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Αποθήκευση...' : 'Αποθήκευση'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Delete Confirm Dialog ---
function DeleteConfirmDialog({
  service,
  onConfirm,
  onClose,
}: {
  service: ServiceType;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-7 h-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">Διαγραφή Υπηρεσίας</h3>
        <p className="text-sm text-slate-500 mb-5">
          Είστε σίγουροι ότι θέλετε να διαγράψετε &quot;{service.name}&quot;;
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors"
          >
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
export default function VetServicesPage() {
  const { services, loading, error, refetch } = useServiceTypes();
  const [showDialog, setShowDialog] = useState(false);
  const [editingService, setEditingService] = useState<ServiceType | null>(null);
  const [deletingService, setDeletingService] = useState<ServiceType | null>(null);

  const handleSaved = () => {
    setShowDialog(false);
    setEditingService(null);
    refetch();
  };

  const handleDelete = async () => {
    if (!deletingService) return;
    try {
      await deleteServiceType(deletingService.id);
      refetch();
    } catch {
      alert('Κάτι πήγε στραβά. Παρακαλώ δοκιμάστε ξανά.');
    }
    setDeletingService(null);
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <Link href="/vet/dashboard" className="text-slate-500 text-sm font-bold mb-2 hover:text-indigo-600 block">
            &larr; Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">Υπηρεσίες</h1>
          <p className="text-slate-500 mt-1">Διαχείριση τιμοκαταλόγου υπηρεσιών</p>
        </div>
        <button
          onClick={() => { setEditingService(null); setShowDialog(true); }}
          className="px-5 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Νέα Υπηρεσία
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      ) : services.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-16 text-center">
          <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Δεν υπάρχουν υπηρεσίες</h3>
          <p className="text-slate-500 mb-6">Προσθέστε την πρώτη σας υπηρεσία για να ξεκινήσετε.</p>
          <button
            onClick={() => setShowDialog(true)}
            className="px-5 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Νέα Υπηρεσία
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100">
                  <th className="p-5 font-bold">Υπηρεσία</th>
                  <th className="p-5 font-bold">Περιγραφή</th>
                  <th className="p-5 font-bold text-right">Τιμή</th>
                  <th className="p-5 font-bold text-center">Διάρκεια</th>
                  <th className="p-5 font-bold text-center">Κατάσταση</th>
                  <th className="p-5 font-bold text-right">Ενέργειες</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {services.map(service => (
                  <tr
                    key={service.id}
                    className="border-b border-slate-50 last:border-0 hover:bg-indigo-50/30 transition-colors"
                  >
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                        </div>
                        <span className="font-bold text-slate-900">{service.name}</span>
                      </div>
                    </td>
                    <td className="p-5 text-slate-500 max-w-xs">
                      <span className="line-clamp-2">{service.description || '-'}</span>
                    </td>
                    <td className="p-5 text-right">
                      <span className="font-bold text-slate-900">{formatPrice(service.price)}</span>
                    </td>
                    <td className="p-5 text-center text-slate-600">
                      {service.duration_minutes ? `${service.duration_minutes} λεπτά` : '-'}
                    </td>
                    <td className="p-5 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          service.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {service.is_active ? 'Ενεργή' : 'Ανενεργή'}
                      </span>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setEditingService(service); setShowDialog(true); }}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Επεξεργασία"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeletingService(service)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Διαγραφή"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dialogs */}
      {(showDialog || editingService) && (
        <ServiceDialog
          service={editingService}
          onClose={() => { setShowDialog(false); setEditingService(null); }}
          onSaved={handleSaved}
        />
      )}

      {deletingService && (
        <DeleteConfirmDialog
          service={deletingService}
          onConfirm={handleDelete}
          onClose={() => setDeletingService(null)}
        />
      )}
    </div>
  );
}
