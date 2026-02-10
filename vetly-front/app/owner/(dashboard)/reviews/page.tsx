'use client';

import { useState } from 'react';

// Mock data
const mockReviews = [
  {
    id: '1',
    vetId: '1',
    vetName: 'Δρ. Γεώργιος Παπαδόπουλος',
    vetSpecialty: 'Γενικός Κτηνίατρος',
    vetImage: 'https://picsum.photos/100/100?random=1',
    petName: 'Μάξ',
    appointmentType: 'Εμβολιασμός',
    rating: 5,
    comment: 'Εξαιρετικός κτηνίατρος! Ο Μάξ αισθάνθηκε πολύ άνετα και ο Δρ. Παπαδόπουλος μας εξήγησε τα πάντα με λεπτομέρεια.',
    reply: 'Ευχαριστούμε πολύ για τα καλά σας λόγια! Χαρήκαμε που ο Μάξ είχε μια θετική εμπειρία.',
    date: '2024-06-15',
  },
  {
    id: '2',
    vetId: '2',
    vetName: 'Δρ. Μαρία Γεωργίου',
    vetSpecialty: 'Δερματολόγος',
    vetImage: 'https://picsum.photos/100/100?random=2',
    petName: 'Λούνα',
    appointmentType: 'Έλεγχος Δέρματος',
    rating: 4,
    comment: 'Πολύ επαγγελματική και καταρτισμένη. Η Λούνα βελτιώθηκε πολύ μετά τη θεραπεία.',
    reply: null,
    date: '2024-05-20',
  },
];

export default function ReviewsPage() {
  const [showForm, setShowForm] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');

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

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Οι Αξιολογήσεις Μου</h1>
        <p className="text-slate-500 mt-1">Δείτε και διαχειριστείτε τις αξιολογήσεις που έχετε αφήσει.</p>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {mockReviews.length > 0 ? (
          mockReviews.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
            >
              {/* Vet Info */}
              <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-100">
                <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                  <img src={review.vetImage} alt={review.vetName} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900">{review.vetName}</h3>
                  <p className="text-sm text-slate-500">{review.vetSpecialty}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">{review.petName} • {review.appointmentType}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(review.date).toLocaleDateString('el-GR', {
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
                    <span className="text-sm font-bold text-slate-600">Απάντηση από {review.vetName}</span>
                  </div>
                  <p className="text-sm text-slate-600">{review.reply}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                <button className="text-sm text-slate-500 hover:text-slate-700 transition-colors flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Επεξεργασία
                </button>
                <button className="text-sm text-red-500 hover:text-red-700 transition-colors flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Διαγραφή
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

      {/* Write Review Modal */}
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
                <label className="block text-sm font-bold text-slate-700 mb-2">Βαθμολογία</label>
                {renderStars(newRating, true, setNewRating)}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Σχόλιο</label>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
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
              <button className="flex-1 py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition-colors">
                Υποβολή
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
