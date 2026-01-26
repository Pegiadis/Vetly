import React, { useState } from 'react';
import { ViewState } from '../types';
import { SearchIcon } from './Icons';

interface HeroProps {
    setViewState: (view: ViewState) => void;
}

const Hero: React.FC<HeroProps> = ({ setViewState }) => {
    const [searchText, setSearchText] = useState('');

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchText.trim()) {
            setViewState('FIND_VET');
            // In a real app, we would pass the search text to the FindVet component
        }
    };

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 pt-24 pb-8">
            {/* Main Hero Card */}
            <div className="relative w-full bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl text-white">
                
                {/* Abstract Animated Background */}
                <div className="absolute inset-0 z-0 opacity-40">
                    <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-teal-600/30 rounded-full filter blur-[100px] animate-pulse"></div>
                    <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-600/30 rounded-full filter blur-[100px] animate-pulse" style={{ animationDelay: '3s' }}></div>
                    <div className="absolute top-[40%] left-[40%] w-[400px] h-[400px] bg-amber-500/20 rounded-full filter blur-[80px] animate-pulse" style={{ animationDelay: '5s' }}></div>
                </div>

                {/* Content Container */}
                <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-20 sm:py-28 max-w-4xl mx-auto">
                    
                    <span className="inline-block py-1 px-3 rounded-full bg-white/10 border border-white/20 text-teal-300 text-xs font-bold tracking-wider uppercase mb-6 backdrop-blur-sm">
                        Η Νο1 Πλατφόρμα στην Ελλάδα
                    </span>

                    <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
                        Φροντίδα που αξίζει <br className="hidden sm:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-300">
                            στον καλύτερό σας φίλο.
                        </span>
                    </h1>

                    <p className="text-lg sm:text-xl text-slate-300 mb-10 max-w-2xl leading-relaxed">
                        Βρείτε κτηνιάτρους, κλείστε ραντεβού και διαχειριστείτε την υγεία του κατοικιδίου σας. Όλα σε μία εφαρμογή.
                    </p>

                    {/* Integrated Search Bar */}
                    <form onSubmit={handleSearchSubmit} className="w-full max-w-2xl relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-purple-600 rounded-full opacity-20 group-hover:opacity-40 blur transition-opacity duration-300"></div>
                        <div className="relative flex items-center bg-white rounded-full p-2 shadow-xl">
                            <div className="pl-4 text-slate-400">
                                <SearchIcon className="w-6 h-6" />
                            </div>
                            <input 
                                type="text" 
                                placeholder="Αναζήτηση κτηνιάτρου, ειδικότητας ή περιοχής..." 
                                className="flex-1 bg-transparent border-none focus:ring-0 text-slate-800 placeholder-slate-500 px-4 py-3 text-base outline-none"
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                            />
                            <button 
                                type="submit"
                                className="bg-slate-900 hover:bg-teal-600 text-white px-8 py-3 rounded-full font-bold transition-all duration-300 shadow-md"
                            >
                                Αναζήτηση
                            </button>
                        </div>
                    </form>

                    {/* Quick Tags */}
                    <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm">
                        <span className="text-slate-400">Συχνές αναζητήσεις:</span>
                        {['Εμβολιασμός', 'Έκτακτη Ανάγκη', 'Καλλωπισμός', 'Παθολογία'].map(tag => (
                            <button 
                                key={tag}
                                onClick={() => {
                                    setSearchText(tag);
                                    setViewState('FIND_VET');
                                }}
                                className="text-teal-300 hover:text-white hover:underline transition-colors"
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Bottom Decorative Element */}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 via-purple-500 to-amber-500 opacity-50"></div>
            </div>
        </div>
    );
};

export default Hero;