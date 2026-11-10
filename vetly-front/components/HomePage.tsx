'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';
import { AssistantAvatar } from './AssistantAvatar';

const primary = 'inline-flex h-10 items-center justify-center rounded-[10px] bg-clinic-600 px-4 text-sm font-medium text-white hover:bg-clinic-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clinic-600';
const secondary = 'inline-flex h-10 items-center justify-center rounded-[10px] bg-black/[0.06] px-4 text-sm font-medium text-ink-900 hover:bg-black/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clinic-600';
const quickSearches = ['Εμβολιασμός', 'Παθολογία', 'Χειρουργική', 'Δερματολογία'];

function Glyph({ d }: { d: string }) {
  return <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-clinic-100 text-clinic-700"><svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg></span>;
}

function Section({ eyebrow, title, children, tinted = false }: { eyebrow: string; title: string; children: ReactNode; tinted?: boolean }) {
  return <section className={tinted ? 'border-y border-ink-200 bg-ink-50' : ''}>
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-16">
      <p className="text-xs font-semibold text-clinic-700">{eyebrow}</p>
      <h2 className="mt-2 max-w-2xl text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">{title}</h2>
      <div className="mt-8">{children}</div>
    </div>
  </section>;
}

/** A small, clearly illustrative preview of what an owner sees after signing in. */
function ProductPreview() {
  const row = 'flex items-center gap-3 border-b border-ink-100 px-4 py-2.5 last:border-b-0';
  const avatar = 'grid h-9 w-9 shrink-0 place-items-center rounded-full border border-clinic-100 bg-clinic-50 text-xs font-semibold text-clinic-800';
  return <div aria-hidden="true" className="relative mx-auto w-full max-w-md select-none">
    <div className="overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.10)]">
      <div className="flex h-11 items-center justify-between border-b border-ink-100 px-4"><p className="text-sm font-semibold text-ink-900">Επόμενο ραντεβού</p><span className="inline-flex h-5 items-center rounded-full bg-clinic-100 px-2 text-xs font-medium text-clinic-800">Επιβεβαιωμένο</span></div>
      <div className="p-4">
        <p className="flex items-baseline gap-2"><span className="text-3xl font-semibold leading-none tracking-tight tabular-nums text-ink-900">10:30</span><span className="text-xs text-ink-500">Πέμπτη · 30 λεπτά</span></p>
        <div className="mt-4 flex items-center gap-3"><span className={avatar}>Μ</span><div><p className="text-sm font-semibold text-ink-900">Μπέλα</p><p className="text-xs text-ink-500">Εμβολιασμός · Δρ. Παπαδοπούλου</p></div></div>
      </div>
      <div className="border-t border-ink-100">
        <div className={row}><span className={avatar}>Μ</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-ink-900">Ετήσιο εμβόλιο λύσσας</p><p className="truncate text-xs text-ink-500">Μπέλα</p></div><span className="inline-flex h-5 items-center rounded-full bg-ink-100 px-2 text-xs font-medium text-ink-700">σε 5 ημ.</span></div>
      </div>
    </div>
    <div className="absolute -bottom-14 -left-3 flex items-end gap-2 sm:-left-8">
      <AssistantAvatar size={64} className="rounded-full shadow-[0_6px_20px_rgba(15,23,42,0.18)] ring-4 ring-white" />
      <p className="mb-2 rounded-2xl rounded-bl-md border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 shadow-[0_6px_20px_rgba(15,23,42,0.08)]">Μην ξεχάσεις το εμβόλιο της Μπέλας!</p>
    </div>
  </div>;
}

