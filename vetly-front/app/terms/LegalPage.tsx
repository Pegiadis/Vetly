import type { ReactNode } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export interface LegalSection {
  id: string;
  title: string;
  content: ReactNode;
}

/** Shared layout for the legal documents: notice, table of contents and numbered sections. */
export default function LegalPage({ title, updated, intro, sections }: {
  title: string;
  updated: string;
  intro: ReactNode;
  sections: LegalSection[];
}) {
  return (
    <>
      <Navbar />
      <main className="bg-ink-50 pt-16 text-ink-800">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
          <div role="note" className="rounded-[10px] bg-[#fff1e4] px-4 py-3 text-sm font-medium text-[#8a3f0c]">
            Προσχέδιο — εκκρεμεί νομικός έλεγχος
          </div>

          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-ink-900">{title}</h1>
          <p className="mt-2 text-sm text-ink-500">Τελευταία ενημέρωση: {updated}</p>
          <div className="mt-6 space-y-3 text-[15px] leading-7 text-ink-700">{intro}</div>

          <nav aria-label="Περιεχόμενα" className="mt-8 rounded-xl border border-ink-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-ink-900">Περιεχόμενα</h2>
            <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-ink-600 marker:text-ink-400">
              {sections.map(section => (
                <li key={section.id}>
                  <a href={`#${section.id}`} className="text-clinic-700 underline-offset-4 hover:underline">{section.title}</a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="mt-8 rounded-xl border border-ink-200 bg-white px-5 py-2 sm:px-8">
            {sections.map((section, index) => (
              <section key={section.id} id={section.id} aria-labelledby={`${section.id}-title`} className="scroll-mt-24 border-b border-ink-200 py-6 last:border-b-0">
                <h2 id={`${section.id}-title`} className="text-lg font-semibold text-ink-900">{index + 1}. {section.title}</h2>
                <div className="mt-3 space-y-3 text-[15px] leading-7 text-ink-700 [&_a]:font-medium [&_a]:text-clinic-700 [&_a]:underline-offset-4 hover:[&_a]:underline [&_li]:pl-1 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
                  {section.content}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
