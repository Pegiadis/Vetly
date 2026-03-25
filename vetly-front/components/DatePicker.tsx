'use client';

import { useState, useRef, useEffect } from 'react';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  dropUp?: boolean;
}

const MONTHS_EL = [
  'Ιανουάριος', 'Φεβρουάριος', 'Μάρτιος', 'Απρίλιος',
  'Μάιος', 'Ιούνιος', 'Ιούλιος', 'Αύγουστος',
  'Σεπτέμβριος', 'Οκτώβριος', 'Νοέμβριος', 'Δεκέμβριος',
];

const MONTHS_SHORT_EL = [
  'Ιαν', 'Φεβ', 'Μαρ', 'Απρ', 'Μαΐ', 'Ιουν',
  'Ιουλ', 'Αυγ', 'Σεπ', 'Οκτ', 'Νοε', 'Δεκ',
];

const DAYS_EL = ['Δε', 'Τρ', 'Τε', 'Πε', 'Πα', 'Σα', 'Κυ'];

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

function toDateStr(y: number, m: number, d: number) {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

function formatDisplay(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getDate()} ${MONTHS_SHORT_EL[d.getMonth()]} ${d.getFullYear()}`;
}

export default function DatePicker({ value, onChange, placeholder = 'Επιλέξτε ημ/νία', dropUp = false }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const today = new Date();
  const initial = value ? new Date(value) : today;
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // When value changes externally, sync the view
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [value]);

  const firstDay = new Date(viewYear, viewMonth, 1);
  const startWeekday = (firstDay.getDay() + 6) % 7; // Monday-based
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const selectDay = (day: number) => {
    onChange(toDateStr(viewYear, viewMonth, day));
    setOpen(false);
  };

  const goToToday = () => {
    const t = new Date();
    setViewYear(t.getFullYear());
    setViewMonth(t.getMonth());
    onChange(toDateStr(t.getFullYear(), t.getMonth(), t.getDate()));
    setOpen(false);
  };

  const clear = () => {
    onChange('');
    setOpen(false);
  };

  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <div className="relative" ref={ref}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
          value
            ? 'bg-teal-50 text-teal-700 border border-teal-200 hover:border-teal-300'
            : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'
        }`}
      >
        <svg className={`w-4 h-4 flex-shrink-0 ${value ? 'text-teal-500' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="whitespace-nowrap">{value ? formatDisplay(value) : placeholder}</span>
        {value && (
          <span
            role="button"
            onClick={(e) => { e.stopPropagation(); clear(); }}
            className="ml-0.5 text-teal-400 hover:text-teal-600 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </span>
        )}
      </button>

      {/* Dropdown Calendar */}
      {open && (
        <div className={`absolute left-0 z-50 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 w-[288px] animate-in fade-in duration-150 ${dropUp ? 'bottom-full mb-2' : 'top-full mt-2'}`}>
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={prevMonth}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm font-bold text-slate-800">
              {MONTHS_EL[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS_EL.map(d => (
              <div key={d} className="h-8 flex items-center justify-center text-[11px] font-bold text-slate-400 uppercase">
                {d}
              </div>
            ))}
          </div>

          {/* Day Grid */}
          <div className="grid grid-cols-7">
            {/* Empty offset cells */}
            {Array.from({ length: startWeekday }).map((_, i) => (
              <div key={`empty-${i}`} className="h-9" />
            ))}

            {/* Day buttons */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = toDateStr(viewYear, viewMonth, day);
              const isSelected = value === dateStr;
              const isToday = dateStr === todayStr;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => selectDay(day)}
                  className={`h-9 w-full rounded-lg text-sm transition-all ${
                    isSelected
                      ? 'bg-teal-600 text-white font-bold shadow-sm'
                      : isToday
                        ? 'bg-teal-50 text-teal-700 font-bold ring-1 ring-teal-200'
                        : 'text-slate-700 hover:bg-slate-100 font-medium'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={clear}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors px-2 py-1 rounded-lg hover:bg-slate-50"
            >
              Καθαρισμός
            </button>
            <button
              type="button"
              onClick={goToToday}
              className="text-xs font-bold text-teal-600 hover:text-teal-700 transition-colors px-2 py-1 rounded-lg hover:bg-teal-50"
            >
              Σήμερα
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
