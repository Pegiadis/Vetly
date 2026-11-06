'use client';

import { ClinicButton, ClinicInput } from '@/components/vet/ClinicUI';
import ClinicDrawer from '@/components/vet/ClinicDrawer';
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
import { ClinicPagination as Pagination } from '@/components/vet/ClinicUI';
import { useToast } from '@/components/Toast';

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
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const toast = useToast();

  const renderStars = (rating: number, interactive = false, onSelect?: (r: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            aria-label={`${star} αστέρια`}
            disabled={!interactive || formSubmitting}
            aria-pressed={interactive ? rating === star : undefined}
            type="button"
            onClick={() => interactive && onSelect && onSelect(star)}
            className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
          >
            <svg
              className={`w-5 h-5 ${star <= rating ? 'text-amber-400 fill-current' : 'text-ink-300'}`}
              viewBox="0 0 20 20"
            >
              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
            </svg>
          </button>
        ))}
      </div>
    );
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
      setFormError('Η αξιολόγηση δεν αποθηκεύτηκε. Δοκιμάστε ξανά.');
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
      setFormError('Η αξιολόγηση δεν αποθηκεύτηκε. Δοκιμάστε ξανά.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!window.confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την αξιολόγηση;')) return;
    setDeletingId(reviewId);
    try {
      await deleteReview(reviewId);
      refetch();
      toast.success('Η αξιολόγηση διαγράφηκε.');
    } catch {
      toast.error('Κάτι πήγε στραβά. Παρακαλώ δοκιμάστε ξανά.');
    } finally {
      setDeletingId(null);
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
      <div className="max-w-[1280px] mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium text-ink-900">Οι Αξιολογήσεις Μου</h1>
          <p className="text-ink-500 mt-1">Δείτε και διαχειριστείτε τις αξιολογήσεις που έχετε αφήσει.</p>
        </div>
        <button
          onClick={() => {
            setEditingReview(null);
            setFormVetId('');
            setFormRating(0);
            setFormComment('');
            setFormError('');
            setShowForm(true);
          }}
          disabled={vetsLoading || vets.length === 0}
          title={!vetsLoading && vets.length === 0 ? 'Χρειάζεστε ολοκληρωμένο ραντεβού για να αφήσετε αξιολόγηση' : undefined}
          className="px-5 py-2.5 bg-clinic-600 text-white rounded-xl font-medium text-sm hover:bg-clinic-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Νέα Αξιολόγηση
        </button>
      </div>

      <div className="mb-5 grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="rounded-xl border border-ink-200 bg-white p-5">
          <p className="text-xs font-medium text-clinic-700">Η ΕΜΠΕΙΡΙΑ ΣΑΣ ΜΕΤΡΑΕΙ</p>
          <h2 className="mt-2 text-lg font-semibold text-ink-900">Πώς πήγε η επίσκεψη;</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-ink-500">Μοιραστείτε όσα σας βοήθησαν και όσα θα μπορούσαν να γίνουν καλύτερα. Οι εμπειρίες σας βοηθούν άλλους κηδεμόνες να επιλέξουν κτηνίατρο.</p>
        </div>
        <aside className="rounded-xl border border-ink-200 bg-ink-50 p-5">
          <h2 className="text-sm font-semibold text-ink-800">Μετά την επίσκεψη</h2>
          <p className="mt-2 text-sm leading-6 text-ink-500">Μπορείτε να αξιολογήσετε κτηνιάτρους με τους οποίους έχετε ολοκληρωμένο ραντεβού.</p>
          {!vetsLoading && <p className="mt-3 text-xs font-medium text-clinic-700">{vets.length ? `${vets.length} διαθέσιμοι για αξιολόγηση` : 'Δεν υπάρχει διαθέσιμη επίσκεψη για νέα αξιολόγηση.'}</p>}
        </aside>
      </div>
      <section aria-label="Οι αξιολογήσεις σας" className="overflow-hidden rounded-xl border border-ink-200 bg-white shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-ink-900">Δημοσιευμένες αξιολογήσεις</h2>
          <ClinicInput aria-label="Αναζήτηση αξιολογήσεων" placeholder="Αναζήτηση στη σελίδα…" value={query} onChange={e => setQuery(e.target.value)} className="w-full sm:w-64" />
        </div>
        <div className="hidden grid-cols-[1.1fr_2fr_140px_100px] gap-4 border-b border-ink-200 bg-ink-50 px-5 py-2 text-xs font-medium text-ink-500 lg:grid"><span>Κτηνίατρος</span><span>Η εμπειρία σας</span><span>Απάντηση</span><span>Ημερομηνία</span></div>
        {reviews.filter(r => `${r.vet?.name || ''} ${r.comment}`.toLocaleLowerCase('el').includes(query.toLocaleLowerCase('el'))).map(review => <button key={review.id} onClick={() => setViewing(review)} className="grid w-full gap-3 border-b border-ink-100 px-4 py-4 text-left transition-colors last:border-0 hover:bg-ink-50 focus-visible:outline-clinic-600 sm:px-5 lg:grid-cols-[1.1fr_2fr_140px_100px] lg:items-center lg:gap-4">
          <span className="flex min-w-0 items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-clinic-100 text-clinic-700">{review.vet?.image_url ? <img src={getImageUrl(review.vet.image_url)} alt="" className="h-full w-full object-cover" /> : review.vet?.name?.charAt(0) || '?'}</span><span className="min-w-0"><span className="block truncate text-sm font-medium text-ink-900">{review.vet?.name || 'Κτηνίατρος'}</span><span className="block truncate text-xs text-ink-500">{review.vet?.specialty}</span></span></span>
          <span className="min-w-0"><span className="text-xs font-semibold text-clinic-700">★ {review.rating}/5</span><span className="mt-1 block line-clamp-2 break-words text-sm text-ink-600">{review.comment}</span></span>
          <span className={`w-fit rounded-md px-2 py-1 text-xs ${review.reply ? 'bg-clinic-100 text-clinic-800' : 'bg-ink-100 text-ink-500'}`}>{review.reply ? 'Με απάντηση' : 'Χωρίς απάντηση'}</span>
          <span className="text-xs text-ink-500">{new Date(review.created_at).toLocaleDateString('el-GR')}</span>
        </button>)}
        {!reviews.length && <div className="px-6 py-12 text-center"><h3 className="text-sm font-semibold text-ink-900">Η πρώτη σας αξιολόγηση θα εμφανιστεί εδώ</h3><p className="mt-2 text-sm text-ink-500">Μετά από ολοκληρωμένο ραντεβού, επιλέξτε «Νέα Αξιολόγηση».</p></div>}
        {!!reviews.length && !reviews.some(r => `${r.vet?.name || ''} ${r.comment}`.toLocaleLowerCase('el').includes(query.toLocaleLowerCase('el'))) && <p className="p-6 text-sm text-ink-500">Δεν βρέθηκαν αξιολογήσεις σε αυτή τη σελίδα.</p>}
        <div className="px-4"><Pagination page={page} totalPages={totalPages} onPageChange={p => {setPage(p); setQuery('');}} /></div>
      </section>
      {viewing && <ClinicDrawer label="Λεπτομέρειες αξιολόγησης" onClose={() => setViewing(null)}>
        <div className="space-y-5 p-5"><div className="flex justify-end"><ClinicButton onClick={() => setViewing(null)}>Κλείσιμο ×</ClinicButton></div>
          <div><p className="text-xs text-ink-500">Η αξιολόγησή σας</p><h2 className="mt-1 text-lg font-semibold text-ink-900">{viewing.vet?.name || 'Κτηνίατρος'}</h2><p className="mt-1 text-xs text-ink-500">{new Date(viewing.created_at).toLocaleDateString('el-GR')}</p></div>
          <div className="rounded-xl border border-ink-200 p-4">{renderStars(viewing.rating)}<p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-ink-700">{viewing.comment}</p></div>
          <div className="rounded-xl bg-ink-50 p-4"><h3 className="text-sm font-medium text-ink-900">Απάντηση κτηνιάτρου</h3><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-ink-600">{viewing.reply || 'Δεν έχει δοθεί απάντηση ακόμα.'}</p></div>
          <div className="flex flex-wrap gap-2 border-t border-ink-200 pt-4"><ClinicButton onClick={() => {handleEdit(viewing); setViewing(null);}}>Επεξεργασία</ClinicButton><ClinicButton variant="danger" onClick={() => {const id = viewing.id; setViewing(null); void handleDelete(id);}}>Διαγραφή</ClinicButton></div>
        </div>
      </ClinicDrawer>}

      {/* Create Review Modal */}
      {showForm && (
        <ClinicDrawer label="Νέα αξιολόγηση" busy={formSubmitting} onClose={() => setShowForm(false)}>
          <div className="bg-white p-5 w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-medium text-ink-900">Νέα Αξιολόγηση</h2>
              <button
                aria-label="Κλείσιμο φόρμας" disabled={formSubmitting} onClick={() => setShowForm(false)}
                className="p-2 text-ink-400 hover:text-ink-600 rounded-xl hover:bg-ink-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">Κτηνίατρος</label>
                <select
                  aria-label="Κτηνίατρος" disabled={formSubmitting} value={formVetId}
                  onChange={(e) => setFormVetId(e.target.value)}
                  className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-clinic-500 bg-white"
                >
                  <option value="">Επιλέξτε κτηνίατρο...</option>
                  {vets.map((vet) => (
                    <option key={vet.id} value={vet.id}>
                      {vet.name} — {vet.specialty}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">Βαθμολογία</label>
                {renderStars(formRating, true, setFormRating)}
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">Σχόλιο</label>
                <textarea
                  aria-label="Σχόλιο" disabled={formSubmitting} value={formComment}
                  onChange={(e) => setFormComment(e.target.value)}
                  placeholder="Περιγράψτε την εμπειρία σας..."
                  rows={4}
                  className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-clinic-500 resize-none"
                />
              </div>
            </div>

            {formError && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{formError}</p>}
            <div className="flex gap-3 mt-6">
              <button
                disabled={formSubmitting} onClick={() => setShowForm(false)}
                className="flex-1 py-3 border border-ink-200 text-ink-600 rounded-xl font-medium hover:bg-ink-50 transition-colors"
              >
                Ακύρωση
              </button>
              <button
                onClick={handleCreate}
                disabled={formSubmitting || !formVetId || formRating === 0 || !formComment.trim()}
                className="flex-1 py-3 bg-clinic-600 text-white rounded-xl font-medium hover:bg-clinic-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {formSubmitting ? 'Υποβολή...' : 'Υποβολή'}
              </button>
            </div>
          </div>
        </ClinicDrawer>
      )}

      {/* Edit Review Modal */}
      {editingReview && (
        <ClinicDrawer label="Επεξεργασία αξιολόγησης" busy={formSubmitting} onClose={() => setEditingReview(null)}>
          <div className="bg-white p-5 w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-medium text-ink-900">Επεξεργασία Αξιολόγησης</h2>
              <button
                aria-label="Κλείσιμο φόρμας" disabled={formSubmitting} onClick={() => setEditingReview(null)}
                className="p-2 text-ink-400 hover:text-ink-600 rounded-xl hover:bg-ink-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4 flex items-center gap-3 p-3 bg-ink-50 rounded-xl">
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-clinic-100 flex items-center justify-center flex-shrink-0">
                {editingReview.vet?.image_url ? (
                  <img src={getImageUrl(editingReview.vet.image_url)} alt={editingReview.vet.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-clinic-700 font-medium">{editingReview.vet?.name?.charAt(0) || '?'}</span>
                )}
              </div>
              <div>
                <p className="font-medium text-ink-900 text-sm">{editingReview.vet?.name || 'Άγνωστος'}</p>
                <p className="text-xs text-ink-500">{editingReview.vet?.specialty || ''}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">Βαθμολογία</label>
                {renderStars(formRating, true, setFormRating)}
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">Σχόλιο</label>
                <textarea
                  aria-label="Σχόλιο" disabled={formSubmitting} value={formComment}
                  onChange={(e) => setFormComment(e.target.value)}
                  placeholder="Περιγράψτε την εμπειρία σας..."
                  rows={4}
                  className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-clinic-500 resize-none"
                />
              </div>
            </div>

            {formError && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{formError}</p>}
            <div className="flex gap-3 mt-6">
              <button
                disabled={formSubmitting} onClick={() => setEditingReview(null)}
                className="flex-1 py-3 border border-ink-200 text-ink-600 rounded-xl font-medium hover:bg-ink-50 transition-colors"
              >
                Ακύρωση
              </button>
              <button
                onClick={handleUpdate}
                disabled={formSubmitting || formRating === 0 || !formComment.trim()}
                className="flex-1 py-3 bg-clinic-600 text-white rounded-xl font-medium hover:bg-clinic-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {formSubmitting ? 'Αποθήκευση...' : 'Αποθήκευση'}
              </button>
            </div>
          </div>
        </ClinicDrawer>
      )}
    </div>
  );
}
