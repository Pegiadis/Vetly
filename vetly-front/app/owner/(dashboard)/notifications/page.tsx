'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  type OwnerNotification,
  useMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/hooks/useOwnerData';
import { ClinicPagination as Pagination, ClinicInput, ClinicSelect, ClinicButton, ClinicLoading, ClinicPanel, ClinicPageHeader, ClinicEmptyState } from '@/components/vet/ClinicUI';
import ClinicDrawer from '@/components/vet/ClinicDrawer';
import { useToast } from '@/components/Toast';
import { ErrorBlock, InlineAlert, DrawerHeader } from '@/components/owner/OwnerUI';

const svgIcon = (d: string) => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
  </svg>
);

const brand = 'bg-clinic-100 text-clinic-700';
const notificationIcons: Record<string, { bg: string; icon: React.ReactNode }> = {
  appointment_new: {
    bg: brand,
    icon: svgIcon('M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'),
  },
  appointment_confirm: {
    bg: brand,
    icon: svgIcon('M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'),
  },
  appointment_reject: {
    bg: 'bg-red-50 text-red-700',
    icon: svgIcon('M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636'),
  },
  appointment_complete: {
    bg: brand,
    icon: svgIcon('M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4'),
  },
  reply: {
    bg: brand,
    icon: svgIcon('M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'),
  },
  medication: {
    bg: 'bg-[#ffe0c7] text-[#622700]',
    icon: svgIcon('M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z'),
  },
  reminder: {
    bg: brand,
    icon: svgIcon('M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'),
  },
  system: {
    bg: 'bg-ink-100 text-ink-600',
    icon: svgIcon('M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'),
  },
};

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Μόλις τώρα';
  if (diffMins === 1) return '1 λεπτό πριν';
  if (diffMins < 60) return `${diffMins} λεπτά πριν`;
  if (diffHours === 1) return '1 ώρα πριν';
  if (diffHours < 24) return `${diffHours} ώρες πριν`;
  if (diffDays === 1) return '1 ημέρα πριν';
  if (diffDays < 7) return `${diffDays} ημέρες πριν`;
  return date.toLocaleDateString('el-GR', { day: 'numeric', month: 'short' });
}

