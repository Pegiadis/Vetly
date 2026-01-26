
import React, { useState } from 'react';
import { Appointment } from '../types';
import { CalendarIcon, ClockIcon, CheckIcon, ArrowRightIcon } from './Icons';

interface ChangeAppointmentProps {
    appointment: Appointment;
    onSave: (updatedAppointment: Appointment) => void;
    onCancel: () => void;
}

const ChangeAppointment: React.FC<ChangeAppointmentProps> = ({ appointment, onSave, onCancel }) => {
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [selectedTime, setSelectedTime] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const availableTimes = ['09:00', '10:00', '11:30', '14:00', '16:30', '18:00'];

    const handleSubmit = () => {
        if (!selectedDate || !selectedTime) return;
        
        setIsSubmitting(true);
        
        // Simulate API call
        setTimeout(() => {
            const updatedAppointment = {
                ...appointment,
                date: selectedDate,
                time: selectedTime,
                status: 'pending' as const // Reset to pending if rescheduling usually requires re-approval
            };
            
            setShowSuccess(true);
            
            setTimeout(() => {
                onSave(updatedAppointment);
            }, 2000);
        }, 1500);
    };

    if (showSuccess) {
        return (
            <div className="min-h-screen pt-24 pb-12 px-4 flex items-center justify-center">
                <div className="text-center animate-scale-in max-w-md w-full bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-green-50">
                        <CheckIcon className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Η Αλλαγή Ολοκληρώθηκε!</h2>
                    <p className="text-slate-600 mb-6">
                        Το ραντεβού μεταφέρθηκε για τις <br/>
                        <span className="font-bold text-slate-800">{selectedDate}</span> στις <span className="font-bold text-slate-800">{selectedTime}</span>.
                    </p>
                    <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg mb-4">
                        Σημείωση: Η αλλαγή ενδέχεται να χρειαστεί εκ νέου έγκριση από τον ιατρό.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <button 
                    onClick={onCancel}
                    className="flex items-center text-slate-500 hover:text-teal-600 transition-colors font-medium group"
                >
                    <span className="transform group-hover:-translate-x-1 transition-transform inline-block mr-2">←</span> 
                    Πίσω
                </button>
                <h1 className="text-2xl font-bold text-slate-900">Αλλαγή Ραντεβού</h1>
                <div className="w-20"></div> 
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
                {/* Current Details Header */}
                <div className="bg-slate-900 text-white p-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <p className="text-teal-400 font-bold text-sm uppercase tracking-wider mb-1">Τρεχον Ραντεβου</p>
                            <h2 className="text-2xl font-bold">{appointment.vetName}</h2>
                            <p className="text-slate-300">{appointment.type} για τον/την {appointment.petName}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10">
                            <div className="flex items-center gap-2 mb-1">
                                <CalendarIcon className="w-4 h-4 text-teal-300" />
                                <span className="font-bold">{appointment.date}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-300">
                                <ClockIcon className="w-4 h-4" />
                                <span>{appointment.time}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-sm font-bold">1</span>
                        Επιλέξτε Νέα Ημερομηνία
                    </h3>
                    
                    <div className="mb-8">
                         <input 
                            type="date" 
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none font-medium text-slate-700"
                            onChange={(e) => setSelectedDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                        />
                    </div>

                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-sm font-bold">2</span>
                        Επιλέξτε Νέα Ώρα
                    </h3>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-10">
                        {availableTimes.map(time => (
                            <button
                                key={time}
                                onClick={() => setSelectedTime(time)}
                                className={`py-3 rounded-xl text-sm font-bold transition-all border-2 ${
                                    selectedTime === time 
                                    ? 'border-teal-500 bg-teal-50 text-teal-700 shadow-md transform scale-105' 
                                    : 'border-slate-100 bg-white text-slate-500 hover:border-teal-200 hover:bg-slate-50'
                                }`}
                            >
                                {time}
                            </button>
                        ))}
                    </div>

                    {/* Comparison / Confirmation Area */}
                    {(selectedDate && selectedTime) && (
                        <div className="bg-teal-50 rounded-2xl p-6 mb-8 border border-teal-100 animate-fade-in">
                            <div className="flex items-center justify-between text-sm">
                                <div className="text-slate-500 line-through">{appointment.date} • {appointment.time}</div>
                                <ArrowRightIcon className="w-5 h-5 text-teal-500" />
                                <div className="font-bold text-teal-700 text-lg">{selectedDate} • {selectedTime}</div>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-100">
                        <button 
                            onClick={onCancel}
                            className="flex-1 py-4 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
                        >
                            Ακύρωση
                        </button>
                        <button 
                            disabled={!selectedDate || !selectedTime || isSubmitting}
                            onClick={handleSubmit}
                            className="flex-[2] py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-teal-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    Επεξεργασία...
                                </>
                            ) : (
                                'Επιβεβαίωση Αλλαγής'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChangeAppointment;