export default function HomePage() {
  const router = useRouter();
  const [searchText, setSearchText] = useState('');
  const search = (value: string) => router.push(value.trim() ? `/vets?search=${encodeURIComponent(value.trim())}` : '/vets');

  return <div className="min-h-screen bg-white text-ink-800">
    <Navbar />
    <main className="pt-16">
      {/* Hero */}
      <section className="bg-ink-50">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-24 pt-12 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pb-44 lg:pt-20">
          <div>
            <p className="text-xs font-semibold text-clinic-700">Για ιδιοκτήτες κατοικιδίων στην Ελλάδα</p>
            <h1 className="mt-3 text-4xl font-semibold leading-[1.1] tracking-tight text-ink-900 sm:text-5xl">Ο κτηνίατρός σας, <span className="text-clinic-600">ένα ραντεβού μακριά.</span></h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-ink-600">Βρείτε κτηνίατρο κοντά σας, ζητήστε ραντεβού και κρατήστε εμβόλια, θεραπείες και υπενθυμίσεις του κατοικιδίου σας σε ένα μέρος.</p>
            <form onSubmit={event => { event.preventDefault(); search(searchText); }} className="mt-7 flex max-w-lg items-center gap-2 rounded-xl border border-ink-300 bg-white p-1.5 focus-within:border-clinic-600">
              <label htmlFor="home-search" className="sr-only">Αναζήτηση κτηνιάτρου</label>
              <svg className="ml-2 h-5 w-5 shrink-0 text-ink-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M21 21l-5-5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0" /></svg>
              <input id="home-search" type="search" value={searchText} onChange={event => setSearchText(event.target.value)} placeholder="Όνομα, ειδικότητα ή περιοχή" className="h-10 min-w-0 flex-1 bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-400" />
              <button type="submit" className={primary}>Αναζήτηση</button>
            </form>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-500">
              <span>Συχνές αναζητήσεις:</span>
              {quickSearches.map(tag => <button key={tag} type="button" onClick={() => search(tag)} className="rounded-full border border-ink-200 bg-white px-2.5 py-1 font-medium text-ink-700 hover:border-clinic-300 hover:text-clinic-700 focus-visible:outline-2 focus-visible:outline-clinic-600">{tag}</button>)}
            </div>
          </div>
          <div className="relative">
            <Image src="/images/home/hero-dog-cat.jpg" alt="Ένας σκύλος και μια γάτα ξαπλωμένοι μαζί σε καναπέ" width={1600} height={1200} sizes="(min-width: 1024px) 540px, 100vw" preload className="aspect-[4/3] w-full rounded-2xl object-cover" />
            <div className="mt-4 lg:absolute lg:-bottom-20 lg:-left-12 lg:mt-0 lg:w-[320px]"><ProductPreview /></div>
          </div>
        </div>
      </section>

      {/* Three ways in */}
      <section>
        <div className="mx-auto grid max-w-6xl gap-4 px-4 py-12 sm:px-6 md:grid-cols-3">
          {[
            { href: '/vets', d: 'M21 21l-5-5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0', title: 'Βρείτε κτηνίατρο', text: 'Αναζητήστε με όνομα, ειδικότητα ή περιοχή και δείτε προφίλ, υπηρεσίες και αξιολογήσεις.', cta: 'Κατάλογος κτηνιάτρων' },
            { href: '/owner/on-call', d: 'M12 8v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0', title: 'Εφημερεύοντες τώρα', text: 'Με τον λογαριασμό σας βλέπετε ποια ιατρεία έχουν δηλώσει ότι εφημερεύουν, για όταν δεν μπορείτε να περιμένετε.', cta: 'Εφημερίες' },
            { href: '/owner/login', d: 'M8 14q4-7 8 0t-4 5q-8 2-4-5M5 8h.01M9 5h.01M15 5h.01M19 8h.01', title: 'Το κατοικίδιό μου', text: 'Ιατρικό ιστορικό, ραντεβού και υπενθυμίσεις εμβολίων, πάντα μαζί σας στο κινητό.', cta: 'Σύνδεση' },
          ].map(item => <Link key={item.title} href={item.href} className="group flex flex-col rounded-xl border border-ink-200 bg-white p-5 hover:border-clinic-300 focus-visible:outline-2 focus-visible:outline-clinic-600">
            <Glyph d={item.d} />
            <h2 className="mt-4 text-base font-semibold text-ink-900">{item.title}</h2>
            <p className="mt-1.5 flex-1 text-sm leading-6 text-ink-600">{item.text}</p>
            <span className="mt-4 text-sm font-medium text-clinic-700 underline-offset-4 group-hover:underline">{item.cta} →</span>
          </Link>)}
        </div>
      </section>

      <Section tinted eyebrow="Πώς λειτουργεί" title="Τρία βήματα μέχρι το ραντεβού">
        <ol className="grid gap-4 md:grid-cols-3">
          {[
            ['Βρείτε', 'Διαλέξτε κτηνίατρο από τον κατάλογο και δείτε τις υπηρεσίες και το ωράριό του.'],
            ['Ζητήστε ραντεβού', 'Επιλέξτε υπηρεσία, ημέρα και ώρα. Ο κτηνίατρος επιβεβαιώνει το αίτημα και ενημερώνεστε.'],
            ['Παρακολουθήστε', 'Μετά την επίσκεψη, η διάγνωση, η αγωγή και οι επόμενες υπενθυμίσεις μένουν στο προφίλ του κατοικιδίου.'],
          ].map(([title, text], index) => <li key={title} className="rounded-xl border border-ink-200 bg-white p-5">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-clinic-600 text-sm font-semibold tabular-nums text-white">{index + 1}</span>
            <h3 className="mt-4 text-base font-semibold text-ink-900">{title}</h3>
            <p className="mt-1.5 text-sm leading-6 text-ink-600">{text}</p>
          </li>)}
        </ol>
      </Section>

      <Section eyebrow="Γιατί Vetly" title="Όλη η φροντίδα του κατοικιδίου σας, οργανωμένη">
        <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_1fr]"><div className="grid gap-x-10 gap-y-7 sm:grid-cols-2 lg:grid-cols-1">
          {[
            ['M5 12l4 4L19 6', 'Ελεγμένοι επαγγελματίες', 'Κάθε κτηνίατρος εγκρίνεται από το Vetly πριν εμφανιστεί στον κατάλογο και δεχτεί ραντεβού.'],
            ['M4 5h16v16H4zM8 3v4m8-4v4M4 10h16', 'Αίτημα ραντεβού όποτε θέλετε', 'Στέλνετε το αίτημα οποιαδήποτε ώρα, χωρίς τηλέφωνα και αναμονές.'],
            ['M9 3h6l5 5v13H4V3zM14 3v6h6M8 14h8M8 18h5', 'Ιστορικό υγείας', 'Εμβόλια, διαγνώσεις και φάρμακα σε ένα αρχείο ανά κατοικίδιο.'],
            ['M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4', 'Υπενθυμίσεις', 'Ειδοποιήσεις για εμβόλια, αποπαρασιτώσεις και επανελέγχους, πριν τα ξεχάσετε.'],
          ].map(([d, title, text]) => <div key={title} className="flex gap-4">
            <Glyph d={d} />
            <div><h3 className="text-base font-semibold text-ink-900">{title}</h3><p className="mt-1 text-sm leading-6 text-ink-600">{text}</p></div>
          </div>)}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Image src="/images/home/dog.jpg" alt="Χαρούμενος σκύλος σε παραλία" width={1000} height={667} sizes="(min-width: 1024px) 250px, 50vw" className="aspect-[3/4] w-full rounded-2xl object-cover" />
          <Image src="/images/home/cat.jpg" alt="Γάτα που ξεκουράζεται σε καρέκλα" width={1000} height={688} sizes="(min-width: 1024px) 250px, 50vw" className="mt-8 aspect-[3/4] w-full rounded-2xl object-cover" />
        </div></div>
      </Section>

      {/* For clinics */}
      <section className="px-4 pb-16 sm:px-6">
        <div className="mx-auto grid max-w-6xl items-center gap-8 rounded-2xl bg-clinic-800 px-6 py-10 text-white sm:px-10 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="text-xs font-semibold text-clinic-300">Για κτηνιάτρους</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Το ιατρείο σας, σε μία οθόνη</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/80">Ημερολόγιο, αιτήματα ραντεβού, μητρώο κηδεμόνων και ασθενών, υπενθυμίσεις και ιστορικό εξετάσεων, χωρίς χαρτιά και σημειώσεις.</p>
            <ul className="mt-5 space-y-2.5 text-sm">
            {['Η μέρα σας με μια ματιά: επόμενο ραντεβού και εκκρεμότητες', 'Έγκριση ή απόρριψη αιτημάτων με ένα κλικ', 'Αυτόματες υπενθυμίσεις εμβολίων στους κηδεμόνες', 'Βοηθός AI για μηνύματα και σημειώσεις'].map(item => <li key={item} className="flex items-start gap-2.5"><svg className="mt-0.5 h-4 w-4 shrink-0 text-clinic-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l4 4L19 6" /></svg><span className="text-white/90">{item}</span></li>)}
          </ul>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link href="/vet/register" className="inline-flex h-10 items-center justify-center rounded-[10px] bg-white px-4 text-sm font-medium text-clinic-800 hover:bg-clinic-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Εγγραφή ιατρείου</Link>
              <Link href="/vet/login" className="inline-flex h-10 items-center justify-center rounded-[10px] bg-white/10 px-4 text-sm font-medium text-white hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Είσοδος κτηνιατρείου</Link>
            </div>
          </div>
          <Image src="/images/home/clinic.jpg" alt="Κτηνίατροι εξετάζουν ένα μικρό σκυλί" width={1400} height={932} sizes="(min-width: 1024px) 420px, 100vw" className="aspect-[4/3] w-full rounded-xl object-cover" />
        </div>
      </section>

      {/* Closing call */}
      <section className="border-t border-ink-200 bg-ink-50">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-10 sm:px-6">
          <div><h2 className="text-xl font-semibold tracking-tight text-ink-900">Ξεκινήστε με το πρώτο σας κατοικίδιο</h2><p className="mt-1 text-sm text-ink-600">Η δημιουργία λογαριασμού ιδιοκτήτη είναι δωρεάν.</p></div>
          <div className="flex flex-wrap gap-2"><Link href="/vets" className={secondary}>Εύρεση κτηνιάτρου</Link><Link href="/register" className={primary}>Δημιουργία λογαριασμού</Link></div>
        </div>
      </section>
    </main>
    <Footer />
  </div>;
}
