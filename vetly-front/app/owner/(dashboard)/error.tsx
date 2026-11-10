'use client';

import { ClinicButton, ClinicPanel } from '@/components/vet/ClinicUI';

export default function OwnerDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ClinicPanel role="alert" className="p-6 text-center">
      <h1 className="text-base font-semibold text-ink-900">Κάτι πήγε στραβά</h1>
      <p className="mt-2 text-sm text-ink-500">Παρουσιάστηκε ένα σφάλμα. Δοκίμασε ξανά.</p>
      {error?.digest && <p className="mt-2 font-mono text-xs text-ink-400">Κωδικός: {error.digest}</p>}
      <ClinicButton variant="primary" className="mt-4 min-h-10" onClick={reset}>Δοκίμασε ξανά</ClinicButton>
    </ClinicPanel>
  );
}
