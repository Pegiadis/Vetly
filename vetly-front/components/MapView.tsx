'use client';

import dynamic from 'next/dynamic';

export const VetMapPicker = dynamic(
  () => import('./MapComponents').then(mod => mod.VetMapPickerInner),
  { ssr: false, loading: () => <div className="h-full w-full bg-ink-100 rounded-xl animate-pulse flex items-center justify-center text-ink-400">Φόρτωση χάρτη...</div> }
);

export const VetSearchMap = dynamic(
  () => import('./MapComponents').then(mod => mod.VetSearchMapInner),
  { ssr: false, loading: () => <div className="h-full w-full bg-ink-100 rounded-xl animate-pulse flex items-center justify-center text-ink-400">Φόρτωση χάρτη...</div> }
);

export const OnCallMap = dynamic(
  () => import('./MapComponents').then(mod => mod.OnCallMapInner),
  { ssr: false, loading: () => <div className="h-full w-full bg-ink-100 rounded-xl animate-pulse flex items-center justify-center text-ink-400">Φόρτωση χάρτη...</div> }
);
