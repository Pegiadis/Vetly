'use client';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    pages.push(1);
    if (page > 3) pages.push('...');
    if (page > 2) pages.push(page - 1);
    if (page !== 1 && page !== totalPages) pages.push(page);
    if (page < totalPages - 1) pages.push(page + 1);
    if (page < totalPages - 2) pages.push('...');
    if (totalPages > 1) pages.push(totalPages);
    return pages;
  };

  return (
    <div className="flex flex-col items-center gap-3 mt-6">
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className={`p-2 rounded-xl transition-colors ${
            page === 1
              ? 'text-slate-300 bg-slate-100 cursor-not-allowed'
              : 'text-slate-700 bg-slate-100 hover:bg-slate-200'
          }`}
          aria-label="Προηγούμενη σελίδα"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {getPageNumbers().map((p, i) =>
          p === '...' ? (
            <span key={`e${i}`} className="px-2 py-2 text-slate-400 font-bold text-sm">...</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={`min-w-[36px] py-2 rounded-xl font-bold text-sm transition-colors ${
                p === page
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className={`p-2 rounded-xl transition-colors ${
            page === totalPages
              ? 'text-slate-300 bg-slate-100 cursor-not-allowed'
              : 'text-slate-700 bg-slate-100 hover:bg-slate-200'
          }`}
          aria-label="Επόμενη σελίδα"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      <p className="text-sm text-slate-500">Σελίδα {page} από {totalPages}</p>
    </div>
  );
}
