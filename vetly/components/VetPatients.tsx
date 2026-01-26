
import React, { useState } from 'react';
import { Vet, VetPatient } from '../types';
import { SearchIcon, FilterIcon, ChevronRightIcon, PhoneIcon, UserIcon, PlusIcon, ActivityIcon, XIcon, ChipIcon, SaveIcon, CalendarPlusIcon } from './Icons';

interface VetPatientsProps {
    vet: Vet;
    patients: VetPatient[]; // Receive patients from props
    onBack: () => void;
    onAddPatientClick: () => void; // Navigation handler
    onNewAppointment: (patientId: string) => void; // New handler for creating appointment
    onUpdatePatient: (patient: VetPatient) => void; // New handler for syncing updates
}

const QUICK_TITLES = ['Εμβολιασμός', 'Αποπαρασίτωση', 'Εξέταση Αίματος', 'Καλλωπισμός', 'Έλεγχος Ρουτίνας'];

const VetPatients: React.FC<VetPatientsProps> = ({ vet, patients, onBack, onAddPatientClick, onNewAppointment, onUpdatePatient }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPatient, setSelectedPatient] = useState<VetPatient | null>(null);
    
    // Local state for adding new history record
    const [isAddingHistory, setIsAddingHistory] = useState(false);
    const [newRecord, setNewRecord] = useState({ title: '', date: new Date().toISOString().split('T')[0], notes: '' });

    const filteredPatients = patients.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.ownerName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddHistory = () => {
        if (selectedPatient && newRecord.title && newRecord.date) {
            const updatedPatient = {
                ...selectedPatient,
                history: [{ ...newRecord }, ...selectedPatient.history]
            };
            setSelectedPatient(updatedPatient);
            setIsAddingHistory(false);
            setNewRecord({ title: '', date: new Date().toISOString().split('T')[0], notes: '' });
            
            // Propagate the update to the parent component (App.tsx)
            onUpdatePatient(updatedPatient);
        }
    };

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative flex gap-6">
            
            {/* Main Content - Patient List */}
            <div className={`flex-1 transition-all duration-300 ${selectedPatient ? 'mr-0 lg:mr-[400px]' : ''}`}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <button onClick={onBack} className="text-slate-500 text-sm font-bold mb-2 hover:text-indigo-600">← Dashboard</button>
                        <h1 className="text-3xl font-bold text-slate-900">Διαχείριση Ασθενών</h1>
                    </div>
                    <button 
                        onClick={onAddPatientClick}
                        className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-md"
                    >
                        <PlusIcon className="w-5 h-5" />
                        Νέος Ασθενής
                    </button>
                </div>

                {/* Search & Filters */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <SearchIcon className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Αναζήτηση με όνομα κατοικιδίου ή ιδιοκτήτη..." 
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-100 flex items-center gap-2">
                        <FilterIcon className="w-5 h-5" />
                        Φίλτρα
                    </button>
                </div>

                {/* Table */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100">
                                    <th className="p-6 font-bold">Ασθενης</th>
                                    <th className="p-6 font-bold">Ιδιοκτητης</th>
                                    <th className="p-6 font-bold">Κατασταση</th>
                                    <th className="p-6 font-bold">Τελ. Επισκεψη</th>
                                    <th className="p-6 font-bold text-right">Ενεγειες</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filteredPatients.map((patient) => (
                                    <tr 
                                        key={patient.id} 
                                        onClick={() => setSelectedPatient(patient)}
                                        className={`border-b border-slate-50 last:border-0 hover:bg-indigo-50/30 cursor-pointer transition-colors ${selectedPatient?.id === patient.id ? 'bg-indigo-50' : ''}`}
                                    >
                                        <td className="p-6">
                                            <div className="flex items-center gap-4">
                                                <img src={patient.image} alt={patient.name} className="w-12 h-12 rounded-full object-cover bg-slate-100 border-2 border-white shadow-sm" />
                                                <div>
                                                    <div className="font-bold text-slate-900 text-base">{patient.name}</div>
                                                    <div className="text-slate-500 text-xs">{patient.breed} • {patient.age} Ετών</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="font-medium text-slate-800">{patient.ownerName}</div>
                                            <div className="text-slate-400 text-xs">{patient.ownerPhone}</div>
                                        </td>
                                        <td className="p-6">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                patient.status === 'Active' ? 'bg-green-100 text-green-700' :
                                                patient.status === 'Treatment' ? 'bg-amber-100 text-amber-700' :
                                                'bg-slate-100 text-slate-500'
                                            }`}>
                                                {patient.status === 'Active' ? 'Ενεργός' : patient.status === 'Treatment' ? 'Θεραπεία' : 'Ανενεργός'}
                                            </span>
                                        </td>
                                        <td className="p-6 text-slate-600 font-medium">
                                            {patient.lastVisit}
                                        </td>
                                        <td className="p-6 text-right">
                                            <button className="text-indigo-600 hover:bg-indigo-100 p-2 rounded-lg transition-colors">
                                                <ChevronRightIcon className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {filteredPatients.length === 0 && (
                        <div className="p-12 text-center text-slate-400">
                            Δεν βρέθηκαν ασθενείς με αυτά τα κριτήρια.
                        </div>
                    )}
                </div>
            </div>

            {/* Side Panel - Detailed View */}
            <div className={`fixed top-0 right-0 h-full w-full sm:w-[450px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto ${selectedPatient ? 'translate-x-0' : 'translate-x-full'}`}>
                {selectedPatient && (
                    <div className="p-0 min-h-screen flex flex-col">
                        {/* Header Image */}
                        <div className="h-48 relative">
                            <img src={selectedPatient.image} className="w-full h-full object-cover" alt="" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                            <button 
                                onClick={() => setSelectedPatient(null)}
                                className="absolute top-6 left-6 bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/40 transition-colors"
                            >
                                <XIcon className="w-6 h-6" />
                            </button>
                            <div className="absolute bottom-6 left-6 text-white">
                                <h2 className="text-3xl font-bold">{selectedPatient.name}</h2>
                                <p className="text-white/90">{selectedPatient.breed}</p>
                            </div>
                        </div>

                        <div className="p-6 space-y-8 flex-1">
                            {/* Quick Stats */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-slate-50 p-3 rounded-xl text-center border border-slate-100">
                                    <span className="block text-slate-400 text-xs font-bold uppercase">Ηλικια</span>
                                    <span className="text-slate-800 font-bold text-lg">{selectedPatient.age}</span>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-xl text-center border border-slate-100">
                                    <span className="block text-slate-400 text-xs font-bold uppercase">Βαρος</span>
                                    <span className="text-slate-800 font-bold text-lg">{selectedPatient.weight}kg</span>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-xl text-center border border-slate-100">
                                    <span className="block text-slate-400 text-xs font-bold uppercase">Φυλο</span>
                                    <span className="text-slate-800 font-bold text-lg">{selectedPatient.gender === 'Male' ? '♂' : '♀'}</span>
                                </div>
                            </div>

                            {/* Chip Info */}
                            {selectedPatient.chipNumber && (
                                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                        <ChipIcon className="w-4 h-4" /> Microchip
                                    </span>
                                    <span className="font-mono text-slate-700 font-medium tracking-widest">{selectedPatient.chipNumber}</span>
                                </div>
                            )}

                            {/* Owner Card */}
                            <div className="bg-indigo-50 rounded-2xl p-5 border border-indigo-100">
                                <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3">Ιδιοκτητης</h3>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-indigo-600 shadow-sm">
                                            <UserIcon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-indigo-900">{selectedPatient.ownerName}</div>
                                            <div className="text-indigo-700/70 text-xs">
                                                {selectedPatient.ownerPhone}
                                            </div>
                                        </div>
                                    </div>
                                    <button className="bg-white text-indigo-600 p-2 rounded-lg shadow-sm hover:bg-indigo-100 transition-colors">
                                        <PhoneIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Medical History Timeline */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                        <ActivityIcon className="w-5 h-5 text-indigo-600" />
                                        Ιστορικό
                                    </h3>
                                    <button 
                                        onClick={() => setIsAddingHistory(!isAddingHistory)}
                                        className="text-xs text-indigo-600 font-bold bg-indigo-50 px-2 py-1 rounded hover:bg-indigo-100"
                                    >
                                        {isAddingHistory ? 'Ακύρωση' : '+ Προσθήκη'}
                                    </button>
                                </div>

                                {/* Add History Form */}
                                {isAddingHistory && (
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4 animate-fade-in">
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-1">Τίτλος</label>
                                                <input 
                                                    type="text" 
                                                    className="w-full p-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                                    value={newRecord.title}
                                                    onChange={(e) => setNewRecord({...newRecord, title: e.target.value})}
                                                    placeholder="π.χ. Εμβολιασμός"
                                                />
                                                <div className="flex flex-wrap gap-1.5 mt-2">
                                                    {QUICK_TITLES.map(title => (
                                                        <button
                                                            key={title}
                                                            onClick={() => setNewRecord({...newRecord, title})}
                                                            className="px-2 py-1 bg-white border border-slate-200 rounded-md text-[10px] font-bold text-slate-600 hover:border-indigo-500 hover:text-indigo-600 transition-colors"
                                                        >
                                                            {title}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-1">Ημερομηνία</label>
                                                <input 
                                                    type="date" 
                                                    className="w-full p-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                                    value={newRecord.date}
                                                    onChange={(e) => setNewRecord({...newRecord, date: e.target.value})}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-1">Σημειώσεις</label>
                                                <input 
                                                    type="text" 
                                                    className="w-full p-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                                    value={newRecord.notes}
                                                    onChange={(e) => setNewRecord({...newRecord, notes: e.target.value})}
                                                    placeholder="Λεπτομέρειες..."
                                                />
                                            </div>
                                            <button 
                                                onClick={handleAddHistory}
                                                disabled={!newRecord.title || !newRecord.date}
                                                className="w-full bg-indigo-600 text-white text-sm font-bold py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                <SaveIcon className="w-4 h-4" />
                                                Αποθήκευση
                                            </button>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="relative border-l-2 border-slate-100 ml-3 space-y-6">
                                    {selectedPatient.history.map((record, idx) => (
                                        <div key={idx} className="relative pl-6">
                                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-indigo-100 border-2 border-indigo-500"></div>
                                            <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm hover:border-indigo-200 transition-colors">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="font-bold text-slate-800">{record.title}</span>
                                                    <span className="text-xs text-slate-400 font-medium">{record.date}</span>
                                                </div>
                                                <p className="text-sm text-slate-600 leading-relaxed">{record.notes}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {selectedPatient.history.length === 0 && (
                                        <div className="pl-6 text-slate-400 italic text-sm">Δεν βρέθηκε ιστορικό.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        {/* Sticky Footer Actions */}
                        <div className="p-6 border-t border-slate-100 bg-slate-50 mt-auto">
                            <button 
                                onClick={() => onNewAppointment(selectedPatient.id)}
                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2"
                            >
                                <CalendarPlusIcon className="w-5 h-5" />
                                Νέο Ραντεβού
                            </button>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Overlay for Side Panel */}
            {selectedPatient && (
                <div 
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
                    onClick={() => setSelectedPatient(null)}
                ></div>
            )}

        </div>
    );
};

export default VetPatients;
