'use client';

import { useState } from 'react';
import Link from 'next/link';

const initialPendingRequests = [
  { id: '1', petName: 'Μπέλλα', ownerName: 'Γιάννης Ο.', type: 'Εμβολιασμός', date: '25/06/2024', time: '14:00', notes: 'Ετήσιος εμβολιασμός' },
  { id: '2', petName: 'Κόκο', ownerName: 'Ελένη Κ.', type: 'Καθαρισμός Δοντιών', date: '26/06/2024', time: '11:00', notes: '' },
  { id: '3', petName: 'Θόρ', ownerName: 'Νίκος Α.', type: 'Αποπαρασίτωση', date: '27/06/2024', time: '16:30', notes: 'Πρώτη επίσκεψη' },
  { id: '4', petName: 'Νίκη', ownerName: 'Μαρία Σ.', type: 'Ετήσιος Έλεγχος', date: '28/06/2024', time: '09:00', notes: '' },
];

export default function VetPendingPage() {
  const [requests, setRequests] = useState(initialPendingRequests);

  const handleApprove = (id: string) => {
    setRequests(prev => prev.filter(r => r.id !== id));
  };

  const handleReject = (id: string) => {
    setRequests(prev => prev.filter(r => r.id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href="/vet/dashboard" className="text-slate-500 text-sm font-bold mb-2 hover:text-indigo-600 block">
          ← Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-slate-900">Αιτήματα Ραντεβού</h1>
        <p className="text-slate-500 mt-1">{requests.length} εκκρεμή αιτήματα</p>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Όλα ενημερωμένα!</h3>
          <p className="text-slate-500">Δεν υπάρχουν εκκρεμή αιτήματα ραντεβού.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(request => (
            <div
              key={request.id}
              className="bg-white rounded-2xl shadow-sm border border-amber-100 p-5 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-amber-400" />
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-lg">
                    {request.petName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-lg">
                      {request.petName}{' '}
                      <span className="text-slate-400 font-normal text-sm">({request.ownerName})</span>
                    </h4>
                    <p className="text-slate-600">{request.type}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1 text-sm text-amber-600 bg-amber-50 px-2 py-1 rounded">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {request.date}
                      </span>
                      <span className="flex items-center gap-1 text-sm text-slate-500">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {request.time}
                      </span>
                    </div>
                    {request.notes && <p className="text-sm text-slate-500 mt-2 italic">"{request.notes}"</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleReject(request.id)}
                    className="px-4 py-2 text-red-600 border border-red-200 rounded-xl font-bold hover:bg-red-50 transition-colors"
                  >
                    Απόρριψη
                  </button>
                  <button
                    onClick={() => handleApprove(request.id)}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Έγκριση
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
