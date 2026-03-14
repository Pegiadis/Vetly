import { Metadata } from 'next';
import HomePage from '@/components/HomePage';

export const metadata: Metadata = {
  title: 'Vetly - Κτηνιατρική Φροντίδα στην Ελλάδα',
  description: 'Βρείτε κτηνιάτρους, κλείστε ραντεβού και διαχειριστείτε την υγεία του κατοικιδίου σας. Η Νο1 πλατφόρμα στην Ελλάδα.',
};

export default function Home() {
  return <HomePage />;
}
