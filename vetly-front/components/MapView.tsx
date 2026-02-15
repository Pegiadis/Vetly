'use client';

import dynamic from 'next/dynamic';

export const VetMapPicker = dynamic(
  () => import('./MapComponents').then(mod => mod.VetMapPickerInner),
  { ssr: false, loading: () => <div className="h-full w-full bg-slate-100 rounded-xl animate-pulse flex items-center justify-center text-slate-400">Φόρτωση χάρτη...</div> }
);

export const VetSearchMap = dynamic(
  () => import('./MapComponents').then(mod => mod.VetSearchMapInner),
  { ssr: false, loading: () => <div className="h-full w-full bg-slate-100 rounded-xl animate-pulse flex items-center justify-center text-slate-400">Φόρτωση χάρτη...</div> }
);
