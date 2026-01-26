
import React, { useState, useEffect } from 'react';
import { Vet, Appointment } from '../types';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, ClockIcon, CalendarIcon, UserIcon } from './Icons';

interface VetScheduleProps {
    vet: Vet;
    appointments: Appointment[];
    onUpdateStatus: (id: string, newStatus: 'confirmed' | 'cancelled' | 'blocked') => void;
    onBack: () => void;
    onNewAppointment: () => void;
}

const VetSchedule: React.FC<VetScheduleProps> = ({ vet, appointments, onUpdateStatus, onBack, onNewAppointment }) => {
    const [viewMode, setViewMode] = useState<'day' | 'week'>('week');
    const [currentDate, setCurrentDate] = useState(new Date());
    
    // Generate week days based on currentDate
    const getWeekDays = (date: Date) => {
        const startOfWeek = new Date(date);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
        startOfWeek.setDate(diff);

        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            days.push(d);
        }
        return days;
    };

    const weekDays = getWeekDays(currentDate);
    
    // Config
    const startHour = 8;
    const endHour = 21;
    const cellHeight = 80; // px per hour

    // Helper: Format Date to YYYY-MM-DD matches mock data
    const formatDateKey = (date: Date) => {
        return date.toISOString().split('T')[0];
    };

    // Helper: Check if today
    const isToday = (date: Date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    };

    // Normalize "Σήμερα" to actual date string for logic
    const normalizedAppointments = appointments.map(apt => ({
        ...apt,
        date: apt.date === 'Σήμερα' ? formatDateKey(new Date()) : apt.date
    }));

    const getAppointmentsForDate = (dateStr: string) => {
        return normalizedAppointments.filter(apt => apt.date === dateStr && apt.status !== 'cancelled');
    };

    const calculateTop = (time: string) => {
        const [h, m] = time.split(':').map(Number);
        return ((h - startHour) * cellHeight) + ((m / 60) * cellHeight);
    };

    // Current time indicator position
    const getCurrentTimePosition = () => {
        const now = new Date();
        const minutes = now.getHours() * 60 + now.getMinutes();
        const startMinutes = startHour * 60;
        if (minutes < startMinutes) return -1;
        return ((minutes - startMinutes) / 60) * cellHeight;
    };

    const handlePrev = () => {
        const newDate = new Date(currentDate);
        if (viewMode === 'week') newDate.setDate(newDate.getDate() - 7);
        else newDate.setDate(newDate.getDate() - 1);
        setCurrentDate(newDate);
    };

    const handleNext = () => {
        const newDate = new Date(currentDate);
        if (viewMode === 'week') newDate.setDate(newDate.getDate() + 7);
        else newDate.setDate(newDate.getDate() + 1);
        setCurrentDate(newDate);
    };

    // Render Event Block
    const renderEvent = (apt: Appointment) => {
        const top = calculateTop(apt.time);
        // Mock duration 45 mins height if not specified
        const height = (45 / 60) * cellHeight; 

        const isBlocked = apt.status === 'blocked';

        return (
            <div
                key={apt.id}
                className={`absolute left-1 right-1 rounded-lg border-l-4 p-2 text-xs shadow-sm cursor-pointer transition-all hover:brightness-95 hover:shadow-md hover:z-20 overflow-hidden ${
                    isBlocked 
                    ? 'bg-slate-100 border-slate-400 text-slate-500' 
                    : 'bg-indigo-50 border-indigo-500 text-indigo-900'
                }`}
                style={{ top: `${top}px`, height: `${height}px` }}
                onClick={() => onUpdateStatus(apt.id, 'cancelled')}
                title={`${apt.time} - ${apt.type} (${apt.petName})`}
            >
                {isBlocked ? (
                    <div className="flex items-center gap-1 h-full">
                        <span className="font-bold">Μη Διαθέσιμο</span>
                    </div>
                ) : (
                    <>
                        <div className="font-bold truncate">{apt.petName}</div>
                        <div className="truncate opacity-80">{apt.type}</div>
                    </>
                )}
            </div>
        );
    };

    // Generate Time Labels
    const timeLabels = [];
    for (let i = startHour; i <= endHour; i++) {
        timeLabels.push(
            <div key={i} className="relative" style={{ height: `${cellHeight}px` }}>
                <span className="absolute -top-3 right-2 text-xs font-medium text-slate-400">
                    {i.toString().padStart(2, '0')}:00
                </span>
                <div className="absolute top-0 right-0 w-2 border-t border-slate-200"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-8 px-4 sm:px-6 max-w-full mx-auto flex flex-col h-screen box-border">
            
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex-shrink-0 gap-4">
                <div className="flex items-center gap-6">
                    <button onClick={onBack} className="text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-1 font-bold text-sm">
                       <ChevronLeftIcon className="w-4 h-4" /> Dashboard
                    </button>
                    <h1 className="text-2xl font-bold text-slate-800">
                        {currentDate.toLocaleString('el-GR', { month: 'long', year: 'numeric' })}
                    </h1>
                    <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                        <button onClick={handlePrev} className="p-1.5 hover:bg-white rounded-md shadow-sm transition-all text-slate-600">
                            <ChevronLeftIcon className="w-5 h-5" />
                        </button>
                        <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 text-sm font-bold text-slate-600 hover:bg-white rounded-md transition-all">
                            Σήμερα
                        </button>
                        <button onClick={handleNext} className="p-1.5 hover:bg-white rounded-md shadow-sm transition-all text-slate-600">
                            <ChevronRightIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex bg-slate-100 rounded-xl p-1">
                        <button 
                            onClick={() => setViewMode('day')}
                            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${viewMode === 'day' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Ημέρα
                        </button>
                        <button 
                            onClick={() => setViewMode('week')}
                            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${viewMode === 'week' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Εβδομάδα
                        </button>
                    </div>
                    <button 
                        onClick={onNewAppointment}
                        className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-md shadow-indigo-200"
                    >
                        <PlusIcon className="w-5 h-5" />
                        <span className="hidden sm:inline">Προσθήκη</span>
                    </button>
                </div>
            </div>

            {/* Calendar Grid Container */}
            <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex overflow-hidden flex-col min-h-0">
                
                {/* Header Row (Days) */}
                <div className="flex border-b border-slate-200">
                    <div className="w-16 flex-shrink-0 border-r border-slate-200 bg-slate-50"></div> {/* Time Col Header */}
                    <div className={`flex-1 grid ${viewMode === 'week' ? 'grid-cols-7' : 'grid-cols-1'}`}>
                        {(viewMode === 'week' ? weekDays : [currentDate]).map((day, idx) => {
                            const today = isToday(day);
                            return (
                                <div key={idx} className={`text-center py-4 border-r border-slate-100 ${today ? 'bg-indigo-50/30' : ''}`}>
                                    <div className={`text-xs font-bold uppercase mb-1 ${today ? 'text-indigo-600' : 'text-slate-500'}`}>
                                        {day.toLocaleString('el-GR', { weekday: 'short' })}
                                    </div>
                                    <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-xl font-bold ${today ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-700'}`}>
                                        {day.getDate()}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Scrollable Grid Area */}
                <div className="flex-1 overflow-y-auto relative">
                    <div className="flex min-h-full">
                        
                        {/* Time Column */}
                        <div className="w-16 flex-shrink-0 border-r border-slate-200 bg-slate-50 sticky left-0 z-20">
                            {timeLabels}
                        </div>

                        {/* Days Columns */}
                        <div className={`flex-1 grid ${viewMode === 'week' ? 'grid-cols-7' : 'grid-cols-1'} relative`}>
                            
                            {/* Grid Lines */}
                            <div className="absolute inset-0 grid grid-rows-[repeat(14,1fr)] pointer-events-none z-0">
                                {Array.from({ length: endHour - startHour + 1 }).map((_, i) => (
                                    <div key={i} className="border-b border-slate-100" style={{ height: `${cellHeight}px` }}></div>
                                ))}
                            </div>

                            {/* Current Time Indicator Line */}
                            {getCurrentTimePosition() > 0 && (
                                <div 
                                    className="absolute w-full border-t-2 border-red-500 z-30 pointer-events-none opacity-80"
                                    style={{ top: `${getCurrentTimePosition()}px` }}
                                >
                                    <div className="absolute -left-2 -top-1.5 w-3 h-3 bg-red-500 rounded-full"></div>
                                </div>
                            )}

                            {/* Day Cells */}
                            {(viewMode === 'week' ? weekDays : [currentDate]).map((day, idx) => {
                                const dateKey = formatDateKey(day);
                                const dayApts = getAppointmentsForDate(dateKey);
                                const isDayToday = isToday(day);

                                return (
                                    <div key={idx} className={`relative border-r border-slate-100 h-full ${isDayToday ? 'bg-slate-50/30' : ''}`}>
                                        
                                        {/* Clickable background slots could go here */}
                                        
                                        {/* Events */}
                                        {dayApts.map(apt => renderEvent(apt))}

                                        {/* Hover Effect (Optional) - simple full height column hover */}
                                        <div className="absolute inset-0 hover:bg-indigo-50/10 pointer-events-none transition-colors"></div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default VetSchedule;
