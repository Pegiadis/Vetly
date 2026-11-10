import Link from 'next/link';
import Image from 'next/image';

const columns = [
  { title: 'Για ιδιοκτήτες', links: [['/vets', 'Εύρεση κτηνιάτρου'], ['/register', 'Δημιουργία λογαριασμού'], ['/owner/login', 'Σύνδεση']] },
  { title: 'Για κτηνιάτρους', links: [['/vet/register', 'Εγγραφή ιατρείου'], ['/vet/login', 'Είσοδος κτηνιατρείου']] },
] as const;

export default function Footer() {
  return <footer className="border-t border-ink-200 bg-ink-50 text-ink-700">
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
      <div>
        <Image src="/branding/vetly-logo-transparent.png" alt="Vetly" width={2109} height={746} sizes="104px" className="h-auto w-[104px]" />
        <p className="mt-3 max-w-xs text-sm leading-6 text-ink-500">Η φροντίδα του κατοικιδίου σας, οργανωμένη: κτηνίατρος, ραντεβού και ιστορικό σε ένα μέρος.</p>
      </div>
      {columns.map(column => <div key={column.title}>
        <h2 className="text-xs font-semibold text-ink-900">{column.title}</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {column.links.map(([href, label]) => <li key={href}><Link href={href} className="text-ink-600 underline-offset-4 hover:text-clinic-700 hover:underline">{label}</Link></li>)}
        </ul>
      </div>)}
      <div>
        <h2 className="text-xs font-semibold text-ink-900">Επικοινωνία</h2>
        <ul className="mt-3 space-y-2 text-sm">
          <li><a href="mailto:info@vetly.gr" className="text-ink-600 underline-offset-4 hover:text-clinic-700 hover:underline">info@vetly.gr</a></li>
        </ul>
      </div>
    </div>
    <div className="border-t border-ink-200">
      <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-ink-500 sm:px-6">© {new Date().getFullYear()} Vetly</p>
    </div>
  </footer>;
}
