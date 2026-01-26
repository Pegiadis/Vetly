
import React, { useState } from 'react';
import { Vet, Appointment } from '../types';
import { ClockIcon, UserGroupIcon, CalendarIcon, CheckIcon, XIcon, ClipboardIcon, ChartBarIcon, StethoscopeIcon, MapPinIcon, CalendarPlusIcon, TrendingUpIcon } from './Icons';

interface VetDashboardProps {
    vet: Vet;
    appointments: Appointment[];
    onUpdateStatus: (id: string, newStatus: 'confirmed' | 'cancelled') => void;
    onNavigateToPatients: () => void;
    onNewAppointmentClick: () => void;
    onNavigateToToday: () => void;
    onNavigateToPending: () => void;
    onNavigateToReviews: () => void;
    onNavigateToAnalytics: () => void;
    onNavigateToProfileSettings: () => void; // Added prop
}

const VetDashboard: React.FC<VetDashboardProps> = ({ 
    vet, 
    appointments, 
    onUpdateStatus, 
    onNavigateToPatients, 
    onNewAppointmentClick,
    onNavigateToToday,
    onNavigateToPending,
    onNavigateToReviews,
    onNavigateToAnalytics,
    onNavigateToProfileSettings
}) => {
    const [isOnCall, setIsOnCall] = useState(vet.isOnCall);
    
    // Filter appointments for dashboard
    const pendingAppointments = appointments.filter(a => a.status === 'pending');
    
    // Simple check for today's appointments
    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = appointments.filter(a => 
        (a.status === 'confirmed' && (a.date === 'Σήμερα' || a.date === today))
    );

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto font-sans">
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Dashboard Ιατρείου</h1>
                    <p className="text-slate-500">Καλώς ήρθατε, {vet.name}</p>
                </div>
                
                <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                    <div className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${isOnCall ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                        {isOnCall ? 'Διαθέσιμος (On-Call)' : 'Εκτός Υπηρεσίας'}
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={isOnCall} 
                            onChange={() => setIsOnCall(!isOnCall)} 
                            className="sr-only peer" 
                        />
                        <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-500"></div>
                    </label>
                </div>
            </div>

            {/* Stats Cards - 5 Columns Grid for Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-10">
                <button 
                    onClick={onNavigateToToday}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:border-indigo-300 hover:shadow-md transition-all text-left"
                >
                    <div className="flex items-center gap-4">
                        <div className="bg-indigo-100 p-3 rounded-xl text-indigo-600">
                            <CalendarIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-slate-500 text-xs font-bold uppercase">Ραντεβου</p>
                            <h3 className="text-2xl font-bold text-slate-800">{todayAppointments.length}</h3>
                        </div>
                    </div>
                </button>
                <button 
                    onClick={onNavigateToPending}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:border-amber-300 hover:shadow-md transition-all text-left"
                >
                    <div className="flex items-center gap-4">
                        <div className="bg-amber-100 p-3 rounded-xl text-amber-600">
                            <ClockIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-slate-500 text-xs font-bold uppercase">Εκκρεμουν</p>
                            <h3 className="text-2xl font-bold text-slate-800">{pendingAppointments.length}</h3>
                        </div>
                    </div>
                </button>
                <button 
                    onClick={onNavigateToPatients}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:border-teal-300 hover:shadow-md transition-all text-left"
                >
                    <div className="flex items-center gap-4">
                        <div className="bg-teal-100 p-3 rounded-xl text-teal-600">
                            <UserGroupIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-slate-500 text-xs font-bold uppercase">Ασθενεις</p>
                            <h3 className="text-2xl font-bold text-slate-800">142</h3>
                        </div>
                    </div>
                </button>
                <button 
                    onClick={onNavigateToReviews}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:border-rose-300 hover:shadow-md transition-all text-left"
                >
                    <div className="flex items-center gap-4">
                        <div className="bg-rose-100 p-3 rounded-xl text-rose-600">
                            <ChartBarIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-slate-500 text-xs font-bold uppercase">Rating</p>
                            <h3 className="text-2xl font-bold text-slate-800">{vet.rating}</h3>
                        </div>
                    </div>
                </button>
                <button 
                    onClick={onNavigateToAnalytics}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:border-emerald-300 hover:shadow-md transition-all text-left"
                >
                    <div className="flex items-center gap-4">
                        <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600">
                            <TrendingUpIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-slate-500 text-xs font-bold uppercase">Analytics</p>
                            <h3 className="text-xl font-bold text-slate-800 text-xs mt-1">Προβολή</h3>
                        </div>
                    </div>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Main Column: Pending & Schedule */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* Pending Requests Section Summary */}
                    {pendingAppointments.length > 0 && (
                        <div className="bg-white rounded-[2rem] p-8 shadow-lg border border-amber-100 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-500"></div>
                            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                                    Αιτήματα για Έγκριση
                                </span>
                                <button onClick={onNavigateToPending} className="text-sm text-amber-600 font-bold hover:underline">Προβολή Όλων</button>
                            </h3>
                            
                            <div className="space-y-4">
                                {pendingAppointments.slice(0, 3).map(apt => (
                                    <div key={apt.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-amber-200 transition-colors">
                                        <div className="flex items-center gap-4 mb-4 sm:mb-0">
                                            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-lg">
                                                {apt.petName?.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800">{apt.petName} <span className="text-slate-400 font-normal text-sm">({apt.ownerName})</span></h4>
                                                <p className="text-sm text-slate-600 font-medium">{apt.type}</p>
                                                <div className="flex items-center gap-2 mt-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded w-fit">
                                                    <CalendarIcon className="w-3 h-3" />
                                                    {apt.date}, {apt.time}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 w-full sm:w-auto">
                                            <button 
                                                onClick={() => onUpdateStatus(apt.id, 'cancelled')}
                                                className="flex-1 sm:flex-none p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                                title="Απόρριψη"
                                            >
                                                <XIcon className="w-6 h-6" />
                                            </button>
                                            <button 
                                                onClick={() => onUpdateStatus(apt.id, 'confirmed')}
                                                className="flex-1 sm:flex-none px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-bold shadow-md flex items-center justify-center gap-2"
                                            >
                                                <CheckIcon className="w-4 h-4" /> Έγκριση
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Daily Schedule Summary */}
                    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-800">Πρόγραμμα Ημέρας</h3>
                            <button 
                                onClick={onNewAppointmentClick}
                                className="text-sm font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-2"
                            >
                                <CalendarPlusIcon className="w-4 h-4" />
                                Νέο Ραντεβού
                            </button>
                        </div>
                        
                        {todayAppointments.length > 0 ? (
                            <div className="space-y-0 relative">
                                {/* Vertical Line */}
                                <div className="absolute left-[4.5rem] top-2 bottom-2 w-0.5 bg-slate-100"></div>

                                {todayAppointments.map((apt, idx) => (
                                    <div key={apt.id} className="flex gap-6 items-start relative py-4 group hover:bg-slate-50 rounded-xl px-2 transition-colors -mx-2">
                                        <div className="w-14 text-sm font-bold text-slate-500 pt-1">{apt.time}</div>
                                        <div className="w-3 h-3 bg-indigo-500 rounded-full mt-2 relative z-10 ring-4 ring-white group-hover:ring-slate-50"></div>
                                        <div className="flex-1 bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-bold text-indigo-900">{apt.petName}</h4>
                                                    <p className="text-sm text-indigo-700 mb-2">{apt.type}</p>
                                                    <div className="flex items-center gap-1 text-xs text-indigo-600/70">
                                                        <UserGroupIcon className="w-3 h-3" />
                                                        Ιδιοκτήτης: {apt.ownerName}
                                                    </div>
                                                </div>
                                                <div className="bg-white/50 p-2 rounded-lg cursor-pointer hover:bg-white transition-colors text-indigo-600">
                                                    <ClipboardIcon className="w-5 h-5" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 text-slate-400">
                                <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <CalendarIcon className="w-8 h-8 text-slate-300" />
                                </div>
                                Κανένα ραντεβού για σήμερα.
                            </div>
                        )}
                         <button onClick={onNavigateToToday} className="w-full mt-6 py-2 text-indigo-600 font-bold text-sm bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors">
                            Προβολή Όλων
                        </button>
                    </div>
                </div>

                {/* Right Column: Profile & Quick Access */}
                <div className="space-y-8">
                    
                    {/* Profile Card Mini */}
                    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 text-center">
                        <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4 border-4 border-slate-50">
                            <img src={vet.image} alt={vet.name} className="w-full h-full object-cover" />
                        </div>
                        <h3 className="font-bold text-slate-900 text-lg">{vet.name}</h3>
                        <p className="text-indigo-600 text-sm font-medium mb-4">{vet.specialty}</p>
                        <div className="flex justify-center gap-2 text-xs text-slate-500 mb-6">
                            <span className="flex items-center gap-1"><MapPinIcon className="w-3 h-3" /> {vet.city}</span>
                        </div>
                        <button 
                            onClick={onNavigateToProfileSettings}
                            className="w-full py-2 border border-slate-200 rounded-xl text-slate-600 text-sm font-bold hover:bg-slate-50 transition-colors"
                        >
                            Επεξεργασία Προφίλ
                        </button>
                    </div>

                    {/* Recent Patients (Mock) */}
                    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center justify-between">
                            Πρόσφατοι Ασθενείς
                            <button 
                                onClick={onNavigateToPatients}
                                className="text-xs text-indigo-600 font-bold hover:text-indigo-800"
                            >
                                Όλοι
                            </button>
                        </h3>
                        <div className="space-y-4">
                            {['Μάξ', 'Λούνα', 'Κόκο', 'Θόρ'].map((name, i) => (
                                <div key={i} className="flex items-center justify-between group cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold">
                                            {name[0]}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">{name}</p>
                                            <p className="text-xs text-slate-400">Σκύλος • 3 Ετών</p>
                                        </div>
                                    </div>
                                    <button className="p-2 text-slate-300 hover:text-indigo-600 transition-colors">
                                        <StethoscopeIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VetDashboard;
