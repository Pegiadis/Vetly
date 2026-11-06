import { Suspense } from 'react';
import type { Metadata } from 'next';
import MobileAuthLink from './MobileAuthLink';

export const metadata: Metadata = {
  title: 'Vetly · Ο λογαριασμός σου',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};
export default function MobileAuthPage() {
  return <Suspense fallback={<p className="p-8">Φόρτωση…</p>}><MobileAuthLink/></Suspense>;
}
