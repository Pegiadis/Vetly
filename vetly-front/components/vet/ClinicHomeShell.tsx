'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { useClinicSetup } from './useClinicSetup';

type NavLink = readonly [href: string, label: string, icon: string];

// Daily work first, then the client register, then clinic set-up. Notifications
// live on the header bell; profile and working hours live inside Settings.
const groups: readonly { label?: string; links: readonly NavLink[] }[] = [
  { links: [
    ['/vet/dashboard', 'Αρχική', 'home'],
    ['/vet/schedule', 'Ημερολόγιο', 'calendar'],
    ['/vet/appointments', 'Ραντεβού', 'list'],
    ['/vet/pending', 'Αιτήματα', 'inbox'],
  ] },
  { label: 'Πελάτες', links: [
    ['/vet/clients', 'Κηδεμόνες', 'users'],
    ['/vet/patients', 'Ασθενείς', 'pet'],
    ['/vet/reminders', 'Υπενθυμίσεις', 'clock'],
  ] },
  { label: 'Κτηνιατρείο', links: [
    ['/vet/services', 'Υπηρεσίες', 'tag'],
    ['/vet/reviews', 'Αξιολογήσεις', 'star'],
    ['/vet/analytics', 'Στατιστικά', 'chart'],
  ] },
];
const footerLinks: readonly NavLink[] = [
  ['/vet/chat', 'Βοηθός', 'chat'],
  ['/vet/settings', 'Ρυθμίσεις', 'settings'],
];
const navItem = 'flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium';

const paths: Record<string, string> = {
  home: 'M3 10 12 3l9 7v11h-6v-7H9v7H3z',
  calendar: 'M4 5h16v16H4z M8 3v4m8-4v4M4 10h16',
  list: 'M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01',
  inbox: 'M3 13l3-8h12l3 8v6H3z M3 13h5l1 3h6l1-3h5',
  tag: 'M3 3h8l10 10-8 8L3 11z M7.5 7.5h.01',
  clock: 'M12 8v5l3 2 M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0',
  pet: 'M8 14q4-7 8 0t-4 5q-8 2-4-5 M5 8h.01M9 5h.01M15 5h.01M19 8h.01',
  users: 'M16 21v-3a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v3m18 0v-3a4 4 0 0 0-3-4 M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0m4-3a4 4 0 0 1 0 8',
  plus: 'M5 3h14v18H5z M12 8v8m-4-4h8',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9 M10 21h4',
  star: 'm12 3 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z',
  chart: 'M4 20V10m8 10V4m8 16v-7',
  chat: 'M3 4h18v13H8l-5 4z',
  search: 'M21 21l-6-6 M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0',
  settings: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1z',
  arrow: 'M5 12h14m-6-6 6 6-6 6',
  check: 'm5 12 4 4L19 6',
  menu: 'M4 6h16M4 12h16M4 18h16',
  logout: 'M9 3H3v18h6m5-14 5 5-5 5m-7-5h12',
};

