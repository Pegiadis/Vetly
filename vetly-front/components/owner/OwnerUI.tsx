import type { ReactNode } from 'react';
import { ClinicButton } from '@/components/vet/ClinicUI';

const focus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clinic-600';
/** Link styled as the primary / secondary button; 40px tall so it is a comfortable thumb target. */
export const linkPrimary = `inline-flex min-h-10 items-center justify-center rounded-[10px] bg-clinic-600 px-4 py-1 text-[13px] font-medium text-white hover:bg-clinic-700 ${focus}`;
export const linkSecondary = `inline-flex min-h-10 items-center justify-center rounded-[10px] bg-black/[0.06] px-4 py-1 text-[13px] font-medium text-ink-900 hover:bg-black/10 ${focus}`;
export const textLink = 'text-xs font-medium text-clinic-700 underline-offset-4 hover:underline';
/** Taller button for primary actions on phones. */
export const tallButton = 'min-h-10';
/** Text field sized for touch. */
export const fieldClass = 'h-10 w-full';

/** Current Athens wall-clock time as `YYYY-MM-DDTHH:mm:ss`, comparable with appointment timestamps. */
export const athensNow = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Athens', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).format(new Date()).replace(' ', 'T');

/** Formats the calendar day of a wall-clock or date-only string without any timezone conversion. */
export const formatDay = (value: string, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }) =>
  new Intl.DateTimeFormat('el-GR', options).format(new Date(`${value.slice(0, 10)}T12:00:00`));

export const speciesLabels: Record<string, string> = { Dog: 'Σκύλος', Cat: 'Γάτα', Bird: 'Πτηνό', Rabbit: 'Κουνέλι', Hamster: 'Χάμστερ', Fish: 'Ψάρι', Reptile: 'Ερπετό', Other: 'Άλλο' };

export function ErrorBlock({ message = 'Δεν φορτώθηκαν τα στοιχεία.', onRetry }: { message?: string; onRetry?: () => unknown }) {
  return <div role="alert" className="p-5 text-sm text-ink-600"><p>{message}</p>{onRetry && <ClinicButton className="mt-3" onClick={() => void onRetry()}>Επανάληψη</ClinicButton>}</div>;
}

export function InlineAlert({ children }: { children: ReactNode }) {
  return <p role="alert" className="rounded-[10px] bg-red-50 px-3 py-2 text-sm text-red-700">{children}</p>;
}

/** Title row for drawer content, with a close button that stays easy to hit on phones. */
export function DrawerHeader({ title, onClose, disabled, subtitle }: { title: ReactNode; onClose: () => void; disabled?: boolean; subtitle?: ReactNode }) {
  return <div className="flex items-start justify-between gap-3"><div className="min-w-0">{subtitle && <p className="mb-1 text-xs text-ink-500">{subtitle}</p>}<h2 className="break-words text-lg font-semibold tracking-tight text-ink-900">{title}</h2></div><ClinicButton variant="ghost" className="min-h-10 shrink-0" disabled={disabled} onClick={onClose} aria-label="Κλείσιμο">Κλείσιμο ×</ClinicButton></div>;
}

export function Field({ label, hint, error, className = '', children }: { label: string; hint?: string; error?: string | false; className?: string; children: ReactNode }) {
  return <label className={`block min-w-0 text-sm font-medium text-ink-700 ${className}`}>{label}{hint && <span className="ml-1 text-xs font-normal text-ink-400">{hint}</span>}<span className="mt-1.5 block">{children}</span>{error && <span className="mt-1 block text-xs font-normal text-red-700">{error}</span>}</label>;
}

/** One label / value pair for detail grids. */
export function Fact({ label, children }: { label: string; children: ReactNode }) {
  return <div className="min-w-0"><dt className="text-xs text-ink-500">{label}</dt><dd className="mt-1 break-words text-sm font-medium text-ink-900">{children}</dd></div>;
}
