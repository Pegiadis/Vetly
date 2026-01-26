import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer className="bg-slate-900 text-white py-12 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    <div className="col-span-1 md:col-span-2">
                        <div className="text-2xl font-bold tracking-tight mb-4">Vetly</div>
                        <p className="text-slate-400 max-w-sm">
                            Η πλατφόρμα που φέρνει την κτηνιατρική φροντίδα στην ψηφιακή εποχή. 
                            Αγάπη για τα ζώα, τεχνολογία για τους ανθρώπους.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4 text-slate-200">Υπηρεσίες</h4>
                        <ul className="space-y-2 text-slate-400 text-sm">
                            <li><a href="#" className="hover:text-teal-400 transition-colors">Αναζήτηση Ιατρού</a></li>
                            <li><a href="#" className="hover:text-teal-400 transition-colors">Έκτακτη Ανάγκη</a></li>
                            <li><a href="#" className="hover:text-teal-400 transition-colors">Ηλεκτρονική Συνταγογράφηση</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4 text-slate-200">Νομικά</h4>
                        <ul className="space-y-2 text-slate-400 text-sm">
                            <li><a href="#" className="hover:text-teal-400 transition-colors">Όροι Χρήσης</a></li>
                            <li><a href="#" className="hover:text-teal-400 transition-colors">Πολιτική Απορρήτου</a></li>
                            <li><a href="#" className="hover:text-teal-400 transition-colors">Cookies</a></li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center">
                    <p className="text-slate-500 text-sm">© 2024 Vetly Greece. All rights reserved.</p>
                    <div className="flex space-x-4 mt-4 md:mt-0">
                        {/* Social Icons */}
                        <a href="#" className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center hover:bg-teal-600 transition-colors text-white">
                           IG
                        </a>
                        <a href="#" className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center hover:bg-teal-600 transition-colors text-white">
                           FB
                        </a>
                        <a href="#" className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center hover:bg-teal-600 transition-colors text-white">
                           IN
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
