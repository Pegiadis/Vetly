


import React, { useState } from 'react';
import { User, PetMedication, Appointment } from '../types';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, PillIcon, StethoscopeIcon, ActivityIcon, CalendarIcon, ClockIcon } from './Icons';

interface PetCalendarProps {
    user: User;
    onBack: () => void;
    onAddMedication: (medication: PetMedication) => void;
}

const PetCalendar: React.FC<PetCalendarProps> = ({ user, onBack, onAddMedication }) => {
    const [viewMode, setViewMode] = useState<'day' | 'week'>('week');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Medication Form State
    const [medForm, setMedForm] = useState<{
        petId: string;
        name: string;
        dosage: string;
        frequency: 'daily' | 'weekly' | 'once';
        time: string;
        startDate: string;
    }>({
        petId: user.pets[0]?.id || '',
        name: '',
        dosage: '',
        frequency: 'daily',
        time: '09:00',
        startDate: new Date().toISOString().split('T')[0],
    });

    // --- Helpers ---
    const startHour = 7;
    const endHour = 22;
    const cellHeight = 80; // px per hour

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
    const formatDateKey = (date: Date) => date.toISOString().split('T')[0];
    const isToday = (date: Date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
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

    const calculateTop = (time: string) => {
        const [h, m] = time.split(':').map(Number);
        return ((h - startHour) * cellHeight) + ((m / 60) * cellHeight);
    };

    const getCurrentTimePosition = () => {
        const now = new Date();
        const minutes = now.getHours() * 60 + now.getMinutes();
        const startMinutes = startHour * 60;
        if (minutes < startMinutes) return -1;
        return ((minutes - startMinutes) / 60) * cellHeight;
    };

    const handleAddSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const selectedPet = user.pets.find(p => p.id === medForm.petId);
        if (!selectedPet) return;

        const newMed: PetMedication = {
            id: `med-${Math.random().toString(36).substr(2, 9)}`,
            petId: selectedPet.id,
            petName: selectedPet.name,
            name: medForm.name,
            dosage: medForm.dosage,
            frequency: medForm.frequency,
            time: medForm.time,
            startDate: medForm.startDate
        };

        onAddMedication(newMed);
        setIsAddModalOpen(false);
        setMedForm({ ...medForm, name: '', dosage: '' });
    };

    // --- Event Generation ---
    const getEventsForDate = (date: Date) => {
        const dateKey = formatDateKey(date);
        const events: any[] = [];

        // 1. Appointments
        user.appointments.forEach(apt => {
            // Handle "Today" mock data or actual date strings
            let aptDateKey = apt.date;
            if (apt.date === 'Σήμερα') {
                aptDateKey = formatDateKey(new Date());
            }

            if (aptDateKey === dateKey && apt.status !== 'cancelled') {
                events.push({
                    id: apt.id,
                    type: 'appointment',
                    title: apt.vetName,
                    subtitle: `${apt.type} - ${apt.petName}`,
                    time: apt.time,
                    status: apt.status,
                    colorClass: apt.status === 'confirmed' 
                        ? 'bg-purple-100 text-purple-800 border-purple-300' 
                        : 'bg-purple-50 text-purple-400 border-purple-200 border-dashed',
                    icon: <StethoscopeIcon className="w-3 h-3" />
                });
            }
        });

        // 2. Medications
        user.medications.forEach(med => {
            const start = new Date(med.startDate);
            const compareDate = new Date(date);
            compareDate.setHours(0,0,0,0);
            const startDate = new Date(start);
            startDate.setHours(0,0,0,0);

            let shouldShow = false;
            if (med.frequency === 'daily') {
                shouldShow = compareDate >= startDate && (!med.endDate || compareDate <= new Date(med.endDate));
            } else if (med.frequency === 'once') {
                // Use dateKey string comparison to avoid timezone/midnight issues
                shouldShow = med.startDate === dateKey;
            }

            if (shouldShow) {
                events.push({
                    id: med.id + dateKey,
                    type: 'medication',
                    title: med.name,
                    subtitle: `${med.dosage} (${med.petName})`,
                    time: med.time,
                    status: 'active',
                    colorClass: 'bg-teal-100 text-teal-800 border-teal-300',
                    icon: <PillIcon className="w-3 h-3" />
                });
            }
        });

        return events;
    };

    const renderEventBlock = (evt: any) => {
        const top = calculateTop(evt.time);
        // Default duration: 45m for apts, 30m for meds
        const duration = evt.type === 'appointment' ? 45 : 30;
        const height = (duration / 60) * cellHeight;

        return (
            <div
                key={evt.id}
                className={`absolute left-1 right-1 rounded-lg border-l-4 p-2 text-xs shadow-sm cursor-pointer transition-all hover:brightness-95 hover:shadow-md hover:z-20 overflow-hidden ${evt.colorClass}`}
                style={{ top: `${top}px`, height: `${height}px` }}
                title={`${evt.title} - ${evt.subtitle}`}
            >
                <div className="flex items-start gap-1">
                    <div className="mt-0.5">{evt.icon}</div>
                    <div className="min-w-0">
                        <div className="font-bold truncate">{evt.title}</div>
                        <div className="truncate opacity-80">{evt.subtitle}</div>
                    </div>
                </div>
                {evt.status === 'pending' && (
                    <div className="absolute bottom-1 right-2 text-[10px] font-bold uppercase opacity-70">
                        Αναμονη
                    </div>
                )}
            </div>
        );
    };

    // Time labels for grid
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
        <div className="min-h-screen pt-24 pb-8 px-4 sm:px-6 max-w-full mx-auto flex flex-col h-screen box-border bg-slate-50">
            
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex-shrink-0 gap-4">
                <div className="flex items-center gap-6">
                    <button onClick={onBack} className="text-slate-500 hover:text-teal-600 transition-colors flex items-center gap-1 font-bold text-sm">
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
                            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${viewMode === 'day' ? 'bg-white shadow-sm text-teal-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Ημέρα
                        </button>
                        <button 
                            onClick={() => setViewMode('week')}
                            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${viewMode === 'week' ? 'bg-white shadow-sm text-teal-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Εβδομάδα
                        </button>
                    </div>
                    <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-teal-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-teal-700 transition-colors flex items-center gap-2 shadow-md shadow-teal-200"
                    >
                        <PlusIcon className="w-5 h-5" />
                        <span className="hidden sm:inline">Νέα Αγωγή</span>
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex overflow-hidden flex-col min-h-0 relative">
                
                {/* Days Header */}
                <div className="flex border-b border-slate-200">
                    <div className="w-16 flex-shrink-0 border-r border-slate-200 bg-slate-50"></div>
                    <div className={`flex-1 grid ${viewMode === 'week' ? 'grid-cols-7' : 'grid-cols-1'}`}>
                        {(viewMode === 'week' ? weekDays : [currentDate]).map((day, idx) => {
                            const today = isToday(day);
                            return (
                                <div key={idx} className={`text-center py-4 border-r border-slate-100 ${today ? 'bg-teal-50/30' : ''}`}>
                                    <div className={`text-xs font-bold uppercase mb-1 ${today ? 'text-teal-600' : 'text-slate-500'}`}>
                                        {day.toLocaleString('el-GR', { weekday: 'short' })}
                                    </div>
                                    <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-xl font-bold ${today ? 'bg-teal-600 text-white shadow-lg shadow-teal-200' : 'text-slate-700'}`}>
                                        {day.getDate()}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Time Grid */}
                <div className="flex-1 overflow-y-auto relative custom-scrollbar">
                    <div className="flex min-h-full">
                        
                        {/* Time Column */}
                        <div className="w-16 flex-shrink-0 border-r border-slate-200 bg-slate-50 sticky left-0 z-20">
                            {timeLabels}
                        </div>

                        {/* Cells */}
                        <div className={`flex-1 grid ${viewMode === 'week' ? 'grid-cols-7' : 'grid-cols-1'} relative`}>
                            
                            {/* Horizontal Lines */}
                            <div className="absolute inset-0 grid grid-rows-[repeat(16,1fr)] pointer-events-none z-0">
                                {Array.from({ length: endHour - startHour + 1 }).map((_, i) => (
                                    <div key={i} className="border-b border-slate-100" style={{ height: `${cellHeight}px` }}></div>
                                ))}
                            </div>

                            {/* Current Time Line */}
                            {getCurrentTimePosition() > 0 && (
                                <div 
                                    className="absolute w-full border-t-2 border-red-500 z-30 pointer-events-none opacity-80"
                                    style={{ top: `${getCurrentTimePosition()}px` }}
                                >
                                    <div className="absolute -left-2 -top-1.5 w-3 h-3 bg-red-500 rounded-full"></div>
                                </div>
                            )}

                            {/* Events Rendering */}
                            {(viewMode === 'week' ? weekDays : [currentDate]).map((day, idx) => {
                                const events = getEventsForDate(day);
                                const isDayToday = isToday(day);

                                return (
                                    <div key={idx} className={`relative border-r border-slate-100 h-full ${isDayToday ? 'bg-slate-50/30' : ''}`}>
                                        {events.map(evt => renderEventBlock(evt))}
                                        <div className="absolute inset-0 hover:bg-teal-50/10 pointer-events-none transition-colors"></div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Medication Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] p-8 w-full max-w-md animate-scale-in relative">
                        <button 
                            onClick={() => setIsAddModalOpen(false)}
                            className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"
                        >
                            &times;
                        </button>
                        
                        <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <div className="bg-teal-100 p-2 rounded-xl text-teal-600">
                                <PillIcon className="w-6 h-6" />
                            </div>
                            Νέα Αγωγή
                        </h2>

                        <form onSubmit={handleAddSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Κατοικίδιο</label>
                                <select 
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500"
                                    value={medForm.petId}
                                    onChange={e => setMedForm({...medForm, petId: e.target.value})}
                                >
                                    {user.pets.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Φάρμακο</label>
                                <input 
                                    type="text" 
                                    placeholder="π.χ. Αντιβίωση"
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500"
                                    value={medForm.name}
                                    onChange={e => setMedForm({...medForm, name: e.target.value})}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Δοσολογία</label>
                                    <input 
                                        type="text" 
                                        placeholder="π.χ. 1 χάπι"
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500"
                                        value={medForm.dosage}
                                        onChange={e => setMedForm({...medForm, dosage: e.target.value})}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Ώρα</label>
                                    <input 
                                        type="time" 
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500"
                                        value={medForm.time}
                                        onChange={e => setMedForm({...medForm, time: e.target.value})}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Συχνότητα</label>
                                <div className="flex bg-slate-50 p-1 rounded-xl">
                                    <button 
                                        type="button"
                                        onClick={() => setMedForm({...medForm, frequency: 'daily'})}
                                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${medForm.frequency === 'daily' ? 'bg-white shadow text-teal-700' : 'text-slate-500'}`}
                                    >
                                        Καθημερινά
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setMedForm({...medForm, frequency: 'once'})}
                                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${medForm.frequency === 'once' ? 'bg-white shadow text-teal-700' : 'text-slate-500'}`}
                                    >
                                        Μια φορά
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Ημερομηνία Έναρξης</label>
                                <input 
                                    type="date" 
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500"
                                    value={medForm.startDate}
                                    onChange={e => setMedForm({...medForm, startDate: e.target.value})}
                                    required
                                />
                            </div>

                            <button 
                                type="submit"
                                className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-teal-600 transition-colors shadow-lg mt-4"
                            >
                                Αποθήκευση
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PetCalendar;