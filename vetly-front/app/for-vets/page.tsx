import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { AssistantAvatar } from '@/components/AssistantAvatar';

export const metadata: Metadata = {
  title: 'Για κτηνιάτρους',
  description: 'Το Vetly είναι εργαλείο διαχείρισης για κτηνιατρεία: ημερολόγιο και αιτήματα ραντεβού, μητρώο κηδεμόνων και ασθενών, ιατρικός φάκελος, υπενθυμίσεις και PDF έγγραφα. Σε πιλοτική λειτουργία στην Ελλάδα.',
  alternates: { canonical: '/for-vets' },
};

const primary = 'inline-flex h-10 items-center justify-center rounded-[10px] bg-clinic-600 px-4 text-sm font-medium text-white hover:bg-clinic-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clinic-600';
const secondary = 'inline-flex h-10 items-center justify-center rounded-[10px] bg-black/[0.06] px-4 text-sm font-medium text-ink-900 hover:bg-black/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clinic-600';

const features: { d: string; title: string; text: string }[] = [
  { d: 'M4 5h16v16H4zM8 3v4m8-4v4M4 10h16', title: 'Ημερολόγιο και αιτήματα ραντεβού', text: 'Οι κηδεμόνες στέλνουν αίτημα για υπηρεσία, ημέρα και ώρα. Εσείς το εγκρίνετε ή το απορρίπτετε, και τα ραντεβού φαίνονται στο ημερολόγιο και στη λίστα ραντεβού.' },
  { d: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8', title: 'Κηδεμόνες και ασθενείς', text: 'Μητρώο κηδεμόνων και κατοικιδίων με αναζήτηση, στοιχεία επικοινωνίας και πρόσκληση για να συνδεθούν οι κηδεμόνες με το ιατρείο σας.' },
  { d: 'M9 3h6l5 5v13H4V3zM14 3v6h6M8 14h8M8 18h5', title: 'Ιατρικός φάκελος', text: 'Ιστορικό επισκέψεων, διαγνώσεων και αγωγής ανά ασθενή, διαθέσιμο εκεί που το χρειάζεστε, μέσα στο ραντεβού.' },
  { d: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4', title: 'Υπενθυμίσεις', text: 'Υπενθυμίσεις εμβολίων και επανελέγχων για τους κηδεμόνες, με δυνατότητα να ορίσετε δικούς σας τύπους.' },
  { d: 'M20 12l-8 8-9-9V3h8zM7.5 7.5h.01', title: 'Υπηρεσίες και τιμές', text: 'Καταχωρίστε τις υπηρεσίες του ιατρείου με διάρκεια και τιμή. Η τιμή εμφανίζεται στο ραντεβού και στα στατιστικά εσόδων.' },
  { d: 'M9 3h6l5 5v13H4V3zM14 3v6h6M12 12v5m0 0-2-2m2 2 2-2', title: 'Έγγραφα PDF', text: 'Συνταγή, ιατρικός φάκελος και πιστοποιητικό εμβολιασμού σε PDF, με ένα κλικ.' },
  { d: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z', title: 'Αξιολογήσεις', text: 'Δείτε και παρακολουθήστε τις αξιολογήσεις που αφήνουν οι κηδεμόνες μετά από ραντεβού.' },
  { d: 'M4 20V10m6 10V4m6 16v-7m6 7H2', title: 'Στατιστικά', text: 'Εικόνα για τα ραντεβού και τα έσοδα του ιατρείου σας ανά περίοδο.' },
  { d: 'M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z', title: 'Βοηθός AI', text: 'Ένας βοηθός που σας βοηθά να συντάσσετε μηνύματα και σημειώσεις. Η απόφαση και η ευθύνη παραμένουν πάντα δικές σας.' },
  { d: 'M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7', title: 'Δικός σας σύνδεσμος κρατήσεων', text: 'Το ιατρείο έχει δικό του προφίλ και σύνδεσμο. Τον μοιράζεστε με τους κηδεμόνες σας ώστε να ζητούν ραντεβού απευθείας από εσάς.' },
];

const steps: [string, string][] = [
  ['Εγγραφή ιατρείου', 'Δημιουργήστε λογαριασμό με τα επαγγελματικά σας στοιχεία: όνομα, ειδικότητα, αριθμό άδειας και στοιχεία επικοινωνίας. Επιβεβαιώστε το email σας.'],
  ['Επαλήθευση επαγγελματικών στοιχείων', 'Ελέγχουμε τα στοιχεία σας πριν ενεργοποιηθεί ο λογαριασμός. Έως τότε δεν μπορείτε να συνδεθείτε, και θα το δείτε καθαρά στην οθόνη σύνδεσης.'],
  ['Μοιραστείτε τον σύνδεσμό σας', 'Ρυθμίστε ωράριο και υπηρεσίες και στείλτε στους κηδεμόνες σας τον σύνδεσμο του ιατρείου για να ζητούν ραντεβού.'],
];

function Section({ eyebrow, title, children, tinted = false }: { eyebrow: string; title: string; children: ReactNode; tinted?: boolean }) {
  return <section className={tinted ? 'border-y border-ink-200 bg-ink-50' : ''}>
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-16">
      <p className="text-xs font-semibold text-clinic-700">{eyebrow}</p>
      <h2 className="mt-2 max-w-2xl text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">{title}</h2>
      <div className="mt-8">{children}</div>
    </div>
  </section>;
}

/** Illustrative preview of the day view a clinic sees; the names and times are examples, not real data. */
function DayPreview() {
  const rows: [string, string, string, string][] = [
    ['09:00', 'Μπέλα', 'Εμβολιασμός', 'Επιβεβαιωμένο'],
    ['09:30', 'Ρεξ', 'Γενική εξέταση', 'Επιβεβαιωμένο'],
    ['11:00', 'Λούνα', 'Επανέλεγχος', 'Σε αναμονή'],
  ];
  return <div aria-hidden="true" className="select-none overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.10)]">
    <div className="flex h-11 items-center justify-between border-b border-ink-100 px-4"><p className="text-sm font-semibold text-ink-900">Η μέρα σας</p><span className="text-xs text-ink-500">Παράδειγμα</span></div>
    {rows.map(([time, pet, type, status]) => <div key={time} className="flex items-center gap-3 border-b border-ink-100 px-4 py-2.5 last:border-b-0">
      <span className="w-12 text-sm font-semibold tabular-nums text-ink-900">{time}</span>
      <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-ink-900">{pet}</p><p className="truncate text-xs text-ink-500">{type}</p></div>
      <span className={`inline-flex h-5 shrink-0 items-center rounded-full px-2 text-xs font-medium ${status === 'Σε αναμονή' ? 'bg-[#ffe0c7] text-[#622700]' : 'bg-clinic-100 text-clinic-800'}`}>{status}</span>
    </div>)}
  </div>;
}

export default function ForVetsPage() {
  return <div className="min-h-screen bg-white text-ink-800">
    <Navbar />
    <main className="pt-16">
      <section className="bg-ink-50">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-14 pt-12 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pb-20 lg:pt-20">
          <div>
            <p className="text-xs font-semibold text-clinic-700">Για κτηνιάτρους και κτηνιατρεία</p>
            <h1 className="mt-3 text-4xl font-semibold leading-[1.1] tracking-tight text-ink-900 sm:text-5xl">Το ιατρείο σας, <span className="text-clinic-600">οργανωμένο σε ένα μέρος.</span></h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-ink-600">Ραντεβού, κηδεμόνες, ασθενείς, ιστορικό και υπενθυμίσεις στην ίδια εφαρμογή, χωρίς χαρτιά και σημειώσεις.</p>
            <div className="mt-7 flex flex-wrap gap-2">
              <Link href="/vet/register" className={primary}>Εγγραφή ιατρείου</Link>
              <Link href="/vet/login" className={secondary}>Σύνδεση</Link>
            </div>
            <p className="mt-3 text-xs text-ink-500">Το Vetly βρίσκεται σε πιλοτική λειτουργία.</p>
          </div>
          <div className="relative">
            <DayPreview />
            <AssistantAvatar size={64} className="absolute -bottom-8 right-2 rounded-full shadow-[0_6px_20px_rgba(15,23,42,0.18)] ring-4 ring-white sm:-right-4" />
          </div>
        </div>
      </section>

      <Section eyebrow="Τι μπορείτε να κάνετε" title="Ό,τι χρειάζεται η καθημερινή δουλειά του ιατρείου">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(item => <div key={item.title} className="rounded-xl border border-ink-200 bg-white p-5">
            <span className="grid h-10 w-10 place-items-center rounded-[10px] bg-clinic-100 text-clinic-700"><svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={item.d} /></svg></span>
            <h3 className="mt-4 text-base font-semibold text-ink-900">{item.title}</h3>
            <p className="mt-1.5 text-sm leading-6 text-ink-600">{item.text}</p>
          </div>)}
        </div>
      </Section>

      <Section tinted eyebrow="Πώς ξεκινάτε" title="Τρία βήματα μέχρι τον πρώτο κηδεμόνα">
        <ol className="grid gap-4 md:grid-cols-3">
          {steps.map(([title, text], index) => <li key={title} className="rounded-xl border border-ink-200 bg-white p-5">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-clinic-600 text-sm font-semibold tabular-nums text-white">{index + 1}</span>
            <h3 className="mt-4 text-base font-semibold text-ink-900">{title}</h3>
            <p className="mt-1.5 text-sm leading-6 text-ink-600">{text}</p>
          </li>)}
        </ol>
      </Section>

      <section>
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_1fr]">
          <div>
            <p className="text-xs font-semibold text-clinic-700">Πιλοτική λειτουργία</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">Χτίζουμε το Vetly μαζί με τα πρώτα ιατρεία</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-ink-600">Το Vetly είναι νέο και δεν έχει ακόμη καθιερωμένη βάση πελατών. Ορισμένες λειτουργίες μπορεί να αλλάξουν ή να εμπλουτιστούν, και η γνώμη σας επηρεάζει άμεσα το τι θα βελτιώσουμε πρώτο.</p>
          </div>
          <Image src="/images/home/dog.jpg" alt="Χαρούμενος σκύλος σε παραλία" width={1000} height={667} sizes="(min-width: 1024px) 480px, 100vw" className="aspect-[3/2] w-full rounded-2xl object-cover" />
        </div>
      </section>

      <section className="border-t border-ink-200 bg-ink-50">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-10 sm:px-6">
          <div><h2 className="text-xl font-semibold tracking-tight text-ink-900">Έτοιμοι να δοκιμάσετε;</h2><p className="mt-1 text-sm text-ink-600">Η εγγραφή απαιτεί επαλήθευση των επαγγελματικών σας στοιχείων.</p></div>
          <div className="flex flex-wrap gap-2"><Link href="/vet/login" className={secondary}>Σύνδεση</Link><Link href="/vet/register" className={primary}>Εγγραφή ιατρείου</Link></div>
        </div>
      </section>
    </main>
    <Footer />
  </div>;
}
