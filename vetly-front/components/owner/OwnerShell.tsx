'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getImageUrl } from '@/lib/api';
import AssistantWidget, { AssistantAvatar } from '@/components/vet/AssistantWidget';

type NavLink = readonly [href: string, label: string, icon: string];

// Desktop sidebar: everyday things first, then health records, then the rest.
const groups: readonly { label?: string; links: readonly NavLink[] }[] = [
  { links: [
    ['/owner/dashboard', 'Αρχική', 'home'],
    ['/owner/pets', 'Κατοικίδια', 'pet'],
    ['/owner/appointments', 'Ραντεβού', 'calendar'],
  ] },
  { label: 'Υγεία', links: [
    ['/owner/medical', 'Ιατρικό ιστορικό', 'doc'],
    ['/owner/medications', 'Φάρμακα', 'pill'],
    ['/owner/reminders', 'Υπενθυμίσεις', 'clock'],
  ] },
  { label: 'Περισσότερα', links: [
    ['/owner/on-call', 'Εφημερίες', 'phone'],
    ['/owner/reviews', 'Αξιολογήσεις', 'star'],
  ] },
];
const footerLinks: readonly NavLink[] = [
  ['/owner/chat', 'Βοηθός', 'chat'],
  ['/owner/settings', 'Ρυθμίσεις', 'settings'],
];
// Phone tab bar: the three places an owner goes daily; the rest sits under "More".
const tabs: readonly NavLink[] = [
  ['/owner/dashboard', 'Αρχική', 'home'],
  ['/owner/pets', 'Κατοικίδια', 'pet'],
  ['/owner/appointments', 'Ραντεβού', 'calendar'],
];
const moreLinks: readonly NavLink[] = [...groups[1].links, ...groups[2].links, ...footerLinks];

const paths: Record<string, string> = {
  home: 'M3 10 12 3l9 7v11h-6v-7H9v7H3z',
  pet: 'M8 14q4-7 8 0t-4 5q-8 2-4-5 M5 8h.01M9 5h.01M15 5h.01M19 8h.01',
  calendar: 'M4 5h16v16H4z M8 3v4m8-4v4M4 10h16',
  doc: 'M9 3h6l5 5v13H4V3z M14 3v6h6 M8 14h8M8 18h5',
  pill: 'M10.500 20.500a5 5 0 0 1-7-7l7-7a5 5 0 0 1 7 7z M8.500 8.500l7 7',
  clock: 'M12 8v5l3 2 M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0',
  phone: 'M5 4h4l2 5-2.500 1.500a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2',
  star: 'm12 3 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z',
  chat: 'M3 4h18v13H8l-5 4z',
  settings: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1z',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9 M10 21h4',
  plus: 'M12 5v14M5 12h14',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  logout: 'M9 3H3v18h6m5-14 5 5-5 5m-7-5h12',
};