function destination(type: string) {
  if (type.includes('appointment')) return { href: '/owner/appointments', label: 'Άνοιγμα ραντεβού' };
  if (type.includes('reminder')) return { href: '/owner/reminders', label: 'Άνοιγμα υπενθυμίσεων' };
  if (type.includes('review') || type === 'reply') return { href: '/owner/reviews', label: 'Άνοιγμα αξιολογήσεων' };
  if (type.includes('medication')) return { href: '/owner/medications', label: 'Άνοιγμα φαρμάκων' };
  return null;
}
export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const { notifications, total, totalPages, loading, error, refetch } = useMyNotifications(page, 10);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<OwnerNotification | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const pending = useRef(false);
  const toast = useToast();
  const router = useRouter();
  const visible = notifications.filter(n => (filter === 'all' || (filter === 'unread' ? !n.is_read : n.is_read)) && `${n.title} ${n.message}`.toLocaleLowerCase('el').includes(query.toLocaleLowerCase('el')));
  async function markRead(notification: OwnerNotification) {
    if (notification.is_read || pending.current) return;
    pending.current = true; setBusy(true); setActionError('');
    try { await markNotificationRead(notification.id); setSelected(current => current?.id === notification.id ? { ...current, is_read: true } : current); void refetch(); window.dispatchEvent(new Event('vetly:notifications-updated')); }
    catch { setActionError('Δεν σημειώθηκε ως διαβασμένη. Δοκίμασε ξανά.'); }
    finally { pending.current = false; setBusy(false); }
  }
  async function markAll() {
    if (pending.current) return;
    pending.current = true; setBusy(true); setActionError('');
    try { await markAllNotificationsRead(); void refetch(); window.dispatchEvent(new Event('vetly:notifications-updated')); toast.success('Οι ειδοποιήσεις σημειώθηκαν ως διαβασμένες.'); }
    catch { setActionError('Δεν ολοκληρώθηκε η σήμανση. Δοκίμασε ξανά.'); }
    finally { pending.current = false; setBusy(false); }
  }
  const link = selected ? destination(selected.type) : null;
  return <div className="space-y-4 text-ink-800">
    <ClinicPageHeader title="Ειδοποιήσεις" description="Οι ενημερώσεις για τα ραντεβού και τη φροντίδα τους, σε ένα μέρος." actions={<ClinicButton className="min-h-10" disabled={busy || loading || !total} onClick={markAll}>Σήμανση όλων ως διαβασμένες</ClinicButton>} />
    {actionError && !selected && <InlineAlert>{actionError}</InlineAlert>}
    <ClinicPanel className="overflow-hidden">
      <div className="grid gap-3 border-b border-ink-200 p-4 sm:grid-cols-2"><ClinicSelect aria-label="Κατάσταση ειδοποιήσεων στη σελίδα" className="h-10" value={filter} onChange={e => setFilter(e.target.value)}><option value="all">Όλες στη σελίδα</option><option value="unread">Νέες</option><option value="read">Διαβασμένες</option></ClinicSelect><ClinicInput aria-label="Αναζήτηση ειδοποιήσεων" type="search" className="h-10" placeholder="Αναζήτηση στη σελίδα…" value={query} onChange={e => setQuery(e.target.value)} /></div>
      {loading ? <ClinicLoading /> : error ? <ErrorBlock onRetry={refetch} /> : visible.length ? visible.map(n => { const icon = notificationIcons[n.type] || notificationIcons.system; return <button key={n.id} disabled={busy} onClick={() => { setSelected(n); setActionError(''); void markRead(n); }} className={`flex w-full gap-3 border-b border-ink-100 px-4 py-3.5 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-clinic-600 disabled:opacity-60 sm:px-5 ${n.is_read ? 'hover:bg-ink-50' : 'bg-clinic-50/50 hover:bg-clinic-50'}`}>
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${icon.bg}`}>{icon.icon}</span>
        <span className="min-w-0 flex-1"><span className="flex items-start justify-between gap-3"><span className={`block min-w-0 break-words text-sm ${n.is_read ? 'font-medium text-ink-700' : 'font-semibold text-ink-900'}`}>{n.title}</span><span className="flex shrink-0 items-center gap-2 pt-0.5 text-xs text-ink-500">{!n.is_read && <span className="h-2 w-2 rounded-full bg-clinic-600" role="img" aria-label="Νέα" />}<time>{formatDate(n.created_at)}</time></span></span><span className="mt-1 line-clamp-2 block break-words text-sm leading-5 text-ink-500">{n.message}</span></span>
      </button>; }) : <ClinicEmptyState title={notifications.length ? 'Δεν βρέθηκαν αποτελέσματα στη σελίδα' : 'Δεν υπάρχουν ειδοποιήσεις'} description={notifications.length ? 'Άλλαξε φίλτρο ή αναζήτηση.' : 'Οι νέες ενημερώσεις θα εμφανίζονται εδώ.'} />}
      <div className="px-4"><Pagination page={page} totalPages={totalPages} onPageChange={p => { setPage(p); setQuery(''); }} /></div>
      {!loading && !error && total > 0 && <p className="px-4 pb-3 pt-1 text-xs text-ink-500">{total} ενημερώσεις συνολικά</p>}
    </ClinicPanel>
    {selected && <ClinicDrawer label="Λεπτομέρειες ειδοποίησης" busy={busy} onClose={() => setSelected(null)}><div className="space-y-5 p-5">
      <DrawerHeader title={selected.title} subtitle={new Date(selected.created_at).toLocaleString('el-GR')} disabled={busy} onClose={() => setSelected(null)} />
      <p className="whitespace-pre-wrap break-words border-t border-ink-200 pt-4 text-sm leading-6 text-ink-700">{selected.message}</p>
      {actionError && <div role="alert" className="rounded-[10px] bg-red-50 px-3 py-2 text-sm text-red-700">{actionError}<ClinicButton className="mt-2 block" disabled={busy} onClick={() => markRead(selected)}>Επανάληψη</ClinicButton></div>}
      {link && <div className="border-t border-ink-200 pt-4"><ClinicButton variant="primary" className="min-h-10 w-full sm:w-auto" disabled={busy} onClick={() => router.push(link.href)}>{link.label} →</ClinicButton></div>}
    </div></ClinicDrawer>}
  </div>;
}
