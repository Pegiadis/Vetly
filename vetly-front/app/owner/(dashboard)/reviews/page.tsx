'use client';

import { useState } from 'react';
import {
  useMyReviews,
  useReviewableVets,
  createReview,
  updateReview,
  deleteReview,
  OwnerReview,
} from '@/hooks/useOwnerData';
import { getImageUrl } from '@/lib/api';
import { ClinicButton, ClinicInput, ClinicSelect, ClinicTextarea, ClinicPanel, ClinicPageHeader, ClinicLoading, ClinicEmptyState, ClinicStatusBadge, ClinicPagination as Pagination } from '@/components/vet/ClinicUI';
import ClinicDrawer from '@/components/vet/ClinicDrawer';
import { useToast } from '@/components/Toast';
import { ErrorBlock, InlineAlert, DrawerHeader, Field } from '@/components/owner/OwnerUI';

const rowGrid = 'lg:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)_140px_100px]';

function VetThumb({ name, imageUrl }: { name?: string; imageUrl?: string | null }) {
  return <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-clinic-100 text-sm font-medium text-clinic-700">{imageUrl ? <img src={getImageUrl(imageUrl)} alt="" className="h-full w-full object-cover" /> : name?.charAt(0) || '?'}</span>;
}

export default function ReviewsPage() {
  const [page, setPage] = useState(1);
  const [formError, setFormError] = useState('');
  const [query, setQuery] = useState('');
  const [viewing, setViewing] = useState<OwnerReview | null>(null);
  const { reviews, totalPages, loading, error, refetch } = useMyReviews(page, 10);
  const { vets, loading: vetsLoading } = useReviewableVets();

  // Create form state
  const [showForm, setShowForm] = useState(false);
  const [formVetId, setFormVetId] = useState('');
  const [formRating, setFormRating] = useState(0);
  const [formComment, setFormComment] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Edit state
  const [editingReview, setEditingReview] = useState<OwnerReview | null>(null);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<OwnerReview | null>(null);
  const [deleting, setDeleting] = useState(false);

  const toast = useToast();

  const renderStars = (rating: number, interactive = false, onSelect?: (r: number) => void) => {
    return (
      <div className="flex gap-0.5" role={interactive ? 'group' : 'img'} aria-label={interactive ? 'Βαθμολογία' : `${rating} από 5 αστέρια`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            aria-label={`${star} αστέρια`}
            disabled={!interactive || formSubmitting}
            aria-pressed={interactive ? rating === star : undefined}
            type="button"
            onClick={() => interactive && onSelect && onSelect(star)}
            className={`grid place-items-center rounded-[10px] focus-visible:outline-2 focus-visible:outline-clinic-600 ${interactive ? 'h-10 w-10 cursor-pointer hover:bg-black/[0.06]' : 'h-6 w-6 cursor-default'}`}
          >
            <svg className={`h-5 w-5 ${star <= rating ? 'fill-current text-amber-400' : 'text-ink-300'}`} viewBox="0 0 20 20" aria-hidden="true">
              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
            </svg>
          </button>
        ))}
      </div>
    );
  };

  const openCreate = () => {
    setEditingReview(null);
    setFormVetId('');
    setFormRating(0);
    setFormComment('');
    setFormError('');
    setShowForm(true);
  };

  const handleCreate = async () => {
    if (!formVetId || formRating === 0 || !formComment.trim()) return;
    setFormError('');
    setFormSubmitting(true);
    try {
      await createReview({
        vet_id: formVetId,
        rating: formRating,
        comment: formComment.trim(),
      });
      setShowForm(false);
      setFormVetId('');
      setFormRating(0);
      setFormComment('');
      refetch();
      toast.success('Η αξιολόγηση υποβλήθηκε επιτυχώς!');
    } catch {
      setFormError('Η αξιολόγηση δεν αποθηκεύτηκε. Δοκίμασε ξανά.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleEdit = (review: OwnerReview) => {
    setFormError('');
    setEditingReview(review);
    setFormRating(review.rating);
    setFormComment(review.comment);
  };

  const handleUpdate = async () => {
    if (!editingReview || formRating === 0 || !formComment.trim()) return;
    setFormError('');
    setFormSubmitting(true);
    try {
      await updateReview(editingReview.id, {
        rating: formRating,
        comment: formComment.trim(),
      });
      setEditingReview(null);
      setFormRating(0);
      setFormComment('');
      refetch();
      toast.success('Η αξιολόγηση ενημερώθηκε επιτυχώς!');
    } catch {
      setFormError('Η αξιολόγηση δεν αποθηκεύτηκε. Δοκίμασε ξανά.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteReview(deleteTarget.id);
      setDeleteTarget(null);
      refetch();
      toast.success('Η αξιολόγηση διαγράφηκε.');
    } catch {
      toast.error('Κάτι πήγε στραβά. Δοκίμασε ξανά.');
    } finally {
      setDeleting(false);
    }
  };

  const matches = reviews.filter(r => `${r.vet?.name || ''} ${r.comment}`.toLocaleLowerCase('el').includes(query.toLocaleLowerCase('el')));

  return (
    <div className="space-y-4 text-ink-800">
      <ClinicPageHeader
        title="Οι αξιολογήσεις μου"
        description="Μπορείς να αξιολογήσεις κτηνιάτρους με τους οποίους έχεις ολοκληρωμένο ραντεβού."
        actions={<ClinicButton variant="primary" className="min-h-10" onClick={openCreate} disabled={vetsLoading || vets.length === 0} title={!vetsLoading && vets.length === 0 ? 'Χρειάζεσαι ολοκληρωμένο ραντεβού για να αφήσεις αξιολόγηση' : undefined}>+ Νέα αξιολόγηση</ClinicButton>}
      />
      {!vetsLoading && <p className="text-xs text-ink-500">{vets.length ? `${vets.length} ${vets.length === 1 ? 'κτηνίατρος διαθέσιμος' : 'κτηνίατροι διαθέσιμοι'} για αξιολόγηση.` : 'Δεν υπάρχει διαθέσιμη επίσκεψη για νέα αξιολόγηση.'}</p>}
      <ClinicPanel className="overflow-hidden" aria-label="Οι αξιολογήσεις σου">
        <div className="border-b border-ink-200 p-4">
          <ClinicInput aria-label="Αναζήτηση αξιολογήσεων" type="search" placeholder="Αναζήτηση στη σελίδα…" value={query} onChange={e => setQuery(e.target.value)} className="h-10 w-full sm:w-72" />
        </div>
        {loading ? <ClinicLoading /> : error ? <ErrorBlock onRetry={refetch} /> : <>
          <div className={`hidden gap-4 border-b border-ink-200 bg-ink-50 px-5 py-2 text-xs font-medium text-ink-500 lg:grid ${rowGrid}`}><span>Κτηνίατρος</span><span>Η εμπειρία σου</span><span>Απάντηση</span><span>Ημερομηνία</span></div>
          {matches.map(review => <button key={review.id} onClick={() => setViewing(review)} className={`grid w-full gap-2 border-b border-ink-100 px-4 py-3.5 text-left hover:bg-ink-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-clinic-600 sm:px-5 lg:items-center lg:gap-4 ${rowGrid}`}>
            <span className="flex min-w-0 items-center gap-3"><VetThumb name={review.vet?.name} imageUrl={review.vet?.image_url} /><span className="min-w-0"><span className="block truncate text-sm font-semibold text-ink-900">{review.vet?.name || 'Κτηνίατρος'}</span><span className="block truncate text-xs text-ink-500">{review.vet?.specialty}</span></span></span>
            <span className="min-w-0"><span className="text-xs font-semibold text-clinic-700">★ {review.rating}/5</span><span className="mt-0.5 line-clamp-2 block break-words text-sm text-ink-600">{review.comment}</span></span>
            <span><ClinicStatusBadge status={review.reply ? 'completed' : 'neutral'}>{review.reply ? 'Με απάντηση' : 'Χωρίς απάντηση'}</ClinicStatusBadge></span>
            <time className="text-xs text-ink-500">{new Date(review.created_at).toLocaleDateString('el-GR')}</time>
          </button>)}
          {!reviews.length && <ClinicEmptyState title="Δεν έχεις αξιολογήσεις ακόμη" description="Μετά από ολοκληρωμένο ραντεβού, επίλεξε «Νέα αξιολόγηση»." />}
          {!!reviews.length && !matches.length && <p className="p-5 text-sm text-ink-500">Δεν βρέθηκαν αξιολογήσεις σε αυτή τη σελίδα.</p>}
        </>}
        <div className="px-4"><Pagination page={page} totalPages={totalPages} onPageChange={p => { setPage(p); setQuery(''); }} /></div>
      </ClinicPanel>

      {viewing && <ClinicDrawer label="Λεπτομέρειες αξιολόγησης" onClose={() => setViewing(null)}>
        <div className="space-y-5 p-5">
          <DrawerHeader title={viewing.vet?.name || 'Κτηνίατρος'} subtitle={`Η αξιολόγησή σου · ${new Date(viewing.created_at).toLocaleDateString('el-GR')}`} onClose={() => setViewing(null)} />
          <div className="rounded-xl border border-ink-200 p-4">{renderStars(viewing.rating)}<p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-ink-700">{viewing.comment}</p></div>
          <div className="rounded-xl bg-ink-50 p-4"><h3 className="text-sm font-semibold text-ink-900">Απάντηση κτηνιάτρου</h3><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-ink-600">{viewing.reply || 'Δεν έχει δοθεί απάντηση ακόμα.'}</p></div>
          <div className="grid grid-cols-2 gap-2 border-t border-ink-200 pt-4"><ClinicButton className="min-h-10" onClick={() => { handleEdit(viewing); setViewing(null); }}>Επεξεργασία</ClinicButton><ClinicButton variant="danger" className="min-h-10" onClick={() => { setDeleteTarget(viewing); setViewing(null); }}>Διαγραφή</ClinicButton></div>
        </div>
      </ClinicDrawer>}

      {/* Delete confirmation */}
      {deleteTarget && (
        <ClinicDrawer label="Διαγραφή αξιολόγησης" busy={deleting} onClose={() => setDeleteTarget(null)}>
          <div className="w-full space-y-4 bg-white p-5">
            <DrawerHeader title="Διαγραφή αξιολόγησης" disabled={deleting} onClose={() => setDeleteTarget(null)} />
            <p className="text-sm text-ink-600">Είσαι σίγουρος ότι θέλεις να διαγράψεις την αξιολόγησή σου για τον κτηνίατρο {deleteTarget.vet?.name || ''};</p>
            <div className="grid grid-cols-2 gap-2">
              <ClinicButton className="min-h-10" disabled={deleting} onClick={() => setDeleteTarget(null)}>Πίσω</ClinicButton>
              <ClinicButton variant="danger" className="min-h-10" disabled={deleting} onClick={() => void handleDelete()}>{deleting ? 'Διαγραφή…' : 'Διαγραφή'}</ClinicButton>
            </div>
          </div>
        </ClinicDrawer>
      )}

      {/* Create review */}
      {showForm && (
        <ClinicDrawer label="Νέα αξιολόγηση" busy={formSubmitting} onClose={() => setShowForm(false)}>
          <div className="w-full space-y-4 bg-white p-5">
            <DrawerHeader title="Νέα αξιολόγηση" disabled={formSubmitting} onClose={() => setShowForm(false)} />
            <Field label="Κτηνίατρος">
              <ClinicSelect aria-label="Κτηνίατρος" disabled={formSubmitting} value={formVetId} onChange={(e) => setFormVetId(e.target.value)} className="h-10 w-full">
                <option value="">Επίλεξε κτηνίατρο…</option>
                {vets.map((vet) => <option key={vet.id} value={vet.id}>{vet.name} — {vet.specialty}</option>)}
              </ClinicSelect>
            </Field>
            <div><p className="mb-1 text-sm font-medium text-ink-700">Βαθμολογία</p>{renderStars(formRating, true, setFormRating)}</div>
            <Field label="Σχόλιο">
              <ClinicTextarea aria-label="Σχόλιο" disabled={formSubmitting} value={formComment} onChange={(e) => setFormComment(e.target.value)} placeholder="Περιέγραψε την εμπειρία σου…" rows={4} className="w-full" />
            </Field>
            {formError && <InlineAlert>{formError}</InlineAlert>}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <ClinicButton className="min-h-10" disabled={formSubmitting} onClick={() => setShowForm(false)}>Ακύρωση</ClinicButton>
              <ClinicButton variant="primary" className="min-h-10" onClick={handleCreate} disabled={formSubmitting || !formVetId || formRating === 0 || !formComment.trim()}>{formSubmitting ? 'Υποβολή…' : 'Υποβολή'}</ClinicButton>
            </div>
          </div>
        </ClinicDrawer>
      )}

      {/* Edit review */}
      {editingReview && (
        <ClinicDrawer label="Επεξεργασία αξιολόγησης" busy={formSubmitting} onClose={() => setEditingReview(null)}>
          <div className="w-full space-y-4 bg-white p-5">
            <DrawerHeader title="Επεξεργασία αξιολόγησης" disabled={formSubmitting} onClose={() => setEditingReview(null)} />
            <div className="flex items-center gap-3 rounded-xl bg-ink-50 p-3">
              <VetThumb name={editingReview.vet?.name} imageUrl={editingReview.vet?.image_url} />
              <div className="min-w-0"><p className="truncate text-sm font-semibold text-ink-900">{editingReview.vet?.name || 'Άγνωστος'}</p><p className="truncate text-xs text-ink-500">{editingReview.vet?.specialty || ''}</p></div>
            </div>
            <div><p className="mb-1 text-sm font-medium text-ink-700">Βαθμολογία</p>{renderStars(formRating, true, setFormRating)}</div>
            <Field label="Σχόλιο">
              <ClinicTextarea aria-label="Σχόλιο" disabled={formSubmitting} value={formComment} onChange={(e) => setFormComment(e.target.value)} placeholder="Περιέγραψε την εμπειρία σου…" rows={4} className="w-full" />
            </Field>
            {formError && <InlineAlert>{formError}</InlineAlert>}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <ClinicButton className="min-h-10" disabled={formSubmitting} onClick={() => setEditingReview(null)}>Ακύρωση</ClinicButton>
              <ClinicButton variant="primary" className="min-h-10" onClick={handleUpdate} disabled={formSubmitting || formRating === 0 || !formComment.trim()}>{formSubmitting ? 'Αποθήκευση…' : 'Αποθήκευση'}</ClinicButton>
            </div>
          </div>
        </ClinicDrawer>
      )}
    </div>
  );
}
