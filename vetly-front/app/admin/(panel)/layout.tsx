'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import ConnectionRetry from '@/components/ConnectionRetry';
import { ClinicIcon } from '@/components/vet/ClinicHomeShell';
import { ApiError } from '@/lib/api';
import { adminApi, adminSignOut, getAdminToken } from '@/lib/admin-api';
import type { AdminMe } from '@/types/admin';

const links = [
  ['/admin', 'Επισκόπηση', 'chart'],
  ['/admin/vets', 'Κτηνίατροι', 'shield'],
  ['/admin/owners', 'Κηδεμόνες', 'users'],
] as const;
const navItem = 'flex h-8 items-center gap-2 rounded-[10px] px-2 text-sm font-medium text-ink-800';

export default function AdminPanelLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [me, setMe] = useState<AdminMe | null>(null);
  const [failure, setFailure] = useState<'network' | 'unavailable' | null>(null);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    setFailure(null);
    try {
      setMe(await adminApi.get<AdminMe>('/me'));
    } catch (err) {
      // A 401 already sent the browser to the login page.
      if (err instanceof ApiError && err.status !== 401) setFailure(err.status === 0 ? 'network' : 'unavailable');
    }
  }, []);

  useEffect(() => {
    if (!getAdminToken()) {
      router.replace('/admin/login');
      return;
    }
    void load();
  }, [load, router]);

  if (failure) return <ConnectionRetry reason={failure} onRetry={() => { void load(); }} />;
  if (!me) {
    return <div className="flex min-h-screen items-center justify-center bg-ink-50"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-clinic-600" /></div>;
  }

  const isCurrent = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname === href || pathname.startsWith(`${href}/`));

  return <div className="min-h-screen bg-ink-50 text-ink-800">
    <header className="sticky top-0 z-30 flex h-[60px] items-center gap-4 bg-ink-50 px-4 text-ink-900">
      <button aria-label={open ? 'Κλείσιμο μενού' : 'Άνοιγμα μενού'} aria-expanded={open} aria-controls="admin-navigation" onClick={() => setOpen(!open)} className="p-2 md:hidden"><ClinicIcon name="menu" /></button>
      <Link href="/admin" className="flex items-center gap-2.5 md:w-56"><Image src="/branding/vetly-logo-transparent.png" alt="Vetly — Διαχείριση" width={2109} height={746} sizes="96px" preload className="h-auto w-[88px] shrink-0" /><span className="rounded-full bg-ink-900 px-2 py-0.5 text-[11px] font-semibold text-white">Διαχείριση</span></Link>
      <span className="ml-auto hidden text-xs text-ink-500 sm:block">{me.name} · {me.email}</span>
    </header>
    {open && <button className="fixed inset-x-0 bottom-0 top-[60px] z-30 bg-black/30 md:hidden" aria-label="Κλείσιμο μενού" onClick={() => setOpen(false)} />}
    <aside id="admin-navigation" className={`${open ? 'flex' : 'hidden'} fixed bottom-0 left-0 top-[60px] z-40 w-60 flex-col overflow-y-auto bg-ink-50 p-3 md:flex`}>
      <nav aria-label="Διαχείριση" className="space-y-0.5">
        {links.map(([href, label, icon]) => {
          const current = isCurrent(href);
          return <Link key={href} href={href} onClick={() => setOpen(false)} aria-current={current ? 'page' : undefined} className={`${navItem} ${current ? 'bg-black/[0.06] text-ink-900' : 'hover:bg-black/[0.04]'}`}>
            <ClinicIcon name={icon} className={current ? 'text-clinic-600' : 'text-ink-500'} />{label}
          </Link>;
        })}
      </nav>
      <div className="mt-auto pt-6">
        <button onClick={() => adminSignOut()} className={`${navItem} w-full hover:bg-black/[0.04]`}><ClinicIcon name="logout" className="text-ink-500" />Αποσύνδεση</button>
      </div>
    </aside>
    <main className="min-h-[calc(100vh-60px)] min-w-0 border-ink-200 bg-white md:ml-60 md:rounded-tl-2xl md:border-l md:border-t">
      <div className="mx-auto max-w-[1280px] px-4 py-7 sm:px-8 lg:py-9">{children}</div>
    </main>
  </div>;
}
