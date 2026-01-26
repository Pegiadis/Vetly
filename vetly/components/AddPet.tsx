
import React, { useState } from 'react';
import { Pet, MedicalEvent } from '../types';
import { CameraIcon, CheckIcon, UploadIcon, ActivityIcon, PlusIcon, TrashIcon, ChipIcon } from './Icons';

interface AddPetProps {
    onAdd: (pet: Pet) => void;
    onCancel: () => void;
}

const QUICK_TITLES = ['Εμβολιασμός', 'Αποπαρασίτωση', 'Εξέταση Αίματος', 'Καλλωπισμός', 'Έλεγχος Ρουτίνας'];

const AddPet: React.FC<AddPetProps> = ({ onAdd, onCancel }) => {
    const [name, setName] = useState('');
    const [type, setType] = useState<'Dog' | 'Cat' | 'Other'>('Dog');
    const [breed, setBreed] = useState('');
    const [age, setAge] = useState('');
    const [weight, setWeight] = useState('');
    const [chipNumber, setChipNumber] = useState('');
    const [image, setImage] = useState('');
    
    // Medical History State
    const [history, setHistory] = useState<MedicalEvent[]>([]);
    const [newEvent, setNewEvent] = useState<MedicalEvent>({ date: '', title: '', notes: '' });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate API call and processing
        setTimeout(() => {
            const newPet: Pet = {
                id: Math.random().toString(36).substr(2, 9),
                name,
                type,
                breed: breed || 'Άγνωστη Φυλή',
                age: Number(age),
                weight: Number(weight),
                chipNumber,
                image: image || getDefaultImage(type),
                history: history
            };

            setShowSuccess(true);
            setTimeout(() => {
                onAdd(newPet);
            }, 1500);
        }, 1000);
    };

    const handleAddEvent = () => {
        if (newEvent.title && newEvent.date) {
            setHistory([...history, newEvent]);
            setNewEvent({ date: '', title: '', notes: '' });
        }
    };

    const handleRemoveEvent = (index: number) => {
        setHistory(history.filter((_, i) => i !== index));
    };

    const getDefaultImage = (petType: string) => {
        if (petType === 'Dog') return 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=300&q=80';
        if (petType === 'Cat') return 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=300&q=80';
        return 'https://images.unsplash.com/photo-1525253086316-d0c936c814f8?auto=format&fit=crop&w=300&q=80';
    };

    // Mock image "upload" - sets a random high quality image based on type
    const handleImageUpload = () => {
        const random = Math.floor(Math.random() * 1000);
        let url = '';
        if (type === 'Dog') url = `https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=300&q=80&random=${random}`;
        else if (type === 'Cat') url = `https://images.unsplash.com/photo-1513245543132-31f507417b26?auto=format&fit=crop&w=300&q=80&random=${random}`;
        else url = `https://images.unsplash.com/photo-1425082661705-1834bfd09dca?auto=format&fit=crop&w=300&q=80&random=${random}`;
        
        setImage(url);
    };

    if (showSuccess) {
        return (
            <div className="min-h-screen pt-24 pb-12 px-4 flex items-center justify-center">
                <div className="text-center animate-scale-in">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-green-50">
                        <CheckIcon className="w-12 h-12 text-green-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-2">Επιτυχής Προσθήκη!</h2>
                    <p className="text-slate-600">Ο/Η {name} προστέθηκε στο προφίλ σας.</p>
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
                    Ακύρωση
                </button>
                <h1 className="text-2xl font-bold text-slate-900">Νέο Κατοικίδιο</h1>
                <div className="w-20"></div> 
            </div>

            <div className="bg-white rounded-[2rem] p-8 shadow-lg border border-slate-100">
                <form onSubmit={handleSubmit} className="space-y-8">
                    
                    {/* Type Selection */}
                    <div className="grid grid-cols-3 gap-4">
                        {['Dog', 'Cat', 'Other'].map((t) => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => setType(t as any)}
                                className={`py-4 rounded-2xl font-bold text-lg transition-all flex flex-col items-center gap-2 border-2 ${
                                    type === t 
                                    ? 'border-teal-500 bg-teal-50 text-teal-700 shadow-md transform scale-105' 
                                    : 'border-slate-100 bg-white text-slate-500 hover:border-teal-200 hover:bg-slate-50'
                                }`}
                            >
                                <span className="text-2xl">
                                    {t === 'Dog' ? '🐕' : t === 'Cat' ? '🐈' : '🐾'}
                                </span>
                                {t === 'Dog' ? 'Σκύλος' : t === 'Cat' ? 'Γάτα' : 'Άλλο'}
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-col md:flex-row gap-8">
                        {/* Image Upload Mock */}
                        <div className="flex flex-col items-center space-y-3">
                            <div 
                                onClick={handleImageUpload}
                                className="w-40 h-40 rounded-full bg-slate-100 border-4 border-white shadow-lg cursor-pointer overflow-hidden group relative hover:ring-4 ring-teal-100 transition-all"
                            >
                                {image ? (
                                    <img src={image} alt="Pet Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 group-hover:text-teal-600 transition-colors">
                                        <CameraIcon className="w-10 h-10 mb-2" />
                                        <span className="text-xs font-bold uppercase">Φωτογραφια</span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                    <UploadIcon className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transform scale-50 group-hover:scale-100 transition-all" />
                                </div>
                            </div>
                            <p className="text-xs text-slate-400">Πατήστε για αλλαγή</p>
                        </div>

                        {/* Details Form */}
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-slate-700 mb-2">Όνομα Κατοικιδίου *</label>
                                <input 
                                    type="text" 
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none transition-all placeholder-slate-400"
                                    placeholder="π.χ. Μάξ"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Ράτσα</label>
                                <input 
                                    type="text" 
                                    value={breed}
                                    onChange={(e) => setBreed(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none transition-all placeholder-slate-400"
                                    placeholder="π.χ. Labrador"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Ηλικία (έτη)</label>
                                <input 
                                    type="number" 
                                    min="0"
                                    max="30"
                                    value={age}
                                    onChange={(e) => setAge(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none transition-all placeholder-slate-400"
                                    placeholder="π.χ. 3"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Βάρος (kg)</label>
                                <input 
                                    type="number" 
                                    min="0"
                                    step="0.1"
                                    value={weight}
                                    onChange={(e) => setWeight(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none transition-all placeholder-slate-400"
                                    placeholder="π.χ. 12.5"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-slate-700 mb-2">Αριθμός Microchip</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <ChipIcon className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input 
                                        type="text" 
                                        value={chipNumber}
                                        onChange={(e) => setChipNumber(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none transition-all placeholder-slate-400"
                                        placeholder="π.χ. 123456789012345"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Medical History Section */}
                    <div className="border-t border-slate-100 pt-6">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <ActivityIcon className="w-5 h-5 text-teal-600" />
                            Ιστορικό Υγείας
                        </h3>
                        
                        {/* List */}
                        <div className="space-y-3 mb-4">
                            {history.length > 0 ? history.map((h, i) => (
                                <div key={i} className="flex items-start justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <div>
                                        <p className="font-bold text-slate-800 text-sm">{h.title}</p>
                                        <p className="text-xs text-slate-500">{h.date} • {h.notes}</p>
                                    </div>
                                    <button type="button" onClick={() => handleRemoveEvent(i)} className="text-red-400 hover:text-red-600">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            )) : (
                                <p className="text-sm text-slate-400 italic">Κανένα συμβάν ακόμα.</p>
                            )}
                        </div>

                        {/* Add New Event Form */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <div className="sm:col-span-4">
                                <label className="block text-xs font-bold text-slate-500 mb-1">Τίτλος</label>
                                <input 
                                    type="text" 
                                    value={newEvent.title}
                                    onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                                    className="w-full p-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                                    placeholder="π.χ. Εμβολιασμός"
                                />
                                {/* Quick Buttons */}
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {QUICK_TITLES.map(title => (
                                        <button
                                            key={title}
                                            type="button"
                                            onClick={() => setNewEvent({...newEvent, title})}
                                            className="px-2 py-1 bg-white border border-slate-200 rounded-md text-[10px] font-bold text-slate-600 hover:border-teal-500 hover:text-teal-600 transition-colors"
                                        >
                                            {title}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="sm:col-span-3">
                                <label className="block text-xs font-bold text-slate-500 mb-1">Ημερομηνία</label>
                                <input 
                                    type="date"
                                    value={newEvent.date}
                                    onChange={e => setNewEvent({...newEvent, date: e.target.value})}
                                    className="w-full p-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                                />
                            </div>
                            <div className="sm:col-span-4">
                                <label className="block text-xs font-bold text-slate-500 mb-1">Σημειώσεις</label>
                                <input 
                                    type="text"
                                    value={newEvent.notes}
                                    onChange={e => setNewEvent({...newEvent, notes: e.target.value})}
                                    className="w-full p-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                                    placeholder="Λεπτομέρειες..."
                                />
                            </div>
                            <div className="sm:col-span-1">
                                <button 
                                    type="button"
                                    onClick={handleAddEvent}
                                    disabled={!newEvent.title || !newEvent.date}
                                    className="w-full p-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex justify-center items-center h-[38px]"
                                >
                                    <PlusIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 flex justify-end">
                        <button 
                            type="submit"
                            disabled={isSubmitting || !name}
                            className="bg-slate-900 hover:bg-teal-600 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    Αποθήκευση...
                                </>
                            ) : (
                                'Προσθήκη Κατοικιδίου'
                            )}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default AddPet;
