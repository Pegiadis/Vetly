import type { ComponentPropsWithRef, ReactNode } from 'react';

const cx = (...values: (string | undefined)[]) => values.filter(Boolean).join(' ');

export function ClinicButton({ variant = 'secondary', className, ...props }: ComponentPropsWithRef<'button'> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' }) {
  const colors = {
    primary: 'bg-clinic-600 text-white hover:bg-clinic-700',
    secondary: 'bg-black/[0.06] text-ink-900 hover:bg-black/10',
    danger: 'bg-red-50 text-red-700 hover:bg-red-100',
    ghost: 'bg-transparent text-ink-700 hover:bg-black/[0.06]',
  };
  // Do not default type: native submit behavior is retained for existing forms.
  return <button {...props} className={cx('inline-flex min-h-8 items-center justify-center gap-2 rounded-[10px] border border-transparent px-3 py-1 text-[13px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clinic-600 disabled:pointer-events-none disabled:opacity-50 [&>svg]:h-4 [&>svg]:w-4 [&>svg]:shrink-0', colors[variant], className)} />;
}

export function ClinicPanel({ className, ...props }: ComponentPropsWithRef<'div'>) {
  return <div {...props} className={cx('rounded-xl border border-ink-200 bg-white text-ink-800', className)} />;
}

export function ClinicHeading({ className, ...props }: ComponentPropsWithRef<'h1'>) {
  return <h1 {...props} className={cx('text-2xl font-semibold tracking-tight text-ink-900', className)} />;
}

export function ClinicPageHeader({ title, description, actions }: { title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return <header className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><ClinicHeading>{title}</ClinicHeading>{description && <p className="mt-1.5 text-sm text-ink-500">{description}</p>}</div>{actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}</header>;
}

const field = 'min-h-9 rounded-[10px] border border-ink-300 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-clinic-600 focus:outline-2 focus:outline-offset-1 focus:outline-clinic-200 disabled:bg-ink-50 disabled:text-ink-500';
export function ClinicInput({ className, ...props }: ComponentPropsWithRef<'input'>) { return <input {...props} className={cx(field, className)} />; }
export function ClinicSelect({ className, ...props }: ComponentPropsWithRef<'select'>) { return <select {...props} className={cx(field, className)} />; }
export function ClinicTextarea({ className, ...props }: ComponentPropsWithRef<'textarea'>) { return <textarea {...props} className={cx(field, 'resize-y', className)} />; }

export function ClinicFilterTabs({ options, value, onChange, label }: { options: readonly { value: string; label: string }[]; value: string; onChange: (value: string) => void; label: string }) {
  return <div role="group" aria-label={label} className="flex flex-wrap gap-1 border-b border-ink-200 px-3 py-2">{options.map(option => <button key={option.value} type="button" aria-pressed={value === option.value} onClick={() => onChange(option.value)} className={cx('rounded-[10px] px-3 py-1.5 text-[13px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-clinic-600', value === option.value ? 'bg-black/[0.06] text-ink-900' : 'text-ink-500 hover:bg-black/[0.04]')}>{option.label}</button>)}</div>;
}

export function ClinicToolbar({ children }: { children: ReactNode }) { return <div className="flex flex-wrap items-center gap-2 border-b border-ink-200 bg-white px-4 py-3">{children}</div>; }

export function ClinicStatusBadge({ status, children }: { status: string; children: ReactNode }) {
  const color = status === 'pending' ? 'bg-[#ffe0c7] text-[#622700]' : status === 'cancelled' || status === 'rejected' ? 'bg-red-50 text-red-700' : status === 'completed' ? 'bg-clinic-100 text-clinic-800' : 'bg-ink-100 text-ink-700';
  return <span className={cx('inline-flex h-5 items-center gap-1.5 whitespace-nowrap rounded-full px-2 text-xs font-medium', color)}><span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-60" aria-hidden="true" />{children}</span>;
}

export function ClinicListRow({ className, ...props }: ComponentPropsWithRef<'div'>) { return <div {...props} className={cx('border-b border-ink-200 bg-white px-4 py-3 last:border-b-0 hover:bg-ink-50/40 sm:px-5', className)} />; }

export function ClinicEmptyState({ title, description, children }: { title: string; description?: string; children?: ReactNode }) {
  return <div className="px-5 py-12 text-center"><h2 className="text-sm font-semibold text-ink-800">{title}</h2>{description && <p className="mx-auto mt-2 max-w-md text-sm text-ink-500">{description}</p>}{children && <div className="mt-4 flex justify-center">{children}</div>}</div>;
}

export function ClinicLoading({ label = 'Φόρτωση…' }: { label?: string }) { return <div role="status" className="flex items-center justify-center gap-3 p-12 text-sm text-ink-500"><span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-200 border-t-clinic-600" aria-hidden="true" />{label}</div>; }

export function ClinicTable({ className, ...props }: ComponentPropsWithRef<'table'>) { return <table {...props} className={cx('w-full border-collapse text-left text-sm [&_thead]:bg-ink-50 [&_tbody_tr]:border-b [&_tbody_tr]:border-ink-100 [&_tbody_tr:last-child]:border-b-0 [&_tbody_tr:hover]:bg-ink-50/50', className)} />; }
export function ClinicTableHead({ className, scope = 'col', ...props }: ComponentPropsWithRef<'th'>) { return <th {...props} scope={scope} className={cx('px-3 py-2 text-left text-xs font-medium text-ink-500', className)} />; }
export function ClinicTableCell({ className, ...props }: ComponentPropsWithRef<'td'>) { return <td {...props} className={cx('px-3 py-3 align-middle text-sm text-ink-700', className)} />; }

export function ClinicCollectionHeader({ title, description }: { title: string; description?: string }) {
  return <div className="border-b border-ink-200 px-4 py-3"><h2 className="text-sm font-semibold text-ink-900">{title}</h2>{description && <p className="mt-1 text-xs leading-5 text-ink-500">{description}</p>}</div>;
}

export function ClinicPagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (page: number) => void }) {
  if (totalPages <= 1) return null;
  return <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-ink-200 bg-white px-4 py-2"><p className="text-xs text-ink-500">Σελίδα {page} από {totalPages}</p><div className="flex gap-1"><ClinicButton aria-label="Προηγούμενη σελίδα" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>‹</ClinicButton><ClinicButton aria-label="Επόμενη σελίδα" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>›</ClinicButton></div></div>;
}
