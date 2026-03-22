import { Suspense } from 'react';
import PageContent from './PageContent';

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
        </div>
      }
    >
      <PageContent />
    </Suspense>
  );
}
