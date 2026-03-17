'use client';

import { useState, useMemo } from 'react';

interface CalendarPickerProps {
  value: string | null;
  onChange: (date: string) => void;
  minDate?: Date;
  maxDate?: Date;
  accentColor?: 'teal' | 'indigo' | 'red';
}

const DAYS_GR = ['Δε', 'Τρ', 'Τε', 'Πε', 'Πα', 'Σα', 'Κυ'];
const MONTHS_GR = [
  'Ιανουάριος', 'Φεβρουάριος', 'Μάρτιος', 'Απρίλιος',
  'Μάιος', 'Ιούνιος', 'Ιούλιος', 'Αύγουστος',
  'Σεπτέμβριος', 'Οκτώβριος', 'Νοέμβριος', 'Δεκέμβριος',
];

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function stripTime(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export default function CalendarPicker({
  value,
  onChange,
  minDate,
  maxDate,
  accentColor = 'teal',
}: CalendarPickerProps) {
  const today = stripTime(new Date());
  const initialMonth = value ? new Date(value + 'T00:00:00') : today;
  const [viewMonth, setViewMonth] = useState(initialMonth.getMonth());
  const [viewYear, setViewYear] = useState(initialMonth.getFullYear());

  const min = minDate ? stripTime(minDate) : null;
  const max = maxDate ? stripTime(maxDate) : null;

  const accentMap = {
    indigo: {
      bg: 'bg-indigo-600', bgLight: 'bg-indigo-50', text: 'text-indigo-600',
      ring: 'ring-indigo-200', hoverBg: 'hover:bg-indigo-50',
      selectedText: 'text-white', todayRing: 'ring-indigo-300',
    },
    red: {
      bg: 'bg-red-600', bgLight: 'bg-red-50', text: 'text-red-600',
      ring: 'ring-red-200', hoverBg: 'hover:bg-red-50',
      selectedText: 'text-white', todayRing: 'ring-red-300',
    },
    teal: {
      bg: 'bg-teal-600', bgLight: 'bg-teal-50', text: 'text-teal-600',
      ring: 'ring-teal-200', hoverBg: 'hover:bg-teal-50',
      selectedText: 'text-white', todayRing: 'ring-teal-300',
    },
  };
  const accent = accentMap[accentColor];

  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    // Monday = 0, Sunday = 6
    let startDow = firstDay.getDay() - 1;
    if (startDow < 0) startDow = 6;

    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const days: (Date | null)[] = [];

    // Padding for days before the 1st
    for (let i = 0; i < startDow; i++) {
      days.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(new Date(viewYear, viewMonth, d));
    }
    return days;
  }, [viewMonth, viewYear]);

  const canGoPrev = () => {
    if (!min) return true;
    const prevMonth = new Date(viewYear, viewMonth - 1, 1);
    const minMonth = new Date(min.getFullYear(), min.getMonth(), 1);
    return prevMonth >= minMonth;
  };

  const canGoNext = () => {
    if (!max) return true;
    const nextMonth = new Date(viewYear, viewMonth + 1, 1);
    const maxMonth = new Date(max.getFullYear(), max.getMonth(), 1);
    return nextMonth <= maxMonth;
  };

  const goToPrev = () => {
    if (!canGoPrev()) return;
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const goToNext = () => {
    if (!canGoNext()) return;
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const isDisabled = (d: Date) => {
    if (min && d < min) return true;
    if (max && d > max) return true;
    return false;
  };

  const isSelected = (d: Date) => {
    return value === toDateStr(d);
  };

  const isToday = (d: Date) => {
    return d.getTime() === today.getTime();
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPrev}
          disabled={!canGoPrev()}
          className="p-2 rounded-xl hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h4 className="font-bold text-slate-800 text-sm">
          {MONTHS_GR[viewMonth]} {viewYear}
        </h4>
        <button
          onClick={goToNext}
          disabled={!canGoNext()}
          className="p-2 rounded-xl hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 mb-2">
        {DAYS_GR.map((day) => (
          <div key={day} className="text-center text-xs font-bold text-slate-400 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Day Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, i) => {
          if (!day) {
            return <div key={`empty-${i}`} />;
          }

          const disabled = isDisabled(day);
          const selected = isSelected(day);
          const todayMark = isToday(day);

          return (
            <button
              key={toDateStr(day)}
              onClick={() => !disabled && onChange(toDateStr(day))}
              disabled={disabled}
              className={`
                relative h-10 rounded-xl text-sm font-medium transition-all
                ${disabled
                  ? 'text-slate-300 cursor-not-allowed'
                  : selected
                    ? `${accent.bg} ${accent.selectedText} shadow-sm`
                    : todayMark
                      ? `${accent.text} font-bold ring-2 ${accent.todayRing} ${accent.hoverBg}`
                      : `text-slate-700 ${accent.hoverBg} hover:font-bold`
                }
              `}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
