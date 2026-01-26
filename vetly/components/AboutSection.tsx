
import React from 'react';
import { ShieldCheckIcon, UserGroupIcon, HeartIcon } from './Icons';

const AboutSection: React.FC = () => {
    return (
        <div className="bg-white py-24 border-t border-slate-100 mt-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    {/* Content */}
                    <div className="order-2 lg:order-1">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50 text-teal-700 text-xs font-bold uppercase tracking-wider mb-6">
                            <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                            Σχετικα με το Vetly
                        </div>
                        <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">
                            Η φροντίδα που τους αξίζει, <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-indigo-600">
                                ψηφιακά και απλά.
                            </span>
                        </h2>
                        <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                            Το Vetly είναι η πρώτη ολοκληρωμένη πλατφόρμα στην Ελλάδα που γεφυρώνει το χάσμα μεταξύ ιδιοκτητών κατοικιδίων και κτηνιάτρων. 
                        </p>
                        <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                            Δημιουργήσαμε ένα οικοσύστημα όπου η υγεία του κατοικιδίου σας είναι προτεραιότητα, προσφέροντας άμεση πρόσβαση σε ιατρικό ιστορικό, ραντεβού και πιστοποιημένους επαγγελματίες.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="flex gap-4">
                                <div className="bg-indigo-50 w-12 h-12 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
                                    <ShieldCheckIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 text-lg">Ασφάλεια</h4>
                                    <p className="text-sm text-slate-500">100% Πιστοποιημένοι Ιατροί και Κλινικές.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="bg-teal-50 w-12 h-12 rounded-2xl flex items-center justify-center text-teal-600 shrink-0">
                                    <HeartIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 text-lg">Αφοσίωση</h4>
                                    <p className="text-sm text-slate-500">Φτιαγμένο από ανθρώπους που αγαπούν τα ζώα.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Image Collage */}
                    <div className="order-1 lg:order-2 relative">
                         <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-indigo-50 to-teal-50 rounded-[3rem] -rotate-6 scale-95 -z-10"></div>
                         <img 
                            src="https://images.unsplash.com/photo-1623366302587-b38b1ddaefd9?auto=format&fit=crop&w=800&q=80" 
                            alt="Vet with Dog" 
                            className="rounded-[2.5rem] shadow-2xl border-4 border-white w-full object-cover h-[500px] rotate-2 hover:rotate-0 transition-transform duration-500"
                        />
                        <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl border border-slate-100 max-w-xs hidden md:block animate-bounce-slow">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="flex -space-x-2">
                                    {[1,2,3,4].map(i => (
                                        <div key={i} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white"></div>
                                    ))}
                                </div>
                                <span className="text-xs font-bold text-slate-500">+2.5k Χρήστες</span>
                            </div>
                            <p className="text-sm font-bold text-slate-800">"Η καλύτερη εφαρμογή για το σκύλο μου!"</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutSection;
