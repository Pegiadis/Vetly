'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useServiceTypes, useVetProfile } from '@/hooks/useVetData';

export type ClinicSetupStep = { done: boolean; label: string; href: string };

/** Profile-completion steps for a clinic. Re-checked on navigation, so a step
 *  finished on one page is reflected as soon as the vet moves on. */
export function useClinicSetup() {
  const { profile, loading: profileLoading, error: profileError, refetch: refetchProfile } = useVetProfile();
  const { total, loading: servicesLoading, error: servicesError, refetch: refetchServices } = useServiceTypes(1, 1);
  const pathname = usePathname();
  const mounted = useRef(false);
  // True once both requests have answered; later refetches keep the last values.
  const [settled, setSettled] = useState(false);

  if (!settled && !profileLoading && !servicesLoading) setSettled(true);

  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    void refetchProfile();
    void refetchServices();
  }, [pathname, refetchProfile, refetchServices]);

  const ready = settled && Boolean(profile) && !profileError && !servicesError;
  const steps: ClinicSetupStep[] = ready && profile ? [
    { done: Boolean(profile.description?.trim() && profile.image_url), label: 'Φωτογραφία και περιγραφή', href: '/vet/settings#profile-photo' },
    { done: Boolean(profile.address?.trim() && profile.city?.trim()), label: 'Διεύθυνση κτηνιατρείου', href: '/vet/settings#profile-details' },
    { done: Object.values(profile.hours || {}).some(d => !d.closed && Boolean(d.morning?.open && d.morning?.close || d.afternoon?.open && d.afternoon?.close)), label: 'Ωράριο λειτουργίας', href: '/vet/settings#working-hours' },
    { done: total > 0, label: 'Υπηρεσίες και τιμές', href: '/vet/services' },
  ] : [];

  return { ready, steps, remaining: steps.filter(step => !step.done) };
}
