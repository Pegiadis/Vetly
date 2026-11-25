import type { Metadata } from 'next';
import { Suspense } from 'react';
import PageContent from './PageContent';

export const metadata: Metadata = {
  title: 'Ορισμός κωδικού',
  robots: { index: false, follow: false },
};

export default function VetActivatePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-clinic-600" />
        </div>
      }
    >
      <PageContent />
    </Suspense>
  );
}
