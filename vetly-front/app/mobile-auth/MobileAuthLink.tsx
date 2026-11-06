'use client';
import { useSearchParams } from 'next/navigation';

export default function MobileAuthLink() {
  const params = useSearchParams();
  const action = params.get('action');
  const token = params.get('token');
  const valid = ['verify-email', 'reset-password'].includes(action || '') && token && token.length <= 4096 && params.getAll('token').length === 1;
  if (!valid) return <main className="mx-auto max-w-md p-8"><h1 className="text-xl font-bold">Μη έγκυρος σύνδεσμος</h1><p className="mt-4">Ζήτησε νέο email μέσα από το Vetly.</p></main>;
  const query = `token=${encodeURIComponent(token!)}`;
  return <main className="flex min-h-screen items-center justify-center bg-[#E4F1F1] p-6"><section className="w-full max-w-md space-y-6 rounded-3xl bg-white p-8 text-[#121212]">
    <p className="text-xl font-bold text-[#006064]">Vetly</p>
    <h1 className="text-2xl font-bold">{action === 'verify-email' ? 'Επιβεβαίωσε το email σου' : 'Όρισε νέο κωδικό'}</h1>
    <p className="text-sm leading-6 text-gray-600">Συνέχισε στην εφαρμογή Vetly για να ολοκληρώσεις την ενέργεια.</p>
    <a className="block rounded-full bg-[#006064] px-5 py-4 text-center font-semibold text-white" href={`vetly://${action}?${query}`} rel="noreferrer">Άνοιγμα στο Vetly</a>
    <p className="text-sm leading-6 text-gray-600">Αν χρησιμοποιείς Expo Go ή δεν έχεις εγκαταστήσει την εφαρμογή, μπορείς να ολοκληρώσεις εδώ και μετά να επιστρέψεις στη σύνδεση του κινητού. Εναλλακτικά, επικόλλησε τον σύνδεσμο του email στην επιλογή «Έχω σύνδεσμο από email» της εφαρμογής.</p>
    <a className="block rounded-full border border-[#006064] px-5 py-4 text-center font-semibold text-[#006064]" href={`/${action}?${query}`} rel="noreferrer">Συνέχεια στον browser</a>
  </section></main>;
}
