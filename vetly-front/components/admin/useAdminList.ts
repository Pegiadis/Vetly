'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { adminApi } from '@/lib/admin-api';
import type { AdminPage } from '@/types/admin';

/**
 * A paged, filtered admin list whose status, search and page live in the URL,
 * so a link from the overview opens the right view and reload keeps it.
 */
export function useAdminList<T extends { id: string }>(endpoint: string, statuses: readonly string[]) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const rawStatus = params.get('status') ?? '';
  const status = statuses.includes(rawStatus) ? rawStatus : '';
  const q = params.get('q') ?? '';
  const page = Math.max(1, Number(params.get('page')) || 1);

  const [data, setData] = useState<AdminPage<T> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const query = new URLSearchParams();
    if (status) query.set('status', status);
    if (q) query.set('q', q);
    if (page > 1) query.set('page', String(page));
    try {
      setData(await adminApi.get<AdminPage<T>>(`${endpoint}${query.size ? `?${query}` : ''}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Δεν ήταν δυνατή η φόρτωση.');
    }
  }, [endpoint, status, q, page]);

  useEffect(() => { void load(); }, [load]);

  const navigate = useCallback((next: { status?: string; q?: string; page?: number }) => {
    const query = new URLSearchParams();
    const merged = { status, q, page: 1, ...next };
    if (merged.status) query.set('status', merged.status);
    if (merged.q) query.set('q', merged.q);
    if (merged.page > 1) query.set('page', String(merged.page));
    router.replace(`${pathname}${query.size ? `?${query}` : ''}`);
  }, [router, pathname, status, q]);

  /** Swaps in the updated row an action returned, without reloading the page. */
  const replaceItem = useCallback((item: T) => {
    setData(current => current && { ...current, items: current.items.map(row => (row.id === item.id ? item : row)) });
  }, []);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1;
  return { status, q, page, data, error, load, navigate, replaceItem, totalPages };
}
