'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  type OwnerNotification,
  useMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/hooks/useOwnerData';
import { ClinicPagination as Pagination, ClinicInput, ClinicSelect, ClinicButton, ClinicLoading } from '@/components/vet/ClinicUI';
import ClinicDrawer from '@/components/vet/ClinicDrawer';
import { useToast } from '@/components/Toast';

const svgIcon = (d: string) => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
  </svg>
);

const notificationIcons: Record<string, { bg: string; icon: React.ReactNode }> = {
  appointment_new: {
    bg: 'bg-clinic-100 text-clinic-600',
    icon: svgIcon('M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'),
  },
  appointment_confirm: {
    bg: 'bg-clinic-100 text-green-600',
    icon: svgIcon('M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'),
  },
  appointment_reject: {
    bg: 'bg-red-100 text-red-600',
    icon: svgIcon('M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636'),
  },
  appointment_complete: {
    bg: 'bg-clinic-100 text-clinic-600',
    icon: svgIcon('M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4'),
  },
  reply: {
    bg: 'bg-clinic-100 text-clinic-600',
    icon: svgIcon('M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'),
  },
  medication: {
    bg: 'bg-amber-100 text-amber-600',
    icon: svgIcon('M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z'),
  },
  reminder: {
    bg: 'bg-clinic-100 text-clinic-600',
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
  if (type.includes('appointment')) return {href:'/owner/appointments',label:'Άνοιγμα ραντεβού'};
  if (type.includes('reminder')) return {href:'/owner/reminders',label:'Άνοιγμα υπενθυμίσεων'};
  if (type.includes('review') || type === 'reply') return {href:'/owner/reviews',label:'Άνοιγμα αξιολογήσεων'};
  if (type.includes('medication')) return {href:'/owner/medications',label:'Άνοιγμα φαρμάκων'};
  return null;
}
export default function NotificationsPage() {
  const [page,setPage] = useState(1);
  const {notifications,total,totalPages,loading,error,refetch} = useMyNotifications(page,10);
  const [filter,setFilter] = useState('all');
  const [query,setQuery] = useState('');
  const [selected,setSelected] = useState<OwnerNotification|null>(null);
  const [busy,setBusy] = useState(false);
  const [actionError,setActionError] = useState('');
  const pending = useRef(false);
  const toast = useToast();
  const router = useRouter();
  const visible = notifications.filter(n=>(filter === 'all' || (filter === 'unread' ? !n.is_read : n.is_read)) && `${n.title} ${n.message}`.toLocaleLowerCase('el').includes(query.toLocaleLowerCase('el')));
  async function markRead(notification: OwnerNotification) {
    if (notification.is_read || pending.current) return;
    pending.current=true;setBusy(true);setActionError('');
    try {await markNotificationRead(notification.id);setSelected(current=>current?.id===notification.id ? {...current,is_read:true} : current);void refetch();window.dispatchEvent(new Event('vetly:notifications-updated'));}
    catch {setActionError('Δεν σημειώθηκε ως διαβασμένη. Δοκιμάστε ξανά.');}
    finally {pending.current=false;setBusy(false);}
  }
  async function markAll() {
    if (pending.current) return;
    pending.current=true;setBusy(true);setActionError('');
    try {await markAllNotificationsRead();void refetch();window.dispatchEvent(new Event('vetly:notifications-updated'));toast.success('Οι ειδοποιήσεις σημειώθηκαν ως διαβασμένες.');}
    catch {setActionError('Δεν ολοκληρώθηκε η σήμανση. Δοκιμάστε ξανά.');}
    finally {pending.current=false;setBusy(false);}
  }
  const link = selected ? destination(selected.type) : null;
  return <div className="mx-auto max-w-[1280px]">
    <header className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-xl font-semibold text-ink-900">Ειδοποιήσεις</h1><p className="mt-1 text-sm text-ink-500">Οι ενημερώσεις για τα ραντεβού και τη φροντίδα τους, σε ένα μέρος.</p></div><ClinicButton disabled={busy || loading || !total} onClick={markAll}>Σήμανση όλων ως διαβασμένες</ClinicButton></header>
    {actionError && !selected && <p role="alert" className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{actionError}</p>}
    <section className="overflow-hidden rounded-xl border border-ink-200 bg-white shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-200 px-4 py-3"><h2 className="text-sm font-semibold text-ink-900">Εισερχόμενα</h2><span className="text-xs text-ink-500">{loading ? 'Φόρτωση…' : `${total} ενημερώσεις συνολικά`}</span></div>
      <div className="grid gap-3 border-b border-ink-200 p-4 sm:grid-cols-2"><ClinicSelect aria-label="Κατάσταση ειδοποιήσεων στη σελίδα" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">Όλες στη σελίδα</option><option value="unread">Νέες</option><option value="read">Διαβασμένες</option></ClinicSelect><ClinicInput aria-label="Αναζήτηση ειδοποιήσεων" placeholder="Αναζήτηση στη σελίδα…" value={query} onChange={e=>setQuery(e.target.value)}/></div>
      {loading ? <ClinicLoading /> : error ? <div role="alert" className="p-5 text-sm text-red-700">{error}<ClinicButton className="ml-2" onClick={refetch}>Επανάληψη</ClinicButton></div> : visible.length ? visible.map(n=>{const icon=notificationIcons[n.type] || notificationIcons.system;return <button key={n.id} disabled={busy} onClick={()=>{setSelected(n);setActionError('');void markRead(n);}} className={`flex w-full gap-3 border-b border-ink-100 px-4 py-4 text-left focus-visible:outline-clinic-600 disabled:opacity-60 sm:gap-4 sm:px-5 ${n.is_read ? 'hover:bg-ink-50' : 'bg-clinic-50/40 hover:bg-clinic-50'}`}>
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${icon.bg}`}>{icon.icon}</span>
        <span className="grid min-w-0 flex-1 gap-2 lg:grid-cols-[1fr_135px] lg:gap-5"><span className="min-w-0"><span className={`block break-words text-sm ${n.is_read ? 'font-medium text-ink-700' : 'font-semibold text-ink-900'}`}>{n.title}</span><span className="mt-1 block line-clamp-2 break-words text-sm leading-5 text-ink-500">{n.message}</span></span><span className="flex flex-wrap items-center gap-2 text-xs text-ink-500 lg:flex-col lg:items-end"><time>{formatDate(n.created_at)}</time><span className={`rounded-md px-2 py-1 ${n.is_read ? 'bg-ink-100 text-ink-500' : 'bg-clinic-100 text-clinic-800'}`}>{n.is_read ? 'Διαβασμένη' : 'Νέα'}</span></span></span>
      </button>}) : <div className="px-5 py-12 text-center"><h3 className="text-sm font-semibold text-ink-900">{notifications.length ? 'Δεν βρέθηκαν αποτελέσματα στη σελίδα' : 'Δεν υπάρχουν ειδοποιήσεις'}</h3><p className="mt-2 text-sm text-ink-500">{notifications.length ? 'Αλλάξτε φίλτρο ή αναζήτηση.' : 'Οι νέες ενημερώσεις θα εμφανίζονται εδώ.'}</p></div>}
      <div className="px-4"><Pagination page={page} totalPages={totalPages} onPageChange={p=>{setPage(p);setQuery('');}}/></div>
    </section>
    {selected && <ClinicDrawer label="Λεπτομέρειες ειδοποίησης" busy={busy} onClose={()=>setSelected(null)}><div className="space-y-5 p-5">
      <div className="flex justify-end"><ClinicButton disabled={busy} onClick={()=>setSelected(null)}>Κλείσιμο ×</ClinicButton></div>
      <header><p className="text-xs text-ink-500">{new Date(selected.created_at).toLocaleString('el-GR')}</p><h2 className="mt-2 break-words text-lg font-semibold text-ink-900">{selected.title}</h2><span className="mt-3 inline-block rounded-md bg-clinic-50 px-2 py-1 text-xs text-clinic-700">{selected.is_read ? 'Διαβασμένη' : 'Νέα'}</span></header>
      <p className="whitespace-pre-wrap break-words border-t border-ink-200 pt-4 text-sm leading-7 text-ink-700">{selected.message}</p>
      {actionError && <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{actionError}<ClinicButton className="mt-2" disabled={busy} onClick={()=>markRead(selected)}>Επανάληψη</ClinicButton></div>}
      {link && <div className="border-t border-ink-200 pt-4"><ClinicButton variant="primary" disabled={busy} onClick={()=>router.push(link.href)}>{link.label} ↗</ClinicButton></div>}
    </div></ClinicDrawer>}
  </div>;
}
