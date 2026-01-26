
import React, { useState } from 'react';
import { VetPatient, Appointment } from '../types';
import { CalendarIcon, ClockIcon, UserIcon, CheckIcon, SaveIcon, SmartphoneIcon } from './Icons';

interface VetNewAppointmentProps {
    patients: VetPatient[];
    onSave: (appointment: Appointment) => void;
    onCancel: () => void;
    vetId: string;
    initialPatientId?: string; // Optional prop for pre-selection
}

const VetNewAppointment: React.FC<VetNewAppointmentProps> = ({ patients, onSave, onCancel, vetId, initialPatientId }) => {
    const [selectedPatientId, setSelectedPatientId] = useState(initialPatientId || '');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [type, setType] = useState('Εξέταση');
    const [notes, setNotes] = useState('');
    const [sendSms, setSendSms] = useState(true);
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Filtered selected patient details for display
    const selectedPatient = patients.find(p => p.id === selectedPatientId);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPatient) return;

        setIsSubmitting(true);

        setTimeout(() => {
            const newAppointment: Appointment = {
                id: `vet-apt-${Math.random().toString(36).substr(2, 9)}`,
                vetId: vetId,
                petId: selectedPatientId,
                date: date,
                time: time,
                status: 'confirmed', // Vet created appointments are auto-confirmed
                vetName: 'Ιατρείο (Εσείς)',
                petName: selectedPatient.name,
                ownerName: selectedPatient.ownerName,
                type: type
            };

            setShowSuccess(true);
            setTimeout(() => {
                onSave(newAppointment);
            }, 2500);
        }, 1000);
    };

    if (showSuccess) {
        return (
            <div className="min-h-screen pt-24 pb-12 px-4 flex items-center justify-center bg-slate-50">
                <div className="text-center animate-scale-in bg-white p-10 rounded-3xl shadow-xl border border-slate-100 max-w-lg w-full">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-green-50">
                        <CheckIcon className="w-12 h-12 text-green-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-4">Ραντεβού Καταχωρήθηκε!</h2>
                    <div className="bg-slate-50 p-5 rounded-2xl text-left mb-6 border border-slate-100">
                         <p className="text-slate-600 text-sm mb-3 font-medium">
                            Ειδοποιήσεις που στάλθηκαν:
                        </p>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-slate-700 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                                    <UserIcon className="w-4 h-4" />
                                </div>
                                <div>
                                    <span className="block font-bold text-sm">{selectedPatient?.ownerName}</span>
                                    <span className="text-xs text-slate-500">Ιδιοκτήτης</span>
                                </div>
                            </div>
                            
                            {sendSms && (
                                <div className="flex items-center gap-3 text-green-700 bg-green-50 p-3 rounded-xl border border-green-100">
                                    <div className="w-8 h-8 bg-green-200 rounded-full flex items-center justify-center text-green-700">
                                        <SmartphoneIcon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <span className="block font-bold text-sm">SMS Εστάλη</span>
                                        <span className="text-xs text-green-600">Στο {selectedPatient?.ownerPhone}</span>
                                    </div>
                                    <CheckIcon className="w-4 h-4 ml-auto" />
                                </div>
                            )}
                        </div>
                    </div>
                    <p className="text-slate-500 text-sm">Επιστροφή στο πρόγραμμα...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <button 
                    onClick={onCancel}
                    className="flex items-center text-slate-500 hover:text-indigo-600 transition-colors font-medium group"
                >
                    <span className="transform group-hover:-translate-x-1 transition-transform inline-block mr-2">←</span> 
                    Ακύρωση
                </button>
                <h1 className="text-2xl font-bold text-slate-900">Νέο Ραντεβού</h1>
                <div className="w-20"></div> 
            </div>

            <div className="bg-white rounded-[2rem] p-8 shadow-lg border border-slate-100">
                <form onSubmit={handleSubmit} className="space-y-8">
                    
                    {/* Patient Selection */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Επιλογή Ασθενή</label>
                        <select 
                            value={selectedPatientId}
                            onChange={(e) => setSelectedPatientId(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all appearance-none cursor-pointer font-medium text-slate-700"
                            required
                        >
                            <option value="" disabled>Επιλέξτε από τη λίστα...</option>
                            {patients.map(p => (
                                <option key={p.id} value={p.id}>{p.name} ({p.ownerName}) - {p.breed}</option>
                            ))}
                        </select>
                    </div>

                    {/* Selected Patient Summary */}
                    {selectedPatient && (
                        <div className="bg-indigo-50 rounded-xl p-4 flex items-center gap-4 border border-indigo-100 animate-fade-in">
                            <img src={selectedPatient.image} alt={selectedPatient.name} className="w-16 h-16 rounded-xl object-cover" />
                            <div>
                                <h3 className="font-bold text-indigo-900">{selectedPatient.name}</h3>
                                <p className="text-sm text-indigo-700">{selectedPatient.type} • {selectedPatient.age} Ετών</p>
                                <p className="text-xs text-indigo-500 mt-1">Ιδιοκτήτης: {selectedPatient.ownerName}</p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Ημερομηνία</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <CalendarIcon className="h-5 w-5 text-slate-400" />
                                </div>
                                <input 
                                    type="date" 
                                    required
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Ώρα</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <ClockIcon className="h-5 w-5 text-slate-400" />
                                </div>
                                <input 
                                    type="time" 
                                    required
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Τύπος Ραντεβού</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {['Εξέταση', 'Εμβολιασμός', 'Χειρουργείο', 'Καλλωπισμός'].map(t => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setType(t)}
                                    className={`py-2 px-3 rounded-lg text-sm font-bold transition-all border ${
                                        type === t 
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-indigo-50'
                                    }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Σημειώσεις (Προαιρετικά)</label>
                        <textarea 
                            rows={3}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                            placeholder="π.χ. Προσοχή σε αλλεργίες..."
                        />
                    </div>

                    {/* SMS Notification Toggle */}
                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer" onClick={() => setSendSms(!sendSms)}>
                        <div className={`p-2 rounded-lg shadow-sm transition-colors ${sendSms ? 'bg-indigo-100 text-indigo-600' : 'bg-white text-slate-400'}`}>
                            <SmartphoneIcon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-bold text-slate-800 cursor-pointer select-none">
                                Αποστολή SMS Επιβεβαίωσης
                            </label>
                            <p className="text-xs text-slate-500">Ο ιδιοκτήτης θα λάβει άμεσα SMS με τις λεπτομέρειες του ραντεβού.</p>
                        </div>
                        <div className={`w-6 h-6 rounded-md border flex items-center justify-center transition-all ${sendSms ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}>
                            {sendSms && <CheckIcon className="w-4 h-4 text-white" />}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-end">
                        <button 
                            type="submit"
                            disabled={isSubmitting || !selectedPatientId || !date || !time}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    Αποστολή...
                                </>
                            ) : (
                                <>
                                    <SaveIcon className="w-5 h-5" />
                                    Δημιουργία Ραντεβού
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default VetNewAppointment;