function Icon({ name, className = '' }: { name: string; className?: string }) {
  return <svg className={`h-[18px] w-[18px] shrink-0 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}

const navItem = 'flex h-8 items-center gap-2 rounded-[10px] px-2 text-sm font-medium text-ink-800';

/** Owner app frame: sidebar on desktop, a single top bar and a bottom tab bar on phones. */
export default function OwnerShell({ children, unreadCount }: { children: ReactNode; unreadCount: number }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const onAssistantPage = pathname === '/owner/chat';
  const isCurrent = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const inMore = moreLinks.some(([href]) => isCurrent(href));
  const name = user?.name || '';
  const image = getImageUrl(user?.image_url);
  const initials = name.split(' ').map(part => part[0]).slice(0, 2).join('');

  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setMoreOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [moreOpen]);

  const sideLink = ([href, label, icon]: NavLink) => {
    const current = isCurrent(href);
    return <Link key={href} href={href} aria-current={current ? 'page' : undefined} className={`${navItem} ${current ? 'bg-black/[0.06] text-ink-900' : 'hover:bg-black/[0.04]'}`}>
      <Icon name={icon} className={current ? 'text-clinic-600' : 'text-ink-500'} /><span className="min-w-0 flex-1 truncate">{label}</span>
    </Link>;
  };
  const tabClass = (current: boolean) => `flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${current ? 'text-clinic-700' : 'text-ink-500'}`;

  return <div className="clinic-shell min-h-screen bg-ink-50 text-ink-800">
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 bg-ink-50 px-4 text-ink-900 md:h-[60px]">
      <Link href="/owner/dashboard" className="shrink-0 md:w-56" aria-label="Vetly — Αρχική"><Image src="/branding/vetly-logo-transparent.png" alt="Vetly" width={2109} height={746} sizes="96px" preload className="h-auto w-[84px] md:w-[88px]" /></Link>
      <Link href="/owner/book" className="ml-auto hidden h-8 items-center gap-1.5 rounded-[10px] bg-clinic-600 px-3 text-[13px] font-medium text-white hover:bg-clinic-700 md:inline-flex"><Icon name="plus" className="h-4 w-4" />Κλείσε ραντεβού</Link>
      <Link href="/owner/notifications" aria-label={`Ειδοποιήσεις${unreadCount ? `: ${unreadCount} νέες` : ''}`} className="relative ml-auto grid h-9 w-9 place-items-center rounded-[10px] hover:bg-black/[0.06] md:ml-0"><Icon name="bell" />{unreadCount > 0 && <span className="absolute -right-0.5 -top-0.5 rounded-full bg-clinic-600 px-1 text-[10px] font-semibold text-white">{unreadCount > 99 ? '99+' : unreadCount}</span>}</Link>
      <Link href="/owner/settings" aria-label="Ο λογαριασμός μου" className="flex items-center gap-2 text-xs"><span className="grid h-8 w-8 place-items-center overflow-hidden rounded-full bg-clinic-100 text-[11px] font-semibold text-clinic-700">{image ? <img src={image} alt="" className="h-full w-full object-cover" /> : initials}</span><span className="hidden font-medium xl:block">{name}</span></Link>
    </header>

    {/* Desktop sidebar */}
    <aside className="fixed bottom-0 left-0 top-[60px] z-20 hidden w-60 flex-col overflow-y-auto bg-ink-50 p-3 md:flex">
      <nav aria-label="Μενού ιδιοκτήτη">
        {groups.map((group, index) => <div key={group.label || 'main'} role="group" aria-label={group.label} className={index ? 'mt-5' : ''}>
          {group.label && <p className="px-2 pb-1.5 text-xs font-semibold text-ink-500">{group.label}</p>}
          <div className="space-y-0.5">{group.links.map(sideLink)}</div>
        </div>)}
      </nav>
      <div className="mt-auto space-y-0.5 pt-6">
        {footerLinks.map(sideLink)}
        <button onClick={logout} className={`${navItem} w-full hover:bg-black/[0.04]`}><Icon name="logout" className="text-ink-500" />Αποσύνδεση</button>
      </div>
    </aside>

    <main className="min-h-[calc(100vh-56px)] min-w-0 border-ink-200 bg-white px-4 pb-28 pt-5 md:ml-60 md:min-h-[calc(100vh-60px)] md:rounded-tl-2xl md:border-l md:border-t md:px-8 md:pb-10 md:pt-7">
      <div className="mx-auto max-w-[1200px]">{children}</div>
    </main>

    {/* Assistant: floating mascot bottom right, above the tab bar on phones */}
    {!onAssistantPage && !assistantOpen && !moreOpen && <button type="button" aria-label="Άνοιγμα βοηθού" onClick={() => setAssistantOpen(true)} className="fixed bottom-20 right-4 z-30 rounded-full shadow-[0_6px_20px_rgba(15,23,42,0.22)] ring-2 ring-white transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clinic-600 md:bottom-5 md:right-5"><AssistantAvatar size={52} /></button>}
    {!onAssistantPage && <AssistantWidget role="owner" aboveTabBar open={assistantOpen} onClose={() => setAssistantOpen(false)} />}

    {/* Phone: bottom tab bar with booking in the middle */}
    <nav aria-label="Κύρια πλοήγηση" className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-stretch border-t border-ink-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      {tabs.slice(0, 2).map(([href, label, icon]) => <Link key={href} href={href} aria-current={isCurrent(href) ? 'page' : undefined} className={tabClass(isCurrent(href))}><Icon name={icon} className="h-[22px] w-[22px]" />{label}</Link>)}
      <Link href="/owner/book" aria-label="Κλείσε ραντεβού" className="flex min-w-0 flex-1 items-center justify-center"><span className="-mt-5 grid h-12 w-12 place-items-center rounded-full bg-clinic-600 text-white shadow-[0_6px_16px_rgba(0,96,100,0.35)] ring-4 ring-white"><Icon name="plus" className="h-6 w-6" /></span></Link>
      {tabs.slice(2).map(([href, label, icon]) => <Link key={href} href={href} aria-current={isCurrent(href) ? 'page' : undefined} className={tabClass(isCurrent(href))}><Icon name={icon} className="h-[22px] w-[22px]" />{label}</Link>)}
      <button type="button" aria-expanded={moreOpen} aria-controls="owner-more" onClick={() => setMoreOpen(!moreOpen)} className={tabClass(moreOpen || inMore)}><Icon name="more" className="h-[22px] w-[22px]" />Μενού</button>
    </nav>

    {/* Phone: "More" sheet */}
    {moreOpen && <div className="fixed inset-0 z-40 md:hidden">
      <button type="button" aria-label="Κλείσιμο μενού" className="absolute inset-0 bg-black/30" onClick={() => setMoreOpen(false)} />
      <div id="owner-more" role="dialog" aria-label="Περισσότερα" className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-white p-3 pb-[calc(env(safe-area-inset-bottom)+12px)] shadow-[0_-12px_40px_rgba(15,23,42,0.18)]">
        <span aria-hidden="true" className="mx-auto mb-2 block h-1 w-10 rounded-full bg-ink-200" />
        <div className="grid grid-cols-2 gap-1.5">
          {moreLinks.map(([href, label, icon]) => <Link key={href} href={href} onClick={() => setMoreOpen(false)} aria-current={isCurrent(href) ? 'page' : undefined} className={`flex h-12 items-center gap-2.5 rounded-xl px-3 text-sm font-medium ${isCurrent(href) ? 'bg-clinic-50 text-clinic-800' : 'bg-ink-50 text-ink-800'}`}><Icon name={icon} className={isCurrent(href) ? 'text-clinic-600' : 'text-ink-500'} />{label}</Link>)}
        </div>
        <button type="button" onClick={logout} className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-medium text-red-700 hover:bg-red-50"><Icon name="logout" />Αποσύνδεση</button>
      </div>
    </div>}
  </div>;
}
