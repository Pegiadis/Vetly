'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const secondary = 'inline-flex h-9 items-center justify-center rounded-[10px] px-3.5 text-sm font-medium text-ink-900 hover:bg-black/[0.06] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clinic-600';
const primary = 'inline-flex h-9 items-center justify-center rounded-[10px] bg-clinic-600 px-3.5 text-sm font-medium text-white hover:bg-clinic-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clinic-600';

/** Public site header. Fixed, 64px tall; pages below it add their own top padding. */
export default function Navbar() {
  const [open, setOpen] = useState(false);

  return <nav aria-label="Κύρια πλοήγηση" className="fixed top-0 z-50 w-full border-b border-ink-200 bg-white/90 text-ink-800 backdrop-blur-md">
    <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
      <Link href="/" className="shrink-0" aria-label="Vetly — Αρχική">
        <Image src="/branding/vetly-logo-transparent.png" alt="Vetly" width={2109} height={746} sizes="104px" preload className="h-auto w-[104px]" />
      </Link>
      <div className="ml-auto hidden items-center gap-2 md:flex">
        <Link href="/vet/login" className={secondary}>Για κτηνιάτρους</Link>
        <Link href="/owner/login" className={secondary}>Σύνδεση</Link>
        <Link href="/register" className={primary}>Δημιουργία λογαριασμού</Link>
      </div>
      <button type="button" aria-label={open ? 'Κλείσιμο μενού' : 'Άνοιγμα μενού'} aria-expanded={open} aria-controls="public-menu" onClick={() => setOpen(!open)} className="ml-auto grid h-9 w-9 place-items-center rounded-[10px] hover:bg-black/[0.06] md:hidden">
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d={open ? 'M6 6l12 12M18 6 6 18' : 'M4 7h16M4 12h16M4 17h16'} /></svg>
      </button>
    </div>
    {open && <div id="public-menu" className="grid gap-2 border-t border-ink-200 bg-white px-4 py-3 md:hidden">
      <Link href="/register" onClick={() => setOpen(false)} className={primary}>Δημιουργία λογαριασμού</Link>
      <Link href="/owner/login" onClick={() => setOpen(false)} className={`${secondary} bg-black/[0.06]`}>Σύνδεση</Link>
      <Link href="/vet/login" onClick={() => setOpen(false)} className={secondary}>Για κτηνιάτρους</Link>
    </div>}
  </nav>;
}
