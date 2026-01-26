
import React, { useState, useEffect } from 'react';
import { Appointment } from '../types';
import { CheckIcon, XIcon, CalendarIcon, UserIcon, SmartphoneIcon } from './Icons';

interface VetPendingRequestsProps {
    appointments: Appointment[];
    onBack: () => void;
    onUpdateStatus: (id: string, newStatus: 'confirmed' | 'cancelled') => void;
}

const VetPendingRequests: React.FC<VetPendingRequestsProps> = ({ appointments, onBack, onUpdateStatus }) => {
    const pendingAppointments = appointments.filter(a => a.status === 'pending');
    const [confirmedId, setConfirmedId] = useState<string | null>(null);

    // Handle confirmation with simulated SMS toast
    const handleConfirm = (id: string) => {
        setConfirmedId(id);
        onUpdateStatus(id, 'confirmed');
        // Reset toast after 3 seconds
        setTimeout(() => setConfirmedId(null), 3000);
    };

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto relative">
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
                    <h1 className="text-2xl font-bold text-slate-900">Εκκρεμή Αιτήματα</h1>
                    <p className="text-slate-500 text-sm">{pendingAppointments.length} αιτήματα σε αναμονή</p>
                </div>
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 gap-4">
                {pendingAppointments.length > 0 ? pendingAppointments.map(apt => (
                    <div key={apt.id} className="bg-white rounded-2xl p-6 shadow-sm border border-amber-100 hover:border-amber-200 transition-all">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 font-bold text-2xl shrink-0">
                                    {apt.petName?.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800 mb-1">{apt.petName}</h3>
                                    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                                        <span className="font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{apt.type}</span>
                                        <span className="flex items-center gap-1"><UserIcon className="w-3 h-3" /> {apt.ownerName}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2 font-bold text-slate-700">
                                        <CalendarIcon className="w-4 h-4 text-amber-500" />
                                        {apt.date}, {apt.time}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                                <button 
                                    onClick={() => onUpdateStatus(apt.id, 'cancelled')}
                                    className="px-6 py-3 border border-slate-200 rounded-xl text-red-500 font-bold hover:bg-red-50 hover:border-red-100 transition-colors flex-1 md:flex-none flex items-center justify-center gap-2"
                                >
                                    <XIcon className="w-5 h-5" />
                                    Απόρριψη
                                </button>
                                <button 
                                    onClick={() => handleConfirm(apt.id)}
                                    className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2 flex-1 md:flex-none shadow-lg"
                                >
                                    <CheckIcon className="w-5 h-5" />
                                    Έγκριση
                                </button>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="bg-white rounded-[2rem] p-12 text-center border border-slate-100">
                        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckIcon className="w-10 h-10 text-green-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">Όλα εντάξει!</h3>
                        <p className="text-slate-500">Δεν υπάρχουν εκκρεμή αιτήματα αυτή τη στιγμή.</p>
                    </div>
                )}
            </div>

            {/* Success Toast */}
            <div className={`fixed bottom-8 right-8 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 transition-all duration-500 z-50 transform ${confirmedId ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}`}>
                <div className="bg-green-500 p-2 rounded-full">
                    <SmartphoneIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                    <p className="font-bold text-sm">Το ραντεβού εγκρίθηκε</p>
                    <p className="text-xs text-slate-300">Εστάλη SMS επιβεβαίωσης στον ιδιοκτήτη.</p>
                </div>
            </div>

        </div>
    );
};

export default VetPendingRequests;
