
import React, { useState } from 'react';
import { Vet } from '../types';
import { SaveIcon, CheckIcon, CameraIcon, MapPinIcon, PhoneIcon, GlobeIcon, BriefcaseIcon, IdentificationIcon, ClockIcon, PlusIcon, TrashIcon } from './Icons';

interface VetProfileSettingsProps {
    vet: Vet;
    onUpdateVet: (updatedVet: Vet) => void;
    onBack: () => void;
}

type TabType = 'clinic' | 'professional' | 'hours';

interface ScheduleDay {
    day: string;
    isOpen: boolean;
    start: string;
    end: string;
}

const VetProfileSettings: React.FC<VetProfileSettingsProps> = ({ vet, onUpdateVet, onBack }) => {
    const [activeTab, setActiveTab] = useState<TabType>('clinic');
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const [formData, setFormData] = useState({
        name: vet.name,
        address: vet.address,
        city: vet.city,
        phone: vet.phone,
        email: vet.email || '',
        website: vet.website || '',
        image: vet.image,
        specialty: vet.specialty,
        licenseNumber: vet.licenseNumber || '',
        description: vet.description,
        hours: vet.hours
    });

    // Helper to parse simple hours string or default to standard
    const initialSchedule: ScheduleDay[] = ['Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο', 'Κυριακή'].map(day => ({
        day,
        isOpen: day !== 'Κυριακή',
        start: '09:00',
        end: '17:00'
    }));

    const [schedule, setSchedule] = useState<ScheduleDay[]>(initialSchedule);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleScheduleChange = (index: number, field: keyof ScheduleDay, value: any) => {
        const newSchedule = [...schedule];
        newSchedule[index] = { ...newSchedule[index], [field]: value };
        setSchedule(newSchedule);
    };

    // Convert schedule object back to readable string for public profile
    const generateHoursString = () => {
        // Simple logic: find common hours or list ranges
        // For simplicity in this demo, we just take the first open day's hours or 'Closed'
        const openDays = schedule.filter(d => d.isOpen);
        if (openDays.length === 0) return 'Κλειστά';
        
        // Try to construct a nice string like "Mon-Fri: 09:00-17:00"
        const first = openDays[0];
        const allSame = openDays.every(d => d.start === first.start && d.end === first.end);
        
        if (allSame && openDays.length > 4) {
             return `Καθημερινές ${first.start} - ${first.end}`;
        }
        
        return `${first.start} - ${first.end}`;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        // Update hours string based on schedule editor
        const updatedHours = generateHoursString();

        setTimeout(() => {
            onUpdateVet({
                ...vet,
                ...formData,
                hours: updatedHours
            });
            setIsSaving(false);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        }, 1000);
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
                <h1 className="text-2xl font-bold text-slate-900">Ρυθμίσεις Ιατρείου</h1>
                <div className="w-20"></div> 
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Sidebar Navigation */}
                <div className="space-y-6">
                    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 text-center">
                        <div className="relative inline-block mb-4 group cursor-pointer">
                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-50 mx-auto">
                                <img src={formData.image} alt="Profile" className="w-full h-full object-cover group-hover:opacity-90 transition-opacity" />
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                <CameraIcon className="w-8 h-8 text-white" />
                            </div>
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">{formData.name}</h2>
                        <p className="text-indigo-600 text-sm font-medium">{formData.specialty}</p>
                    </div>

                    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
                         <button 
                            onClick={() => setActiveTab('clinic')}
                            className={`w-full text-left px-6 py-4 flex items-center gap-3 transition-colors ${activeTab === 'clinic' ? 'bg-indigo-50 text-indigo-800 font-bold border-l-4 border-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            <MapPinIcon className="w-5 h-5" /> Στοιχεία Ιατρείου
                        </button>
                        <button 
                            onClick={() => setActiveTab('professional')}
                            className={`w-full text-left px-6 py-4 flex items-center gap-3 transition-colors ${activeTab === 'professional' ? 'bg-indigo-50 text-indigo-800 font-bold border-l-4 border-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            <BriefcaseIcon className="w-5 h-5" /> Επαγγελματικό Προφίλ
                        </button>
                        <button 
                            onClick={() => setActiveTab('hours')}
                            className={`w-full text-left px-6 py-4 flex items-center gap-3 transition-colors ${activeTab === 'hours' ? 'bg-indigo-50 text-indigo-800 font-bold border-l-4 border-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            <ClockIcon className="w-5 h-5" /> Ωράριο Λειτουργίας
                        </button>
                    </div>
                </div>

                {/* Main Content Form */}
                <div className="lg:col-span-2">
                    <form onSubmit={handleSubmit} className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                        
                        {/* Tab: Clinic Details */}
                        {activeTab === 'clinic' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                                        <MapPinIcon className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-800">Βασικές Πληροφορίες</h3>
                                </div>
                                <p className="text-slate-500 text-sm mb-6">Αυτά τα στοιχεία εμφανίζονται δημόσια στο προφίλ σας για να σας βρίσκουν οι ιδιοκτήτες.</p>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Όνομα Ιατρείου / Ιατρού</label>
                                        <input 
                                            type="text" 
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Πόλη / Περιοχή</label>
                                            <input 
                                                type="text" 
                                                name="city"
                                                value={formData.city}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Τηλέφωνο</label>
                                            <div className="relative">
                                                <PhoneIcon className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                                                <input 
                                                    type="text" 
                                                    name="phone"
                                                    value={formData.phone}
                                                    onChange={handleChange}
                                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Διεύθυνση</label>
                                        <input 
                                            type="text" 
                                            name="address"
                                            value={formData.address}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Website (Προαιρετικό)</label>
                                        <div className="relative">
                                            <GlobeIcon className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                                            <input 
                                                type="url" 
                                                name="website"
                                                value={formData.website}
                                                onChange={handleChange}
                                                placeholder="https://..."
                                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab: Professional Info */}
                        {activeTab === 'professional' && (
                            <div className="space-y-6 animate-fade-in">
                                 <div className="flex items-center gap-3 mb-2">
                                    <div className="bg-teal-100 p-2 rounded-lg text-teal-600">
                                        <IdentificationIcon className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-800">Επαγγελματικά Στοιχεία</h3>
                                </div>
                                
                                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3 items-start">
                                    <BriefcaseIcon className="w-5 h-5 text-amber-600 mt-0.5" />
                                    <p className="text-sm text-amber-800">
                                        Βεβαιωθείτε ότι ο αριθμός αδείας σας είναι ενημερωμένος για να διατηρήσετε το σήμα "Πιστοποιημένος" στο προφίλ σας.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Ειδικότητα</label>
                                            <input 
                                                type="text" 
                                                name="specialty"
                                                value={formData.specialty}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Αριθμός Αδείας</label>
                                            <input 
                                                type="text" 
                                                name="licenseNumber"
                                                value={formData.licenseNumber}
                                                onChange={handleChange}
                                                placeholder="π.χ. 12345/2020"
                                                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Βιογραφικό / Περιγραφή</label>
                                        <textarea 
                                            rows={6}
                                            name="description"
                                            value={formData.description}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                                            placeholder="Γράψτε λίγα λόγια για την εμπειρία σας, τις υπηρεσίες που προσφέρετε και τη φιλοσοφία του ιατρείου σας..."
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab: Hours */}
                        {activeTab === 'hours' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                                        <ClockIcon className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-800">Ωράριο Λειτουργίας</h3>
                                </div>

                                <div className="space-y-3">
                                    {schedule.map((day, idx) => (
                                        <div key={day.day} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                            <div className="w-24 font-bold text-slate-700">{day.day}</div>
                                            
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    checked={day.isOpen} 
                                                    onChange={(e) => handleScheduleChange(idx, 'isOpen', e.target.checked)} 
                                                    className="sr-only peer" 
                                                />
                                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                            </label>

                                            {day.isOpen ? (
                                                <div className="flex items-center gap-2 flex-1">
                                                    <input 
                                                        type="time" 
                                                        value={day.start}
                                                        onChange={(e) => handleScheduleChange(idx, 'start', e.target.value)}
                                                        className="p-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                                    />
                                                    <span className="text-slate-400">-</span>
                                                    <input 
                                                        type="time" 
                                                        value={day.end}
                                                        onChange={(e) => handleScheduleChange(idx, 'end', e.target.value)}
                                                        className="p-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="flex-1 text-slate-400 text-sm italic px-2">
                                                    Κλειστά
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Actions Footer */}
                        <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end items-center gap-4">
                             <button 
                                type="button"
                                onClick={onBack}
                                className="px-6 py-3 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
                            >
                                Ακύρωση
                            </button>
                            <button 
                                type="submit"
                                disabled={isSaving}
                                className="px-8 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-lg flex items-center gap-2 disabled:opacity-70"
                            >
                                {isSaving ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                        Αποθήκευση...
                                    </>
                                ) : (
                                    <>
                                        <SaveIcon className="w-4 h-4" />
                                        Αποθήκευση Αλλαγών
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                    
                     {/* Success Message Toast */}
                     <div className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 transition-all duration-500 z-50 ${showSuccess ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
                        <div className="bg-green-500 rounded-full p-1">
                            <CheckIcon className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-bold">Το προφίλ ενημερώθηκε επιτυχώς!</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VetProfileSettings;
