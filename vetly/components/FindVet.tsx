
import React, { useState } from 'react';
import { Vet } from '../types';
import { MOCK_VETS } from '../constants';
import { SearchIcon, MapPinIcon, StarIcon, ActivityIcon } from './Icons';

interface FindVetProps {
    onSelectVet: (vet: Vet) => void;
    initialFilter?: 'all' | 'emergency';
}

const FindVet: React.FC<FindVetProps> = ({ onSelectVet, initialFilter = 'all' }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFilter, setSelectedFilter] = useState<'all' | 'emergency'>(initialFilter);
    const [activeMapVet, setActiveMapVet] = useState<string | null>(null);

    const filteredVets = MOCK_VETS.filter(vet => {
        const matchesSearch = vet.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              vet.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              vet.city.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = selectedFilter === 'all' ? true : vet.isOnCall;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <div className="text-center mb-10 animate-fade-in">
                {selectedFilter === 'emergency' ? (
                    <>
                        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-red-100 text-red-600 text-sm font-bold uppercase tracking-wide mb-4 animate-pulse">
                            <ActivityIcon className="w-4 h-4" /> SOS Mode
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">Εφημερεύοντα Ιατρεία Κοντά σας</h2>
                        <p className="text-slate-600 max-w-2xl mx-auto">
                            Εμφανίζονται μόνο κτηνιάτροι και κλινικές που είναι <span className="font-bold text-red-600">διαθέσιμοι τώρα</span> για επείγοντα περιστατικά.
                        </p>
                    </>
                ) : (
                    <>
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">Εύρεση Κτηνιάτρου</h2>
                        <p className="text-slate-600 max-w-2xl mx-auto">
                            Αναζητήστε τον κατάλληλο γιατρό για το κατοικίδιό σας. 
                        </p>
                    </>
                )}
            </div>

            {/* Search & Filter Bar */}
            <div className="bg-white p-2 rounded-[2rem] shadow-sm border border-slate-100 max-w-4xl mx-auto mb-10">
                <div className="flex flex-col md:flex-row gap-4 p-2 items-center">
                    <div className="relative w-full">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <SearchIcon className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-12 pr-4 py-4 border border-transparent bg-slate-50 rounded-2xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500 transition-all font-medium"
                            placeholder="Όνομα, ειδικότητα ή πόλη..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                         <button 
                            onClick={() => setSelectedFilter('all')}
                            className={`flex-1 md:flex-none px-6 py-4 rounded-2xl text-sm font-bold transition-colors ${selectedFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                            Όλοι
                        </button>
                        <button 
                            onClick={() => setSelectedFilter('emergency')}
                            className={`flex-1 md:flex-none px-6 py-4 rounded-2xl text-sm font-bold transition-colors flex items-center justify-center gap-2 ${selectedFilter === 'emergency' ? 'bg-red-500 text-white shadow-red-200 shadow-lg' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                        >
                            SOS
                        </button>
                    </div>
                </div>
            </div>

            {/* Directory Results */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
                {/* List View */}
                <div className="lg:col-span-1 space-y-4 h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {filteredVets.map(vet => (
                        <div 
                            key={vet.id} 
                            onClick={() => onSelectVet(vet)}
                            className={`bg-white p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-md group ${activeMapVet === vet.id ? 'border-teal-500 ring-1 ring-teal-500' : 'border-slate-100 hover:border-teal-200'}`}
                            onMouseEnter={() => setActiveMapVet(vet.id)}
                            onMouseLeave={() => setActiveMapVet(null)}
                        >
                            <div className="flex gap-4">
                                <img src={vet.image} alt={vet.name} className="w-16 h-16 rounded-xl object-cover bg-slate-100" />
                                <div>
                                    <h3 className="font-bold text-slate-900 group-hover:text-teal-600 transition-colors">{vet.name}</h3>
                                    <p className="text-sm text-teal-600 font-medium">{vet.specialty}</p>
                                    <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                                        <MapPinIcon className="w-3 h-3" />
                                        {vet.city}
                                    </div>
                                    <div className="flex items-center gap-1 mt-1">
                                        <StarIcon className="w-3 h-3 text-amber-400" fill="currentColor" />
                                        <span className="text-xs font-bold">{vet.rating}</span>
                                        <span className="text-xs text-slate-400">({vet.reviewsCount})</span>
                                    </div>
                                </div>
                            </div>
                            {vet.isOnCall && (
                                <div className="mt-3 bg-red-50 text-red-600 text-xs px-2 py-1 rounded-lg inline-block font-bold border border-red-100 animate-pulse">
                                    Εφημερεύει Τώρα
                                </div>
                            )}
                        </div>
                    ))}
                    {filteredVets.length === 0 && (
                        <div className="text-center text-slate-400 py-10">Δεν βρέθηκαν αποτελέσματα</div>
                    )}
                </div>

                {/* Mock Map View */}
                <div className="lg:col-span-2 bg-slate-100 rounded-[2rem] overflow-hidden relative h-[600px] border border-slate-200 shadow-inner">
                    {/* Map Placeholder Background */}
                    <div className="absolute inset-0 bg-[#e5e7eb] opacity-50" 
                         style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                    </div>
                    
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
                        <span className="text-6xl font-bold text-slate-400">ΧΑΡΤΗΣ</span>
                    </div>

                    {/* Pins */}
                    {filteredVets.map(vet => (
                        <button
                            key={vet.id}
                            onClick={() => onSelectVet(vet)}
                            onMouseEnter={() => setActiveMapVet(vet.id)}
                            onMouseLeave={() => setActiveMapVet(null)}
                            className={`absolute transform -translate-x-1/2 -translate-y-full transition-all duration-300 ${activeMapVet === vet.id ? 'z-50 scale-125' : 'z-10 hover:scale-110'}`}
                            style={{ top: `${vet.coordinates.y}%`, left: `${vet.coordinates.x}%` }}
                        >
                             <div className={`relative flex flex-col items-center ${activeMapVet === vet.id ? 'opacity-100' : 'opacity-90'}`}>
                                <div className={`bg-white p-1.5 rounded-xl shadow-lg mb-2 transition-opacity duration-200 ${activeMapVet === vet.id ? 'opacity-100' : 'opacity-0'}`}>
                                    <span className="text-xs font-bold whitespace-nowrap px-2 block text-slate-800">{vet.name}</span>
                                </div>
                                <div className={`w-12 h-12 rounded-full border-4 shadow-xl flex items-center justify-center overflow-hidden bg-white ${vet.isOnCall ? 'border-red-500' : 'border-teal-600'}`}>
                                    <img src={vet.image} className="w-full h-full object-cover" alt="" />
                                </div>
                                <div className="w-1 h-4 bg-slate-400 rounded-full mt-[-2px]"></div>
                                <div className="w-4 h-1 bg-black/20 rounded-full blur-[2px]"></div>
                             </div>
                        </button>
                    ))}
                    
                    {/* User Location Pin (Mock) */}
                    <div className="absolute top-[50%] left-[50%] transform -translate-x-1/2 -translate-y-1/2 z-0">
                        <div className="w-24 h-24 bg-blue-500/10 rounded-full animate-ping absolute"></div>
                        <div className="w-5 h-5 bg-blue-500 border-2 border-white rounded-full shadow-lg relative z-10 ring-4 ring-blue-500/20"></div>
                        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-white/80 px-2 py-1 rounded text-[10px] font-bold text-blue-600 backdrop-blur-sm whitespace-nowrap">Η τοποθεσία σας</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FindVet;
