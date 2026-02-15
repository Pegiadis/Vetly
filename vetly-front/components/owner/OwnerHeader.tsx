'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function OwnerHeader() {
  const { user } = useAuth();
  const ownerName = user?.name || '';
  const ownerImage: string | undefined = undefined;
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Αναζήτηση κτηνιάτρου..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
          />
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-4">
        {/* Quick Book Button */}
        <Link
          href="/owner/book"
          className="hidden sm:flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-teal-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Νέο Ραντεβού
        </Link>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-lg border border-slate-100 py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-100">
                <h3 className="font-bold text-slate-800">Ειδοποιήσεις</h3>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <div className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50">
                  <p className="text-sm text-slate-800 font-medium">Υπενθύμιση φαρμάκου</p>
                  <p className="text-xs text-slate-500 mt-1">Χάπι για τον Μάξ σε 1 ώρα</p>
                </div>
                <div className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50">
                  <p className="text-sm text-slate-800 font-medium">Επιβεβαίωση ραντεβού</p>
                  <p className="text-xs text-slate-500 mt-1">Εμβολιασμός αύριο στις 10:00</p>
                </div>
                <div className="px-4 py-3 hover:bg-slate-50 cursor-pointer">
                  <p className="text-sm text-slate-800 font-medium">Νέα απάντηση</p>
                  <p className="text-xs text-slate-500 mt-1">Ο Δρ. Παπαδόπουλος απάντησε</p>
                </div>
              </div>
              <div className="px-4 py-2 border-t border-slate-100">
                <Link href="/owner/notifications" className="text-sm text-teal-600 font-medium hover:text-teal-700">
                  Προβολή όλων
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <Link
          href="/owner/settings"
          className="flex items-center gap-3 hover:bg-slate-50 p-2 rounded-xl transition-all"
        >
          <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center overflow-hidden">
            {ownerImage ? (
              <img src={ownerImage} alt={ownerName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-teal-600 font-bold text-sm">
                {ownerName.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </span>
            )}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-slate-800">{ownerName}</p>
            <p className="text-xs text-slate-500">Ιδιοκτήτης</p>
          </div>
        </Link>
      </div>
    </header>
  );
}
