'use client';

import ErrorFallback from '@/components/ErrorFallback';

export default function OwnerDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorFallback error={error} reset={reset} colorScheme="teal" />;
}
