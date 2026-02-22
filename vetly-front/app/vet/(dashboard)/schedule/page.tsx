'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useWeekAppointments, approveAppointment, rejectAppointment, VetAppointment } from '@/hooks/useVetData';
import CreateAppointmentDialog from '@/components/vet/CreateAppointmentDialog';

const weekDayLabels = ['Δευ', 'Τρι', 'Τετ', 'Πεμ', 'Παρ', 'Σαβ', 'Κυρ'];
const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatDateISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatShortDate(d: Date): string {
  return d.toLocaleDateString('el-GR', { day: 'numeric', month: 'short' });
}

const statusColors: Record<string, string> = {
  confirmed: 'bg-indigo-100 border-indigo-200 text-indigo-900',
  pending: 'bg-amber-100 border-amber-200 text-amber-900',
  completed: 'bg-green-100 border-green-200 text-green-900',
  cancelled: 'bg-slate-100 border-slate-200 text-slate-500',
};

const statusLabels: Record<string, string> = {
  pending: 'Εκκρεμεί',
  confirmed: 'Επιβεβαιωμένο',
  completed: 'Ολοκληρωμένο',
  cancelled: 'Ακυρωμένο',
};

function AppointmentCard({
  apt,
  onApprove,
  onReject,
}: {
  apt: VetAppointment;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const [showPopover, setShowPopover] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
          cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setShowPopover(false);
      }
    }
    if (showPopover) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showPopover]);

  const dt = new Date(apt.scheduled_at);
  const timeStr = `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
  const dateStr = dt.toLocaleDateString('el-GR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="relative">
      <div
        ref={cardRef}
        onClick={() => setShowPopover(!showPopover)}
        className={`border rounded-lg p-2 text-xs mb-1 cursor-pointer transition-shadow hover:shadow-md ${statusColors[apt.status] || 'bg-slate-100 border-slate-200 text-slate-700'}`}
      >
        <div className="font-bold">{apt.pet?.name || 'Ασθενής'}</div>
        <div className="opacity-75">{apt.type}</div>
        {apt.pet_owner && (
          <div className="opacity-60 truncate">{apt.pet_owner.name}</div>
        )}
      </div>

      {showPopover && (
        <div
          ref={popoverRef}
          className="absolute z-50 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-4 left-1/2 -translate-x-1/2 mt-1"
          style={{ top: '100%' }}
        >
          {/* Arrow */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-l border-t border-slate-200 rotate-45" />

          {/* Status badge */}
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${statusColors[apt.status]}`}>
              {statusLabels[apt.status] || apt.status}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); setShowPopover(false); }}
              className="text-slate-400 hover:text-slate-600"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Pet info */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-lg">{apt.pet?.type === 'Dog' ? '🐕' : apt.pet?.type === 'Cat' ? '🐈' : '🐾'}</span>
              <div>
                <p className="font-bold text-slate-800">{apt.pet?.name || 'Ασθενής'}</p>
                <p className="text-xs text-slate-500">{apt.pet?.breed} &middot; {apt.pet?.type}</p>
              </div>
            </div>

            {/* Owner info */}
            {apt.pet_owner && (
              <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-2">
                <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xs">
                  {apt.pet_owner.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-slate-700 text-xs">{apt.pet_owner.name}</p>
                  {apt.pet_owner.phone && (
                    <p className="text-xs text-slate-400">{apt.pet_owner.phone}</p>
                  )}
                </div>
              </div>
            )}

            {/* Appointment details */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <p className="text-xs text-slate-400">Τύπος</p>
                <p className="font-medium text-slate-700">{apt.type}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Διάρκεια</p>
                <p className="font-medium text-slate-700">{apt.duration_minutes} λεπτά</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Ημ/νία</p>
                <p className="font-medium text-slate-700">{dateStr}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Ώρα</p>
                <p className="font-medium text-slate-700">{timeStr}</p>
              </div>
            </div>

            {apt.notes && (
              <div className="pt-1">
                <p className="text-xs text-slate-400">Σημειώσεις</p>
                <p className="text-slate-700 text-xs bg-slate-50 rounded-lg p-2 mt-1">{apt.notes}</p>
              </div>
            )}
          </div>

          {/* Actions for pending */}
          {apt.status === 'pending' && (
            <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
              <button
                onClick={(e) => { e.stopPropagation(); onReject(apt.id); setShowPopover(false); }}
                className="flex-1 px-3 py-2 text-xs font-bold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
              >
                Απόρριψη
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onApprove(apt.id); setShowPopover(false); }}
                className="flex-1 px-3 py-2 text-xs font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
              >
                Έγκριση
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function VetSchedulePage() {
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const weekStartISO = formatDateISO(weekStart);
  const { appointments, loading, error, refetch } = useWeekAppointments(weekStartISO);
  const [showCreateAppt, setShowCreateAppt] = useState(false);

  const weekDates = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const grid = useMemo(() => {
    const map: Record<string, VetAppointment[]> = {};
    for (const apt of appointments) {
      const dt = new Date(apt.scheduled_at);
      const dayIndex = (() => {
        const day = dt.getDay();
        return day === 0 ? 6 : day - 1;
      })();
      const hour = String(dt.getHours()).padStart(2, '0') + ':00';
      const key = `${dayIndex}-${hour}`;
      if (!map[key]) map[key] = [];
      map[key].push(apt);
    }
    return map;
  }, [appointments]);

  const handleApprove = async (id: string) => {
    try {
      await approveAppointment(id);
      refetch();
    } catch {
      // silently fail
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectAppointment(id);
      refetch();
    } catch {
      // silently fail
    }
  };

  const goToPrevWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
  };

  const goToNextWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
  };

  const goToToday = () => {
    setWeekStart(getMonday(new Date()));
  };

  const weekLabel = `${weekDates[0].toLocaleDateString('el-GR', { day: 'numeric', month: 'long' })} - ${weekDates[6].toLocaleDateString('el-GR', { day: 'numeric', month: 'long', year: 'numeric' })}`;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <Link href="/vet/dashboard" className="text-slate-500 text-sm font-bold mb-2 hover:text-indigo-600 block">
            &larr; Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">Πρόγραμμα Εβδομάδας</h1>
          <p className="text-slate-500 text-sm mt-1">{weekLabel}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={goToPrevWeek}
            className="px-4 py-2 bg-slate-100 rounded-xl text-slate-600 font-medium hover:bg-slate-200"
          >
            &larr; Προηγ.
          </button>
          <button
            onClick={goToToday}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700"
          >
            Σήμερα
          </button>
          <button
            onClick={goToNextWeek}
            className="px-4 py-2 bg-slate-100 rounded-xl text-slate-600 font-medium hover:bg-slate-200"
          >
            Επόμ. &rarr;
          </button>
          <button
            onClick={() => setShowCreateAppt(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Νέο Ραντεβού
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-visible">
          {/* Days Header */}
          <div className="grid grid-cols-8 border-b border-slate-100">
            <div className="p-4 bg-slate-50 rounded-tl-2xl" />
            {weekDates.map((date, i) => {
              const isToday = date.getTime() === today.getTime();
              return (
                <div key={i} className={`p-4 text-center border-l border-slate-100 ${isToday ? 'bg-indigo-50' : ''} ${i === 6 ? 'rounded-tr-2xl' : ''}`}>
                  <span className={`text-sm font-bold ${isToday ? 'text-indigo-600' : 'text-slate-600'}`}>
                    {weekDayLabels[i]}
                  </span>
                  <div className={`text-lg font-bold mt-1 ${isToday ? 'text-indigo-900' : 'text-slate-800'}`}>
                    {formatShortDate(date)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Time Slots */}
          {timeSlots.map(time => (
            <div key={time} className="grid grid-cols-8 border-b border-slate-50 last:border-0">
              <div className="p-4 bg-slate-50 text-sm font-bold text-slate-500">{time}</div>
              {weekDates.map((_, dayIndex) => {
                const key = `${dayIndex}-${time}`;
                const apts = grid[key] || [];
                return (
                  <div key={dayIndex} className="p-2 border-l border-slate-50 min-h-[80px] relative overflow-visible">
                    {apts.map(apt => (
                      <AppointmentCard
                        key={apt.id}
                        apt={apt}
                        onApprove={handleApprove}
                        onReject={handleReject}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {!loading && !error && appointments.length === 0 && (
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Δεν υπάρχουν ραντεβού</h3>
          <p className="text-slate-500">Δεν υπάρχουν προγραμματισμένα ραντεβού για αυτή την εβδομάδα.</p>
        </div>
      )}

      {/* Create Appointment Dialog */}
      <CreateAppointmentDialog
        open={showCreateAppt}
        onClose={() => setShowCreateAppt(false)}
        onSuccess={refetch}
      />
    </div>
  );
}
