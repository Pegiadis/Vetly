
import React, { useState } from 'react';
import { Appointment } from '../types';
import { ChevronLeftIcon, ClipboardIcon, UserGroupIcon, CheckIcon, XIcon, PhoneIcon, ClockIcon, CalendarIcon, SmartphoneIcon } from './Icons';

interface VetAppointmentsTodayProps {
    appointments: Appointment[];
    onBack: () => void;
    onUpdateStatus: (id: string, newStatus: 'confirmed' | 'cancelled' | 'completed') => void;
}

const VetAppointmentsToday: React.FC<VetAppointmentsTodayProps> = ({ appointments, onBack, onUpdateStatus }) => {
    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = appointments.filter(a => 
        (a.status === 'confirmed' && (a.date === 'Σήμερα' || a.date === today))
    );

    // Track which reminders have been sent
    const [remindersSent, setRemindersSent] = useState<Set<string>>(new Set());

    // Sort by time
    todayAppointments.sort((a, b) => a.time.localeCompare(b.time));

    const handleSendReminder = (id: string) => {
        setRemindersSent(prev => new Set(prev).add(id));
        // In a real app, this would call an API endpoint
    };

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <button 
                    onClick={onBack}
                    className="flex items-center text-slate-500 hover:text-indigo-600 transition-colors font-medium group"
                >
                    <span className="transform group-hover:-translate-x-1 transition-transform inline-block mr-2">←</span> 
                    Πίσω στο Dashboard
                </button>
                <div className="text-right">
                    <h1 className="text-2xl font-bold text-slate-900">Ραντεβού Σήμερα</h1>
                    <p className="text-slate-500 text-sm">{new Date().toLocaleDateString('el-GR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                </div>
            </div>

            {/* Content */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                {todayAppointments.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                        {todayAppointments.map((apt) => {
                            const isReminderSent = remindersSent.has(apt.id);
                            return (
                                <div key={apt.id} className="p-6 flex flex-col md:flex-row items-start md:items-center gap-6 hover:bg-slate-50 transition-colors group">
                                    {/* Time & Status */}
                                    <div className="flex flex-col items-center min-w-[80px]">
                                        <span className="text-xl font-bold text-slate-800">{apt.time}</span>
                                        <div className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded mt-1">
                                            <ClockIcon className="w-3 h-3" /> Active
                                        </div>
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900">{apt.petName}</h3>
                                                <p className="text-indigo-600 font-medium">{apt.type}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => {}} 
                                                    className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-colors"
                                                    title="Ιστορικό"
                                                >
                                                    <ClipboardIcon className="w-5 h-5" />
                                                </button>
                                                <button 
                                                    onClick={() => handleSendReminder(apt.id)}
                                                    disabled={isReminderSent}
                                                    className={`p-2 border rounded-lg transition-all flex items-center gap-1 ${
                                                        isReminderSent 
                                                        ? 'bg-green-50 border-green-200 text-green-600' 
                                                        : 'bg-white border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50'
                                                    }`}
                                                    title={isReminderSent ? "Υπενθύμιση εστάλη" : "Αποστολή SMS Υπενθύμισης"}
                                                >
                                                    {isReminderSent ? <CheckIcon className="w-5 h-5" /> : <SmartphoneIcon className="w-5 h-5" />}
                                                    {isReminderSent && <span className="text-xs font-bold">Εστάλη</span>}
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-3 flex items-center gap-6 text-sm text-slate-500">
                                            <div className="flex items-center gap-2">
                                                <UserGroupIcon className="w-4 h-4" />
                                                <span className="font-medium text-slate-700">{apt.ownerName}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <PhoneIcon className="w-4 h-4" />
                                                <span>+30 690...</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-3 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                                        <button 
                                            onClick={() => onUpdateStatus(apt.id, 'cancelled')}
                                            className="px-4 py-2 border border-slate-200 rounded-xl text-slate-500 font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-colors flex-1 md:flex-none text-sm"
                                        >
                                            No Show
                                        </button>
                                        <button 
                                            onClick={() => onUpdateStatus(apt.id, 'completed')}
                                            className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 flex-1 md:flex-none text-sm shadow-md"
                                        >
                                            <CheckIcon className="w-4 h-4" />
                                            Ολοκλήρωση
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="p-12 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CalendarIcon className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">Δεν υπάρχουν άλλα ραντεβού σήμερα</h3>
                        <p className="text-slate-500">Χαλαρώστε ή προετοιμαστείτε για αύριο!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VetAppointmentsToday;
