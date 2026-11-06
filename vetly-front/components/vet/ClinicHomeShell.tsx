'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const links = [
  ['/vet/dashboard', 'Αρχική', 'home'],
  ['/vet/appointments', 'Ραντεβού', 'calendar'],
  ['/vet/pending', 'Αιτήματα', 'clock'],
  ['/vet/patients', 'Ασθενείς', 'pet'],
  ['/vet/clients', 'Κηδεμόνες', 'users'],
  ['/vet/services', 'Υπηρεσίες', 'plus'],
  ['/vet/reminders', 'Υπενθυμίσεις', 'bell'],
  ['/vet/schedule', 'Ημερολόγιο', 'calendar'],
  ['/vet/reviews', 'Αξιολογήσεις', 'star'],
  ['/vet/analytics', 'Στατιστικά', 'chart'],
  ['/vet/chat', 'Βοηθός', 'chat'],
  ['/vet/notifications', 'Ειδοποιήσεις', 'bell'],
  ['/vet/settings', 'Ρυθμίσεις', 'settings'],
] as const;

const paths: Record<string, string> = {
  home: 'M3 10 12 3l9 7v11h-6v-7H9v7H3z',
  calendar: 'M4 5h16v16H4z M8 3v4m8-4v4M4 10h16',
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
      <nav aria-label="Κτηνιατρείο" className="space-y-0.5">{links.map(([href, label, icon]) => <Link key={href} href={href} onClick={() => setOpen(false)} aria-current={pathname === href ? 'page' : undefined} className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium ${pathname === href ? 'bg-clinic-100 text-clinic-700 shadow-xs' : 'hover:bg-black/5'}`}><ClinicIcon name={icon} />{label}</Link>)}<p className="px-3 pb-2 pt-6 text-xs font-semibold">Το κτηνιατρείο σου</p><Link href="/vet/settings" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] hover:bg-black/5"><ClinicIcon name="home" />Προφίλ κτηνιατρείου</Link><Link href="/vet/settings#working-hours" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] hover:bg-black/5"><ClinicIcon name="clock" />Ωράριο</Link></nav>
      <div className="mt-auto space-y-1 pt-8"><button onClick={logout} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] hover:bg-black/5"><ClinicIcon name="logout" />Αποσύνδεση</button></div>
    </aside>
    <main className="min-w-0 md:ml-56">{pathname === '/vet/dashboard' || pathname === '/vet/chat' ? children : <div className="mx-auto max-w-[1280px] px-4 py-7 sm:px-8 lg:py-9">{children}</div>}</main>
  </div>;
}
