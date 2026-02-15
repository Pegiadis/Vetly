'use client';

import { useState } from 'react';
import {
  useMyReviews,
  useVets,
  createReview,
  updateReview,
  deleteReview,
  OwnerReview,
} from '@/hooks/useOwnerData';
import { getImageUrl } from '@/lib/api';

export default function ReviewsPage() {
  const { reviews, loading, error, refetch } = useMyReviews();
  const { vets } = useVets();

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

  const renderStars = (rating: number, interactive = false, onSelect?: (r: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => interactive && onSelect && onSelect(star)}
            className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
          >
            <svg
              className={`w-5 h-5 ${star <= rating ? 'text-amber-400 fill-current' : 'text-slate-300'}`}
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
    } catch {
      // Error handled silently
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleEdit = (review: OwnerReview) => {
    setEditingReview(review);
    setFormRating(review.rating);
    setFormComment(review.comment);
  };

  const handleUpdate = async () => {
    if (!editingReview || formRating === 0 || !formComment.trim()) return;
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
    } catch {
      // Error handled silently
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (reviewId: string) => {
    setDeletingId(reviewId);
    try {
      await deleteReview(reviewId);
      refetch();
    } catch {
      // Error handled silently
    } finally {
      setDeletingId(null);
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
      <div className="max-w-3xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Οι Αξιολογήσεις Μου</h1>
          <p className="text-slate-500 mt-1">Δείτε και διαχειριστείτε τις αξιολογήσεις που έχετε αφήσει.</p>
        </div>
        <button
          onClick={() => {
            setEditingReview(null);
            setFormVetId('');
            setFormRating(0);
            setFormComment('');
            setShowForm(true);
          }}
          className="px-5 py-2.5 bg-teal-600 text-white rounded-xl font-bold text-sm hover:bg-teal-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Νέα Αξιολόγηση
        </button>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
            >
              {/* Vet Info */}
              <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-100">
                <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-teal-100 flex items-center justify-center">
                  {review.vet?.image_url ? (
                    <img src={getImageUrl(review.vet.image_url)} alt={review.vet.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-teal-700 font-bold text-lg">
                      {review.vet?.name?.charAt(0) || '?'}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900">{review.vet?.name || 'Άγνωστος'}</h3>
                  <p className="text-sm text-slate-500">{review.vet?.specialty || ''}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">
                    {new Date(review.created_at).toLocaleDateString('el-GR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              {/* Rating & Comment */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  {renderStars(review.rating)}
                  <span className="text-sm text-slate-500">({review.rating}/5)</span>
                </div>
                <p className="text-slate-700">{review.comment}</p>
              </div>

              {/* Reply */}
              {review.reply && (
                <div className="bg-slate-50 rounded-xl p-4 mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    <span className="text-sm font-bold text-slate-600">Απάντηση από {review.vet?.name || 'κτηνίατρο'}</span>
                  </div>
                  <p className="text-sm text-slate-600">{review.reply}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                <button
                  onClick={() => handleEdit(review)}
                  className="text-sm text-slate-500 hover:text-slate-700 transition-colors flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Επεξεργασία
                </button>
                <button
                  onClick={() => handleDelete(review.id)}
                  disabled={deletingId === review.id}
                  className="text-sm text-red-500 hover:text-red-700 transition-colors flex items-center gap-1 disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  {deletingId === review.id ? 'Διαγραφή...' : 'Διαγραφή'}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-100 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Καμία αξιολόγηση</h3>
            <p className="text-slate-500 mb-6">Δεν έχετε αφήσει αξιολογήσεις ακόμα.</p>
          </div>
        )}
      </div>

      {/* Create Review Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Νέα Αξιολόγηση</h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Κτηνίατρος</label>
                <select
                  value={formVetId}
                  onChange={(e) => setFormVetId(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
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
                <label className="block text-sm font-bold text-slate-700 mb-2">Βαθμολογία</label>
                {renderStars(formRating, true, setFormRating)}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Σχόλιο</label>
                <textarea
                  value={formComment}
                  onChange={(e) => setFormComment(e.target.value)}
                  placeholder="Περιγράψτε την εμπειρία σας..."
                  rows={4}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors"
              >
                Ακύρωση
              </button>
              <button
                onClick={handleCreate}
                disabled={formSubmitting || !formVetId || formRating === 0 || !formComment.trim()}
                className="flex-1 py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {formSubmitting ? 'Υποβολή...' : 'Υποβολή'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Review Modal */}
      {editingReview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Επεξεργασία Αξιολόγησης</h2>
              <button
                onClick={() => setEditingReview(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4 flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-teal-100 flex items-center justify-center flex-shrink-0">
                {editingReview.vet?.image_url ? (
                  <img src={getImageUrl(editingReview.vet.image_url)} alt={editingReview.vet.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-teal-700 font-bold">{editingReview.vet?.name?.charAt(0) || '?'}</span>
                )}
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm">{editingReview.vet?.name || 'Άγνωστος'}</p>
                <p className="text-xs text-slate-500">{editingReview.vet?.specialty || ''}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Βαθμολογία</label>
                {renderStars(formRating, true, setFormRating)}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Σχόλιο</label>
                <textarea
                  value={formComment}
                  onChange={(e) => setFormComment(e.target.value)}
                  placeholder="Περιγράψτε την εμπειρία σας..."
                  rows={4}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingReview(null)}
                className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors"
              >
                Ακύρωση
              </button>
              <button
                onClick={handleUpdate}
                disabled={formSubmitting || formRating === 0 || !formComment.trim()}
                className="flex-1 py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {formSubmitting ? 'Αποθήκευση...' : 'Αποθήκευση'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
