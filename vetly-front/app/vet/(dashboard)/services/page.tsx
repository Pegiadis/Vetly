'use client';


import { ClinicButton, ClinicPanel, ClinicTextarea, ClinicPageHeader, ClinicListRow, ClinicPagination, ClinicLoading, ClinicEmptyState } from '@/components/vet/ClinicUI';
import { useState, useRef, useEffect } from 'react';
import {
  useServiceTypes,
  createServiceType,
  updateServiceType,
  deleteServiceType,
  type ServiceType,
} from '@/hooks/useVetData';

function formatPrice(price: number | string): string {
  return new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR' }).format(Number(price));
}

// --- Service side panel (Create / Edit) ---
function ServicePanel({
  service,
  onClose,
  onSaved,
  onBusyChange,
}: {
  service?: ServiceType | null;
  onClose: () => void;
  onSaved: () => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const [form, setForm] = useState({
    name: service?.name || '',
    description: service?.description || '',
    price: service?.price?.toString() || '',
    duration_minutes: service?.duration_minutes?.toString() || '30',
    is_active: service?.is_active ?? true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleBlur = (field: string) => setTouched(prev => ({ ...prev, [field]: true }));

  const fieldErrors: Record<string, string> = {};
  if (form.name.length > 0 && form.name.trim().length < 2) fieldErrors.name = 'Τουλάχιστον 2 χαρακτήρες.';
  if (form.price && (isNaN(parseFloat(form.price)) || parseFloat(form.price) <= 0)) fieldErrors.price = 'Η τιμή πρέπει να είναι μεγαλύτερη από 0.';
  if (form.duration_minutes && (!Number.isInteger(Number(form.duration_minutes)) || Number(form.duration_minutes) < 5 || Number(form.duration_minutes) > 480)) fieldErrors.duration_minutes = 'Από 5 έως 480 λεπτά, σε ακέραιο αριθμό.';

  const inputErr = (field: string) => touched[field] && fieldErrors[field] ? 'border-red-300 bg-red-50/30' : 'border-ink-200';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !form.name.trim() || !form.price || Object.keys(fieldErrors).length) return;

    const price = parseFloat(form.price);
    if (isNaN(price) || price <= 0) {
      setError('Εισάγετε έγκυρη τιμή');
      return;
    }

    setSubmitting(true);
    onBusyChange(true);
    setError('');

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price,
        duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : 30,
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
      onBusyChange(false);
    }
  };

  return (
    <div aria-label="Φόρμα υπηρεσίας">
      <div className="bg-white rounded-xl border border-ink-200 shadow-xs w-full overflow-hidden">
        <div className="border-b border-ink-200 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink-900">
              {service ? 'Επεξεργασία Υπηρεσίας' : 'Νέα Υπηρεσία'}
            </h2>
            <ClinicButton variant="secondary"
              onClick={onClose}
              aria-label="Κλείσιμο φόρμας υπηρεσίας"
              disabled={submitting}
              className=""
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </ClinicButton>
          </div>
        </div>

        <form onSubmit={handleSubmit}><fieldset disabled={submitting} className="min-w-0 p-5 space-y-4"><p className="text-xs leading-5 text-ink-500">{service ? 'Ενημέρωσε τα στοιχεία της υπηρεσίας στον τιμοκατάλογό σου.' : 'Πρόσθεσε την υπηρεσία, την τιμή και τη διάρκειά της.'}</p>
          <div>
            <label htmlFor="service-name" className="block text-xs font-medium text-ink-700 mb-1.5">Όνομα *</label>
            <input
              id="service-name"
              type="text"
              required
              maxLength={255}
              value={form.name}
              onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setTouched(t => ({ ...t, name: true })); }}
              onBlur={() => handleBlur('name')}
              className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-clinic-500 ${inputErr('name')}`}
              placeholder="π.χ. Γενική Εξέταση"
            />
            {touched.name && fieldErrors.name && <p className="text-xs text-red-600 mt-1">{fieldErrors.name}</p>}
          </div>

          <div>
            <label htmlFor="service-description" className="block text-xs font-medium text-ink-700 mb-1.5">Περιγραφή</label>
            <ClinicTextarea
              id="service-description"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
              maxLength={2000}
              className="w-full px-3 py-2.5 resize-none"
              placeholder="Περιγράψτε την υπηρεσία..."
            />
            {form.description.length > 1800 && (
              <p className="text-xs text-ink-400 mt-1 text-right">{form.description.length}/2000</p>
            )}
          </div>

          <div className="border-t border-ink-200 pt-4"><h3 className="mb-3 text-sm font-semibold">Χρέωση & διάρκεια</h3><div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="service-price" className="block text-xs font-medium text-ink-700 mb-1.5">Τιμή (€) *</label>
              <div className="relative">
                <input
                  id="service-price"
                  type="number"
                  required
                  min={0.01}
                  step={0.01}
                  value={form.price}
                  onChange={e => { setForm(f => ({ ...f, price: e.target.value })); setTouched(t => ({ ...t, price: true })); }}
                  onBlur={() => handleBlur('price')}
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-clinic-500 pr-8 ${inputErr('price')}`}
                  placeholder="0.00"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 text-sm font-semibold">€</span>
              </div>
              {touched.price && fieldErrors.price && <p className="text-xs text-red-600 mt-1">{fieldErrors.price}</p>}
            </div>

            <div>
              <label htmlFor="service-duration" className="block text-xs font-medium text-ink-700 mb-1.5">Διάρκεια (λεπτά)</label>
              <input
                id="service-duration"
                type="number"
                min={5}
                max={480}
                value={form.duration_minutes}
                onChange={e => { setForm(f => ({ ...f, duration_minutes: e.target.value })); setTouched(t => ({ ...t, duration_minutes: true })); }}
                onBlur={() => handleBlur('duration_minutes')}
                className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-clinic-500 ${inputErr('duration_minutes')}`}
                placeholder="π.χ. 30"
              />
              {touched.duration_minutes && fieldErrors.duration_minutes && <p className="text-xs text-red-600 mt-1">{fieldErrors.duration_minutes}</p>}
            </div>
          </div>

          </div>
          {service && (
            <div className="flex items-center gap-3 rounded-lg border border-clinic-100 bg-clinic-50/50 p-3">
              <button
                type="button"
                role="switch"
                aria-label="Ενεργή υπηρεσία"
                aria-checked={form.is_active}
                onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                className={`w-11 h-6 rounded-full relative transition-colors ${
                  form.is_active ? 'bg-clinic-600' : 'bg-ink-300'
                }`}
              >
                <div
                  className="w-5 h-5 bg-white rounded-full shadow absolute top-0.5 transition-transform"
                  style={{ left: form.is_active ? '22px' : '2px' }}
                />
              </button>
              <span className="text-sm font-semibold text-ink-700">
                {form.is_active ? 'Ενεργή' : 'Ανενεργή'}
              </span>
            </div>
          )}

          {error && (
            <div role="alert" className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

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
              disabled={submitting || !form.name.trim() || !form.price || Object.keys(fieldErrors).length > 0}
              className="flex-1 disabled:opacity-50 bg-clinic-600! border-clinic-700! text-white!"
            >
              {submitting ? 'Αποθήκευση...' : 'Αποθήκευση'}
            </ClinicButton>
          </div>
        </fieldset></form>
      </div>
    </div>
  );
}

function DeleteConfirmDialog({ service, onConfirm, onClose, busy }: { service: ServiceType; onConfirm: () => Promise<void>; onClose: () => void; busy: boolean }) {
  const [error, setError] = useState('');
  return <ClinicPanel className="p-5"><h2 className="text-base font-semibold">Διαγραφή Υπηρεσίας</h2><p className="my-4 break-words text-sm text-ink-600">Να διαγραφεί η υπηρεσία «{service.name}»; Μπορείτε επίσης να την ορίσετε ως ανενεργή από την επεξεργασία.</p>{error && <p role="alert" className="mb-3 text-sm text-red-700">{error}</p>}<div className="flex gap-2"><ClinicButton disabled={busy} onClick={onClose}>Ακύρωση</ClinicButton><ClinicButton disabled={busy} variant="danger" onClick={async () => { setError(''); try { await onConfirm(); } catch (err) { setError(err instanceof Error ? err.message : 'Η διαγραφή δεν ολοκληρώθηκε.'); } }}>{busy ? 'Διαγραφή...' : 'Διαγραφή'}</ClinicButton></div></ClinicPanel>;
}

export default function VetServicesPage() {
  const [page, setPage] = useState(1);
  const { services, total, totalPages, loading, error, refetch } = useServiceTypes(page, 10);
  const [showDialog, setShowDialog] = useState(false);
  const [editingService, setEditingService] = useState<ServiceType | null>(null);
  const [deletingService, setDeletingService] = useState<ServiceType | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);
  const deleteLock = useRef(false);
  const panelOpen = showDialog || !!editingService || !!deletingService;
  useEffect(() => {
    if (panelOpen) { panelRef.current?.focus({ preventScroll: true }); if (window.innerWidth < 1280) panelRef.current?.scrollIntoView({ block: 'start' }); }
  }, [panelOpen, editingService, deletingService]);
  const close = () => { setShowDialog(false); setEditingService(null); setDeletingService(null); };
  const edit = (service: ServiceType) => { setEditingService(service); setShowDialog(true); setDeletingService(null); setNotice(''); };
  const handleSaved = () => { setNotice(editingService ? 'Η υπηρεσία ενημερώθηκε.' : 'Η υπηρεσία δημιουργήθηκε.'); close(); void refetch(); };
  const handleDelete = async () => {
    if (!deletingService || deleteLock.current) return;
    deleteLock.current = true; setSaving(true);
    try {
      await deleteServiceType(deletingService.id);
      close(); setNotice('Η υπηρεσία διαγράφηκε.');
      if (page > 1 && services.length === 1) setPage(page - 1); else await refetch();
    } finally { deleteLock.current = false; setSaving(false); }
  };
  return <div>
    <ClinicPageHeader title="Υπηρεσίες" description="Ο τιμοκατάλογος του κτηνιατρείου: υπηρεσίες, χρεώσεις και διάρκεια επίσκεψης." actions={<ClinicButton variant="primary" disabled={saving} onClick={() => { close(); setShowDialog(true); setNotice(''); }}>Νέα Υπηρεσία</ClinicButton>} />
    {notice && <p role="status" className="mb-4 rounded-lg border border-clinic-200 bg-clinic-50 p-3 text-sm">{notice}</p>}
    <div className={`grid items-start gap-4 ${panelOpen ? 'xl:grid-cols-[minmax(0,1fr)_380px]' : ''}`}>
      <div className="order-2 min-w-0 xl:order-1">
        <ClinicPanel className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-ink-200 px-4 py-3"><h2 className="text-sm font-semibold">Τιμοκατάλογος</h2><span className="text-xs text-ink-500">{loading ? 'Φόρτωση…' : `${total} υπηρεσίες`}</span></div>
          {loading ? <ClinicLoading label="Φόρτωση υπηρεσιών…" /> : error ? <div role="alert" className="p-5"><p className="mb-3 text-sm text-red-700">{error}</p><ClinicButton onClick={() => void refetch()}>Δοκιμή ξανά</ClinicButton></div> : !services.length ? <ClinicEmptyState title="Δεν υπάρχουν υπηρεσίες" description="Προσθέστε την πρώτη υπηρεσία με την τιμή και τη διάρκειά της." /> : services.map(service => <ClinicListRow key={service.id} className={editingService?.id === service.id || deletingService?.id === service.id ? 'bg-clinic-50/60! shadow-[inset_3px_0_0_var(--color-clinic-600)]' : ''}>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-3">
              <div className="min-w-0"><button disabled={saving} aria-label={`Επεξεργασία: ${service.name}`} aria-expanded={editingService?.id === service.id} className="break-words text-left text-sm font-semibold text-ink-900 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-clinic-600" onClick={() => edit(service)}>{service.name} <span aria-hidden="true" className="text-ink-400">↗</span></button><p className="mt-1.5 line-clamp-2 break-words text-sm leading-5 text-ink-500">{service.description || 'Χωρίς περιγραφή'}</p><span className={`mt-2 inline-block rounded-md px-2 py-1 text-xs font-medium ${service.is_active ? 'bg-clinic-50 text-clinic-800' : 'bg-ink-100 text-ink-500'}`}>{service.is_active ? 'Ενεργή' : 'Ανενεργή'}</span></div>
              <div className="text-right"><p className="whitespace-nowrap text-sm font-semibold tabular-nums text-ink-900">{formatPrice(service.price)}</p><p className="mt-1.5 text-xs text-ink-500">{service.duration_minutes ? `${service.duration_minutes} λεπτά` : 'Χωρίς διάρκεια'}</p></div>
            </div>
          </ClinicListRow>)}
        </ClinicPanel>
        <div inert={saving}><ClinicPagination page={page} totalPages={totalPages} onPageChange={value => { setPage(value); close(); }} /></div>
      </div>
      {panelOpen && <div ref={panelRef} tabIndex={-1} aria-label="Πάνελ υπηρεσίας" className="order-1 min-w-0 scroll-mt-20 outline-none xl:order-2 xl:sticky xl:top-20 xl:max-h-[calc(100dvh-6rem)] xl:overflow-y-auto">
        {deletingService ? <DeleteConfirmDialog key={deletingService.id} service={deletingService} busy={saving} onConfirm={handleDelete} onClose={() => setDeletingService(null)} /> : <><ServicePanel key={editingService?.id || 'new-service'} onBusyChange={setSaving} service={editingService} onClose={close} onSaved={handleSaved} />{editingService && <div className="mt-3 rounded-lg border border-ink-200 bg-white p-4"><p className="mb-3 text-xs text-ink-500">Για να διατηρήσετε την υπηρεσία χωρίς να είναι διαθέσιμη, ορίστε την ως ανενεργή.</p><ClinicButton variant="danger" disabled={saving} aria-label={`Διαγραφή: ${editingService.name}`} onClick={() => setDeletingService(editingService)}>Διαγραφή υπηρεσίας</ClinicButton></div>}</>}
      </div>}
    </div>
  </div>;
}
