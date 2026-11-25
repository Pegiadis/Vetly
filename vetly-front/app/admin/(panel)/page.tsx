'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ClinicButton, ClinicLoading, ClinicPageHeader, ClinicPanel, ClinicTable, ClinicTableCell, ClinicTableHead } from '@/components/vet/ClinicUI';
import { adminApi } from '@/lib/admin-api';
import type { AdminOverview } from '@/types/admin';

const weekLabel = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString('el-GR', { day: 'numeric', month: 'short' });

function Stat({ label, value, href, note }: { label: string; value: number; href?: string; note?: string }) {
  const body = <>
    <p className="text-xs font-medium text-ink-500">{label}</p>
    <p className="mt-1 text-2xl font-semibold tabular-nums text-ink-900">{value.toLocaleString('el-GR')}</p>
    {note && <p className="mt-1 text-xs text-ink-500">{note}</p>}
  </>;
  return href
    ? <Link href={href} className="block rounded-xl border border-ink-200 bg-white p-4 hover:border-ink-300 hover:bg-ink-50/50 focus-visible:outline-2 focus-visible:outline-clinic-600">{body}</Link>
    : <div className="rounded-xl border border-ink-200 bg-white p-4">{body}</div>;
}

export default function AdminOverviewPage() {
  const [data, setData] = useState<AdminOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await adminApi.get<AdminOverview>('/overview'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Δεν ήταν δυνατή η φόρτωση.');
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return <div>
    <ClinicPageHeader title="Επισκόπηση" description="Λογαριασμοί και κίνηση στην πλατφόρμα. Ιατρικά δεδομένα και μηνύματα δεν εμφανίζονται εδώ." />
    {error ? <ClinicPanel className="space-y-3 p-5"><p role="alert" className="text-sm text-red-700">{error}</p><ClinicButton onClick={() => { void load(); }}>Δοκιμή ξανά</ClinicButton></ClinicPanel>
      : !data ? <ClinicPanel><ClinicLoading /></ClinicPanel>
      : <>
        {data.demo_requests.new > 0 && <Link href="/admin/demo-requests?status=new" className="mb-5 flex items-center justify-between gap-3 rounded-xl bg-[#ffe0c7] px-4 py-3 text-sm font-medium text-[#622700] hover:bg-[#ffd4b0]">
          <span>{data.demo_requests.new === 1 ? '1 νέο αίτημα demo' : `${data.demo_requests.new} νέα αιτήματα demo`}</span><span aria-hidden="true">→</span>
        </Link>}
        <section aria-label="Κτηνίατροι" className="grid gap-3 sm:grid-cols-4">
          <Stat label="Αιτήματα demo" value={data.demo_requests.total} href="/admin/demo-requests" note={`${data.demo_requests.new} νέα`} />
          <Stat label="Ενεργοί κτηνίατροι" value={data.vets.active} href="/admin/vets?status=active" />
          <Stat label="Χωρίς κωδικό ακόμα" value={data.vets.invited} href="/admin/vets?status=invited" />
          <Stat label="Ανενεργοί ή κλειστοί" value={data.vets.suspended + data.vets.closed} href="/admin/vets?status=suspended" />
        </section>
        <section aria-label="Κηδεμόνες" className="mt-3 grid gap-3 sm:grid-cols-3">
          <Stat label="Κηδεμόνες" value={data.owners.total} href="/admin/owners" />
          <Stat label="Χωρίς επιβεβαίωση email" value={data.owners.unverified} href="/admin/owners?status=unverified" />
          <Stat label="Σε αναστολή" value={data.owners.suspended} href="/admin/owners?status=suspended" />
        </section>
        <section aria-label="Ραντεβού" className="mt-3 grid gap-3 sm:grid-cols-3">
          <Stat label="Νέα ραντεβού, 7 ημέρες" value={data.appointments.last_7_days} />
          <Stat label="Νέα ραντεβού, 30 ημέρες" value={data.appointments.last_30_days} />
          <Stat label="Προγραμματισμένα" value={data.appointments.upcoming} note="Σε αναμονή ή επιβεβαιωμένα" />
        </section>
        <ClinicPanel className="mt-6 overflow-hidden">
          <div className="border-b border-ink-200 px-4 py-3"><h2 className="text-sm font-semibold">Ανά εβδομάδα</h2><p className="mt-0.5 text-xs text-ink-500">Νέα αιτήματα, λογαριασμοί και ραντεβού, τελευταίες 8 εβδομάδες.</p></div>
          <div className="overflow-x-auto"><ClinicTable className="min-w-[560px]">
            <thead><tr><ClinicTableHead>Εβδομάδα από</ClinicTableHead><ClinicTableHead className="text-right">Αιτήματα demo</ClinicTableHead><ClinicTableHead className="text-right">Κτηνίατροι</ClinicTableHead><ClinicTableHead className="text-right">Κηδεμόνες</ClinicTableHead><ClinicTableHead className="text-right">Ραντεβού</ClinicTableHead></tr></thead>
            <tbody>{[...data.weeks].reverse().map(week => <tr key={week.week_start}>
              <ClinicTableCell className="whitespace-nowrap">{weekLabel(week.week_start)}</ClinicTableCell>
              <ClinicTableCell className="text-right tabular-nums">{week.demo_requests}</ClinicTableCell>
              <ClinicTableCell className="text-right tabular-nums">{week.vets}</ClinicTableCell>
              <ClinicTableCell className="text-right tabular-nums">{week.owners}</ClinicTableCell>
              <ClinicTableCell className="text-right tabular-nums">{week.appointments}</ClinicTableCell>
            </tr>)}</tbody>
          </ClinicTable></div>
        </ClinicPanel>
      </>}
  </div>;
}
