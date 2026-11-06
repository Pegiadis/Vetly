'use client';

import { useState } from 'react';
import { getImageUrl } from '@/lib/api';

export default function ClinicAvatar({ name, imageUrl, large = false }: { name: string; imageUrl?: string | null; large?: boolean }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const initials = name.trim().split(/\s+/).slice(0, 2).map(part => Array.from(part)[0] || '').join('').toLocaleUpperCase('el-GR') || '?';
  return <span className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-clinic-100 bg-clinic-50 font-semibold text-clinic-800 ${large ? 'h-14 w-14 text-lg' : 'h-9 w-9 text-xs'}`}>
    {imageUrl && failedUrl !== imageUrl ? <img src={getImageUrl(imageUrl)} alt={name} className="h-full w-full object-cover" onError={() => setFailedUrl(imageUrl)} /> : <span aria-label={name}>{initials}</span>}
  </span>;
}
