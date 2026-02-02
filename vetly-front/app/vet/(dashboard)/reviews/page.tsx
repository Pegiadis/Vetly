'use client';

import { useState } from 'react';
import Link from 'next/link';

const mockReviews = [
  {
    id: '1',
    userName: 'Κώστας Π.',
    userImage: 'https://i.pravatar.cc/150?u=1',
    rating: 5,
    date: '10 Ιουνίου 2024',
    comment: 'Εξαιρετικός γιατρός, έσωσε το σκυλάκι μας! Πολύ καθαρό ιατρείο.',
    reply: 'Σας ευχαριστώ πολύ για τα καλά σας λόγια!',
  },
  {
    id: '2',
    userName: 'Μαρία Λ.',
    userImage: 'https://i.pravatar.cc/150?u=2',
    rating: 4,
    date: '05 Ιουνίου 2024',
    comment: 'Πολύ καλός επαγγελματίας, αλλά λίγο αναμονή στο ραντεβού.',
    reply: null,
  },
  {
    id: '3',
    userName: 'Γιώργος Σ.',
    userImage: 'https://i.pravatar.cc/150?u=3',
    rating: 5,
    date: '28 Μαΐου 2024',
    comment: 'Άμεση εξυπηρέτηση και πολύ φιλικός με τα ζώα.',
    reply: null,
  },
  {
    id: '4',
    userName: 'Ελένη Κ.',
    userImage: 'https://i.pravatar.cc/150?u=4',
    rating: 5,
    date: '20 Μαΐου 2024',
    comment: 'Εμπιστεύομαι τον γιατρό για χρόνια. Τέλειος!',
    reply: 'Ευχαριστώ Ελένη, χαίρομαι που σας βοηθάω!',
  },
];

export default function VetReviewsPage() {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const avgRating = (mockReviews.reduce((sum, r) => sum + r.rating, 0) / mockReviews.length).toFixed(1);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href="/vet/dashboard" className="text-slate-500 text-sm font-bold mb-2 hover:text-indigo-600 block">
          ← Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-slate-900">Αξιολογήσεις</h1>
      </div>

      {/* Stats */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
        <div className="flex items-center gap-8">
          <div className="text-center">
            <div className="text-5xl font-bold text-slate-900">{avgRating}</div>
            <div className="flex items-center justify-center gap-1 mt-2">
              {[1, 2, 3, 4, 5].map(star => (
                <svg
                  key={star}
                  className={`w-5 h-5 ${star <= Math.round(parseFloat(avgRating)) ? 'text-amber-400' : 'text-slate-200'}`}
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              ))}
            </div>
            <div className="text-slate-500 text-sm mt-1">{mockReviews.length} αξιολογήσεις</div>
          </div>
          <div className="flex-1 space-y-2">
            {[5, 4, 3, 2, 1].map(stars => {
              const count = mockReviews.filter(r => r.rating === stars).length;
              const percentage = (count / mockReviews.length) * 100;
              return (
                <div key={stars} className="flex items-center gap-2">
                  <span className="text-sm text-slate-500 w-3">{stars}</span>
                  <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${percentage}%` }} />
                  </div>
                  <span className="text-sm text-slate-400 w-8">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {mockReviews.map(review => (
          <div key={review.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className="flex items-start gap-4">
              <img src={review.userImage} alt={review.userName} className="w-12 h-12 rounded-full" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-800">{review.userName}</h4>
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map(star => (
                          <svg
                            key={star}
                            className={`w-4 h-4 ${star <= review.rating ? 'text-amber-400' : 'text-slate-200'}`}
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-xs text-slate-400">{review.date}</span>
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-slate-600">{review.comment}</p>

                {review.reply && (
                  <div className="mt-4 bg-indigo-50 rounded-xl p-4 border-l-4 border-indigo-500">
                    <p className="text-sm text-slate-500 font-bold mb-1">Η απάντησή σας:</p>
                    <p className="text-slate-700">{review.reply}</p>
                  </div>
                )}

                {!review.reply && replyingTo !== review.id && (
                  <button
                    onClick={() => setReplyingTo(review.id)}
                    className="mt-3 text-sm text-indigo-600 font-bold hover:text-indigo-700"
                  >
                    Απάντηση
                  </button>
                )}

                {replyingTo === review.id && (
                  <div className="mt-4 space-y-3">
                    <textarea
                      className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      rows={3}
                      placeholder="Γράψτε την απάντησή σας..."
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyText('');
                        }}
                        className="px-4 py-2 text-slate-600 border border-slate-200 rounded-lg font-medium hover:bg-slate-50"
                      >
                        Ακύρωση
                      </button>
                      <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700">
                        Αποστολή
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
