






import React, { useState } from 'react';
import { User, Pet, Appointment } from '../types';
import ShareModal from './ShareModal';
import PetHealthCharts from './PetHealthCharts';
import { ShareIcon, CalendarIcon, MapPinIcon, CheckIcon, PlusIcon, ChipIcon, PillIcon, ActivityIcon, ChartBarIcon, LightBulbIcon } from './Icons';

interface DashboardProps {
    user: User;
    onAddNewPet: () => void;
    onEditPet: (pet: Pet) => void;
    onChangeAppointment?: (appointment: Appointment) => void;
    onCancelAppointment?: (appointmentId: string) => void;
    onViewCalendar?: () => void;
    onViewGuide?: () => void; // New Prop
}

const Dashboard: React.FC<DashboardProps> = ({ user, onAddNewPet, onEditPet, onChangeAppointment, onCancelAppointment, onViewCalendar, onViewGuide }) => {
    const [shareModalPet, setShareModalPet] = useState<Pet | null>(null);
    const [statsModalPet, setStatsModalPet] = useState<Pet | null>(null);

    // Sort appointments by date (mock logic)
    const activeAppointments = user.appointments.filter(a => a.status !== 'cancelled');

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Γεια σου, {user.name} 👋</h1>
                    <p className="text-slate-600">Διαχειριστείτε τα προφίλ των κατοικιδίων σας.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                     {/* Guide Button */}
                     {onViewGuide && (
                        <button 
                            onClick={onViewGuide}
                            className="bg-white border border-slate-200 text-slate-600 hover:text-teal-600 hover:bg-slate-50 px-4 py-3 rounded-full font-bold transition-colors shadow-sm flex items-center gap-2"
                        >
                            <LightBulbIcon className="w-5 h-5" />
                            <span className="hidden sm:inline">Πώς λειτουργεί;</span>
                        </button>
                    )}
                     {/* Calendar Button */}
                     {onViewCalendar && (
                        <button 
                            onClick={onViewCalendar}
                            className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-6 py-3 rounded-full font-bold transition-colors shadow-sm flex items-center gap-2"
                        >
                            <CalendarIcon className="w-5 h-5" />
                            <span className="hidden sm:inline">Ημερολόγιο</span>
                        </button>
                    )}
                    <button 
                        onClick={onAddNewPet}
                        className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-full font-bold transition-colors shadow-md flex items-center gap-2"
                    >
                        <PlusIcon className="w-5 h-5" />
                        <span className="hidden sm:inline">Νέο Κατοικίδιο</span>
                    </button>
                </div>
            </div>

            {shareModalPet && (
                <ShareModal 
                    isOpen={!!shareModalPet} 
                    onClose={() => setShareModalPet(null)} 
                    petName={shareModalPet.name}
                    petId={shareModalPet.id}
                />
            )}

            {statsModalPet && (
                <PetHealthCharts 
                    pet={statsModalPet}
                    onClose={() => setStatsModalPet(null)}
                />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                {/* Upcoming Appointments Section */}
                <div className="lg:col-span-2">
                    {activeAppointments.length > 0 ? (
                        <div>
                             <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <CalendarIcon className="w-5 h-5 text-teal-600" />
                                Επόμενα Ραντεβού
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {activeAppointments.map(apt => (
                                    <div key={apt.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col items-start justify-between gap-4 relative overflow-hidden h-full">
                                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${apt.status === 'confirmed' ? 'bg-green-500' : 'bg-amber-400'}`}></div>
                                        
                                        <div className="flex items-center gap-4 w-full">
                                            <div className="bg-slate-100 w-14 h-14 rounded-xl flex flex-col items-center justify-center text-slate-700 shrink-0">
                                                <span className="text-xs font-bold uppercase">{new Date(apt.date).toLocaleString('el-GR', { month: 'short' })}</span>
                                                <span className="text-xl font-bold">{new Date(apt.date).getDate()}</span>
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-bold text-slate-900 truncate">{apt.type} - {apt.petName}</h3>
                                                <div className="flex items-center gap-1 text-sm text-slate-500 mt-1 truncate">
                                                    <MapPinIcon className="w-3 h-3 shrink-0" />
                                                    <span className="truncate">{apt.vetName}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between w-full mt-auto pt-4">
                                             <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">{apt.time}</span>
                                                {apt.status === 'confirmed' ? (
                                                    <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded flex items-center gap-1">
                                                        <CheckIcon className="w-3 h-3" /> OK
                                                    </span>
                                                ) : (
                                                    <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded">
                                                        Εκκρεμεί
                                                    </span>
                                                )}
                                            </div>
                                            
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => onCancelAppointment && onCancelAppointment(apt.id)}
                                                    className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                                                >
                                                    Ακύρωση
                                                </button>
                                                <button 
                                                    onClick={() => onChangeAppointment && onChangeAppointment(apt)}
                                                    className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                                                >
                                                    Αλλαγή
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8 text-center h-full flex flex-col items-center justify-center">
                            <CalendarIcon className="w-10 h-10 text-slate-300 mb-2" />
                            <p className="text-slate-500 font-medium">Κανένα προγραμματισμένο ραντεβού.</p>
                        </div>
                    )}
                </div>

                {/* Health & Calendar Quick View Card */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-teal-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-sm">
                                <ActivityIcon className="w-6 h-6 text-teal-400" />
                            </div>
                            <h2 className="text-xl font-bold">Υγεία & Αγωγές</h2>
                        </div>

                        <div className="space-y-4 mb-8">
                            {user.medications.length > 0 ? user.medications.slice(0, 3).map(med => (
                                <div key={med.id} className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                                    <div className="bg-emerald-500/20 text-emerald-400 p-2 rounded-lg">
                                        <PillIcon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">{med.name}</p>
                                        <p className="text-xs text-slate-400">{med.petName} • {med.time}</p>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-slate-400 text-sm">Δεν υπάρχουν ενεργές φαρμακευτικές αγωγές.</p>
                            )}
                        </div>
                    </div>

                    <button 
                        onClick={onViewCalendar}
                        className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold transition-colors shadow-lg flex items-center justify-center gap-2"
                    >
                        <CalendarIcon className="w-4 h-4" />
                        Προβολή Ημερολογίου
                    </button>
                </div>
            </div>

            <h2 className="text-xl font-bold text-slate-800 mb-4">Τα Κατοικίδια μου</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {user.pets.map(pet => (
                    <div key={pet.id} className="bg-white rounded-[2rem] overflow-hidden shadow-lg hover:shadow-xl transition-shadow border border-slate-100 group">
                        <div className="h-48 overflow-hidden relative">
                            <img src={pet.image} alt={pet.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                                <h3 className="text-2xl font-bold text-white">{pet.name}</h3>
                                <p className="text-white/90 text-sm">{pet.breed}</p>
                            </div>
                        </div>
                        <div className="p-6">
                            {/* Stats and Chip Info */}
                            <div className="mb-6 space-y-4">
                                <div className="flex justify-between items-center">
                                    <div className="text-center px-4 py-2 bg-slate-50 rounded-2xl">
                                        <span className="block text-slate-400 text-xs font-bold uppercase">Ηλικια</span>
                                        <span className="font-bold text-slate-800">{pet.age} Ετών</span>
                                    </div>
                                    <div className="text-center px-4 py-2 bg-slate-50 rounded-2xl">
                                        <span className="block text-slate-400 text-xs font-bold uppercase">Βαρος</span>
                                        <span className="font-bold text-slate-800">{pet.weight} kg</span>
                                    </div>
                                </div>
                                
                                {pet.chipNumber && (
                                    <div className="flex items-center justify-center gap-2 bg-slate-50 py-2 rounded-lg border border-slate-100">
                                        <ChipIcon className="w-4 h-4 text-slate-400" />
                                        <span className="text-xs font-mono text-slate-600 tracking-widest">{pet.chipNumber}</span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-bold text-slate-900 flex items-center gap-2">
                                        <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
                                        Ιστορικό Υγείας
                                    </h4>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => setStatsModalPet(pet)}
                                            className="text-indigo-600 hover:text-indigo-700 text-xs font-bold flex items-center gap-1 px-2 py-1 bg-indigo-50 rounded-lg transition-colors hover:bg-indigo-100"
                                            title="Στατιστικά"
                                        >
                                            <ChartBarIcon className="w-3 h-3" />
                                        </button>
                                        <button 
                                            onClick={() => setShareModalPet(pet)}
                                            className="text-teal-600 hover:text-teal-700 text-xs font-bold flex items-center gap-1 px-2 py-1 bg-teal-50 rounded-lg transition-colors hover:bg-teal-100"
                                            title="Κοινοποίηση"
                                        >
                                            <ShareIcon className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                                
                                {pet.history.length > 0 ? (
                                    <div className="space-y-3">
                                        {pet.history.map((event, idx) => (
                                            <div key={idx} className="text-sm border-l-2 border-slate-200 pl-3 py-1">
                                                <div className="flex justify-between text-slate-500 text-xs mb-1">
                                                    <span>{event.date}</span>
                                                </div>
                                                <p className="font-semibold text-slate-800">{event.title}</p>
                                                <p className="text-slate-500 text-xs">{event.notes}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-400 italic">Δεν υπάρχουν καταχωρήσεις ακόμα.</p>
                                )}
                            </div>

                            <button 
                                onClick={() => onEditPet(pet)}
                                className="w-full mt-6 py-3 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                            >
                                Επεξεργασία
                            </button>
                        </div>
                    </div>
                ))}
                
                {/* Quick Add Card (Empty State) */}
                <button 
                    onClick={onAddNewPet}
                    className="bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-8 text-slate-400 hover:bg-white hover:border-teal-400 hover:text-teal-600 transition-all group min-h-[400px]"
                >
                    <div className="w-16 h-16 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center mb-4 group-hover:border-teal-400 group-hover:scale-110 transition-all">
                        <PlusIcon className="w-8 h-8" />
                    </div>
                    <span className="font-bold text-lg">Προσθήκη Νέου</span>
                </button>
            </div>
        </div>
    );
};

export default Dashboard;
