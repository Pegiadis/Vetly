'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getImageUrl } from '@/lib/api';

interface VetHeaderProps {
  unreadCount: number;
}

export default function VetHeader({ unreadCount }: VetHeaderProps) {
  const { user } = useAuth();
  const vetName = user?.name || '';
  const vetImage = getImageUrl(user?.image_url);

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
            placeholder="Αναζήτηση ασθενή..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <Link
          href="/vet/notifications"
          className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>

        {/* Profile */}
        <Link
          href="/vet/settings"
          className="flex items-center gap-3 hover:bg-slate-50 p-2 rounded-xl transition-all"
        >
          <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden">
            {vetImage ? (
              <img src={vetImage} alt={vetName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-indigo-600 font-bold text-sm">
                {vetName.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </span>
            )}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-slate-800">{vetName}</p>
            <p className="text-xs text-slate-500">Κτηνίατρος</p>
          </div>
        </Link>
      </div>
    </header>
  );
}
