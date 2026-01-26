
import React, { useState } from 'react';
import { VetPatient } from '../types';
import { UserIcon, PhoneIcon, SaveIcon, CheckIcon, PlusIcon, CameraIcon, ChipIcon } from './Icons';

interface VetAddPatientProps {
    onSave: (patient: VetPatient) => void;
    onCancel: () => void;
}

const VetAddPatient: React.FC<VetAddPatientProps> = ({ onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        ownerName: '',
        ownerPhone: '',
        ownerEmail: '',
        name: '',
        type: 'Dog' as 'Dog' | 'Cat' | 'Other',
        breed: '',
        age: '',
        weight: '',
        gender: 'Male' as 'Male' | 'Female',
        chipNumber: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Mock image generation
        const random = Math.floor(Math.random() * 1000);
        let image = '';
        if (formData.type === 'Dog') image = `https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=300&q=80&random=${random}`;
        else if (formData.type === 'Cat') image = `https://images.unsplash.com/photo-1513245543132-31f507417b26?auto=format&fit=crop&w=300&q=80&random=${random}`;
        else image = `https://images.unsplash.com/photo-1425082661705-1834bfd09dca?auto=format&fit=crop&w=300&q=80&random=${random}`;

        setTimeout(() => {
            const newPatient: VetPatient = {
                id: `np-${Math.random().toString(36).substr(2, 9)}`,
                ...formData,
                age: Number(formData.age),
                weight: Number(formData.weight),
                image,
                lastVisit: 'Εγγραφή',
                status: 'Active',
                history: []
            };

            setShowSuccess(true);
            setTimeout(() => {
                onSave(newPatient);
            }, 1500);
        }, 1000);
    };

    if (showSuccess) {
        return (
            <div className="min-h-screen pt-24 pb-12 px-4 flex items-center justify-center bg-slate-50">
                <div className="text-center animate-scale-in bg-white p-10 rounded-3xl shadow-xl border border-slate-100">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-green-50">
                        <CheckIcon className="w-12 h-12 text-green-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-2">Επιτυχής Εγγραφή!</h2>
                    <p className="text-slate-600">Ο φάκελος του/της <span className="font-bold text-slate-800">{formData.name}</span> δημιουργήθηκε.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
             {/* Header */}
             <div className="flex items-center justify-between mb-8">
                <button 
                    onClick={onCancel}
                    className="flex items-center text-slate-500 hover:text-indigo-600 transition-colors font-medium group"
                >
                    <span className="transform group-hover:-translate-x-1 transition-transform inline-block mr-2">←</span> 
                    Ακύρωση
                </button>
                <h1 className="text-2xl font-bold text-slate-900">Εγγραφή Νέου Ασθενή</h1>
                <div className="w-20"></div> 
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Owner Info */}
                <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                            <UserIcon className="w-5 h-5" />
                        </div>
                        Στοιχεία Ιδιοκτήτη
                    </h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Ονοματεπώνυμο *</label>
                            <input 
                                type="text" 
                                name="ownerName"
                                required
                                value={formData.ownerName}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                                placeholder="π.χ. Γιάννης Παπαδόπουλος"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Τηλέφωνο *</label>
                            <input 
                                type="tel" 
                                name="ownerPhone"
                                required
                                value={formData.ownerPhone}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                                placeholder="π.χ. +30 690 000 0000"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
                            <input 
                                type="email" 
                                name="ownerEmail"
                                value={formData.ownerEmail}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                                placeholder="π.χ. email@example.com"
                            />
                        </div>
                    </div>
                </div>

                {/* Patient Info */}
                <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                         <div className="bg-teal-100 p-2 rounded-lg text-teal-600">
                            <PlusIcon className="w-5 h-5" />
                        </div>
                        Στοιχεία Ασθενή
                    </h3>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Όνομα Ζώου *</label>
                                <input 
                                    type="text" 
                                    name="name"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                                />
                            </div>
                             <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Είδος</label>
                                <select 
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all appearance-none cursor-pointer"
                                >
                                    <option value="Dog">Σκύλος</option>
                                    <option value="Cat">Γάτα</option>
                                    <option value="Other">Άλλο</option>
                                </select>
                            </div>
                        </div>
                       
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Ράτσα</label>
                            <input 
                                type="text" 
                                name="breed"
                                value={formData.breed}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Ηλικία</label>
                                <input 
                                    type="number" 
                                    name="age"
                                    min="0"
                                    value={formData.age}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Βάρος (kg)</label>
                                <input 
                                    type="number" 
                                    name="weight"
                                    min="0"
                                    step="0.1"
                                    value={formData.weight}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                                />
                            </div>
                             <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Φύλο</label>
                                <select 
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all appearance-none cursor-pointer"
                                >
                                    <option value="Male">Αρσενικό</option>
                                    <option value="Female">Θηλυκό</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Αριθμός Microchip</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <ChipIcon className="h-5 w-5 text-slate-400" />
                                </div>
                                <input 
                                    type="text" 
                                    name="chipNumber"
                                    value={formData.chipNumber}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                                    placeholder="π.χ. 123456789012345"
                                />
                            </div>
                        </div>

                        {/* Photo Placeholder */}
                        <div className="mt-4 border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                            <CameraIcon className="w-8 h-8 mb-2" />
                            <span className="text-xs font-bold uppercase">Προσθηκη Φωτογραφιας (Προαιρετικο)</span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="lg:col-span-2 flex justify-end border-t border-slate-200 pt-8">
                    <button 
                        type="submit"
                        disabled={isSubmitting || !formData.name || !formData.ownerName || !formData.ownerPhone}
                        className="px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                Αποθήκευση...
                            </>
                        ) : (
                            <>
                                <SaveIcon className="w-5 h-5" />
                                Εγγραφή Ασθενή
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default VetAddPatient;