export function ClinicIcon({ name, className = '' }: { name: string; className?: string }) {
  return <svg className={`h-[18px] w-[18px] shrink-0 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name] || paths.plus} /></svg>;
}

export default function ClinicHomeShell({ children, unreadCount }: { children: ReactNode; unreadCount: number }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const setup = useClinicSetup();
  const [pending, setPending] = useState(0);

  // Pending-request count for the sidebar badge: refreshed on navigation, on
  // window focus, and whenever a page approves or rejects a request.
  useEffect(() => {
    let active = true;
    const load = () => {
      api.get<{ pending_total: number }>('/vet/dashboard/home')
        .then(data => { if (active) setPending(data.pending_total); })
        .catch(() => { /* badge is best-effort; the page itself reports errors */ });
    };
    load();
    window.addEventListener('focus', load);
    window.addEventListener('vetly:pending-updated', load);
    return () => {
      active = false;
      window.removeEventListener('focus', load);
      window.removeEventListener('vetly:pending-updated', load);
    };
  }, [pathname]);

  const isCurrent = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const renderLink = ([href, label, icon]: NavLink) => {
    const current = isCurrent(href);
    const badge = href === '/vet/pending' && pending > 0 ? pending : null;
    return <Link key={href} href={href} onClick={() => setOpen(false)} aria-current={current ? 'page' : undefined} className={`${navItem} ${current ? 'bg-clinic-100 text-clinic-700 shadow-xs' : 'hover:bg-black/5'}`}>
      <ClinicIcon name={icon} />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {badge !== null && <span aria-label={`${badge} εκκρεμή`} className="rounded-full bg-clinic-600 px-1.5 py-0.5 text-[11px] font-semibold leading-none text-white tabular-nums">{badge > 99 ? '99+' : badge}</span>}
    </Link>;
  };
  const nextStep = setup.remaining[0];
  const doneSteps = setup.steps.length - setup.remaining.length;

  return <div className="clinic-shell min-h-screen bg-[#f6f8f7] text-[#293640]">
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 bg-[#1f2937] px-4 text-white">
      <button aria-label={open ? 'Κλείσιμο μενού' : 'Άνοιγμα μενού'} aria-expanded={open} aria-controls="clinic-navigation" onClick={() => setOpen(!open)} className="p-2 md:hidden"><ClinicIcon name="menu" /></button>
      <Link href="/vet/dashboard" className="flex items-center gap-2 md:w-52"><span className="shrink-0 rounded-md bg-[#f6f8f7] px-2 py-1"><Image src="/branding/vetly-logo-transparent.png" alt="Vetly — Αρχική" width={2109} height={746} sizes="96px" preload className="h-auto w-24" /></span><span className="hidden rounded-full border border-white/20 px-2 py-0.5 text-[11px] text-white/65 lg:block">Κτηνιατρείο</span></Link>
      <form action="/vet/clients" className="mx-auto hidden w-full max-w-xl items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 sm:flex"><ClinicIcon name="search" className="text-white/60" /><input name="search" aria-label="Αναζήτηση κηδεμόνα" placeholder="Αναζήτηση κηδεμόνα" className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-white/60" /><button className="text-xs text-white/70">Αναζήτηση</button></form>
      <Link href="/vet/notifications" aria-label={`Ειδοποιήσεις: ${unreadCount} μη αναγνωσμένες`} className="relative ml-auto p-2"><ClinicIcon name="bell" />{unreadCount > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-[#def5ed] px-1 text-[10px] text-[#006064]">{unreadCount > 99 ? '99+' : unreadCount}</span>}</Link>
      <Link href="/vet/settings" aria-label="Το προφίλ σου" className="flex items-center gap-2 text-xs"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#bae8da] text-[#006064]">{user?.name.split(' ').map(n => n[0]).slice(0, 2).join('')}</span><span className="hidden xl:block">{user?.name}</span></Link>
    </header>
    {open && <button className="fixed inset-x-0 bottom-0 top-14 z-30 bg-black/30 md:hidden" aria-label="Κλείσιμο μενού" onClick={() => setOpen(false)} />}
    <aside id="clinic-navigation" className={`${open ? 'flex' : 'hidden'} fixed bottom-0 left-0 top-14 z-40 w-56 flex-col overflow-y-auto bg-[#edf2f0] p-3 md:flex`}>
      {setup.ready && nextStep && <Link href={nextStep.href} onClick={() => setOpen(false)} className="mb-3 block rounded-lg border border-clinic-200 bg-white p-3 hover:border-clinic-400 focus-visible:outline-2 focus-visible:outline-clinic-600">
        <span className="flex items-baseline justify-between gap-2 text-xs font-semibold text-ink-900">Ολοκλήρωση προφίλ<span className="font-medium tabular-nums text-ink-500">{doneSteps}/{setup.steps.length}</span></span>
        <span role="progressbar" aria-label="Ολοκλήρωση προφίλ" aria-valuemin={0} aria-valuemax={setup.steps.length} aria-valuenow={doneSteps} className="mt-2 block h-1.5 overflow-hidden rounded-full bg-ink-100"><span className="block h-full rounded-full bg-clinic-500" style={{ width: `${(doneSteps / setup.steps.length) * 100}%` }} /></span>
        <span className="mt-2 block text-xs leading-5 text-clinic-700">Επόμενο: {nextStep.label} →</span>
      </Link>}
      <nav aria-label="Κτηνιατρείο">
        {groups.map((group, index) => <div key={group.label || 'main'} role="group" aria-label={group.label} className={index ? 'mt-5' : ''}>
          {group.label && <p className="px-3 pb-1.5 text-xs font-semibold text-ink-500">{group.label}</p>}
          <div className="space-y-0.5">{group.links.map(renderLink)}</div>
        </div>)}
      </nav>
      <div className="mt-auto space-y-0.5 border-t border-ink-200 pt-3">
        {footerLinks.map(renderLink)}
        <button onClick={logout} className={`${navItem} w-full hover:bg-black/5`}><ClinicIcon name="logout" />Αποσύνδεση</button>
      </div>
    </aside>
    <main className="min-w-0 md:ml-56">{pathname === '/vet/dashboard' || pathname === '/vet/chat' ? children : <div className="mx-auto max-w-[1280px] px-4 py-7 sm:px-8 lg:py-9">{children}</div>}</main>
  </div>;
}
