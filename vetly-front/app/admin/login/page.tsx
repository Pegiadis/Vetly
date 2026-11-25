import { Suspense } from 'react';
import PageContent from './PageContent';

export default function AdminLoginPage() {
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
