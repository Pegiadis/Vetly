'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from './Navbar';
import { 
    SearchIcon, 
    UserIcon, 
    ActivityIcon, 
    ArrowRightIcon,
    CalendarIcon,
    ShieldCheckIcon,
    HeartIcon,
    StethoscopeIcon
} from './Icons';
import { MOCK_BLOG_POSTS } from '@/lib/constants';

const HomePage: React.FC = () => {
    const router = useRouter();
    const [searchText, setSearchText] = useState('');

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchText.trim()) {
            // Navigate to find vet page (to be implemented later)
            console.log('Search for:', searchText);
        }
    };

    const handleQuickTag = (tag: string) => {
        setSearchText(tag);
        console.log('Quick search:', tag);
    };

    return (
        <div>
            <Navbar />
            <div className="animate-fade-in">
                {/* Hero Section */}
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
                                    onClick={() => handleQuickTag(tag)}
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

            {/* Core Services (Overlapping Cards) */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20 mb-24">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Card 1: Find Vet */}
                    <div className="bg-white p-8 rounded-[2rem] shadow-xl hover:-translate-y-2 transition-all duration-300 border border-slate-100 flex flex-col items-start group">
                        <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600 mb-6 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                            <SearchIcon className="w-7 h-7" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-3">Βρείτε Κτηνίατρο</h3>
                        <p className="text-slate-500 mb-8 flex-grow leading-relaxed">
                            Αναζητήστε πιστοποιημένους κτηνιάτρους στην περιοχή σας, διαβάστε κριτικές και κλείστε ραντεβού άμεσα.
                        </p>
                        <button 
                            onClick={() => console.log('Navigate to Find Vet')}
                            className="flex items-center gap-2 text-teal-600 font-bold hover:gap-3 transition-all group-hover:text-teal-700"
                        >
                            Αναζήτηση <ArrowRightIcon className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Card 2: Emergency */}
                    <div className="bg-white p-8 rounded-[2rem] shadow-xl hover:-translate-y-2 transition-all duration-300 border border-slate-100 flex flex-col items-start group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-red-50 rounded-bl-[2rem] -mr-4 -mt-4 z-0"></div>
                        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 mb-6 relative z-10 group-hover:bg-red-600 group-hover:text-white transition-colors">
                            <ActivityIcon className="w-7 h-7" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-3 relative z-10">Έκτακτη Ανάγκη</h3>
                        <p className="text-slate-500 mb-8 flex-grow leading-relaxed relative z-10">
                            Δείτε ποια ιατρεία και κλινικές εφημερεύουν τώρα κοντά σας για άμεση εξυπηρέτηση.
                        </p>
                        <button 
                            onClick={() => console.log('Navigate to Emergency')}
                            className="flex items-center gap-2 text-red-600 font-bold hover:gap-3 transition-all relative z-10"
                        >
                            Εύρεση Βοήθειας SOS <ArrowRightIcon className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Card 3: My Profile */}
                    <div className="bg-white p-8 rounded-[2rem] shadow-xl hover:-translate-y-2 transition-all duration-300 border border-slate-100 flex flex-col items-start group">
                        <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <UserIcon className="w-7 h-7" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-3">Το Κατοικίδιό μου</h3>
                        <p className="text-slate-500 mb-8 flex-grow leading-relaxed">
                            Διαχειριστείτε το ιατρικό ιστορικό, τα ραντεβού και τις υπενθυμίσεις εμβολιασμών σε ένα μέρος.
                        </p>
                        <button 
                            onClick={() => router.push('/login')}
                            className="flex items-center gap-2 text-indigo-600 font-bold hover:gap-3 transition-all group-hover:text-indigo-700"
                        >
                            Διαχείριση Προφίλ <ArrowRightIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Feature Section (Split Layout) */}
            <div className="py-24 bg-slate-50 border-t border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div className="order-2 lg:order-1">
                            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-6 leading-tight">
                                Φροντίδα υψηλών προδιαγραφών,<br/>
                                <span className="text-teal-600">απλά και ψηφιακά.</span>
                            </h2>
                            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                                Το Vetly δεν είναι απλά ένας κατάλογος. Είναι το εργαλείο που συνδέει υπεύθυνους ιδιοκτήτες με κορυφαίους επαγγελματίες, εξασφαλίζοντας την καλύτερη δυνατή υγεία για τους τετράποδους φίλους μας.
                            </p>
                            
                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="bg-white p-2 rounded-full text-teal-600 shadow-sm border border-slate-100 mt-1">
                                        <ShieldCheckIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold text-slate-900">Πιστοποιημένοι Επαγγελματίες</h4>
                                        <p className="text-slate-500 mt-1">Όλοι οι κτηνίατροι ελέγχονται για την άδεια ασκήσεως επαγγέλματος.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="bg-white p-2 rounded-full text-teal-600 shadow-sm border border-slate-100 mt-1">
                                        <CalendarIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold text-slate-900">Online Ραντεβού 24/7</h4>
                                        <p className="text-slate-500 mt-1">Κλείστε ραντεβού οποιαδήποτε στιγμή, χωρίς τηλεφωνικές αναμονές.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="bg-white p-2 rounded-full text-teal-600 shadow-sm border border-slate-100 mt-1">
                                        <HeartIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold text-slate-900">Ιστορικό Υγείας</h4>
                                        <p className="text-slate-500 mt-1">Κρατήστε αρχείο εμβολίων και εξετάσεων, προσβάσιμο πάντα από το κινητό σας.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="order-1 lg:order-2 relative">
                            <div className="absolute top-0 right-0 w-full h-full bg-teal-100 rounded-[3rem] rotate-3 scale-95 -z-10"></div>
                            <img 
                                src="https://images.unsplash.com/photo-1623366302587-b38b1ddaefd9?auto=format&fit=crop&w=800&q=80" 
                                alt="Veterinarian with dog" 
                                className="rounded-[3rem] shadow-2xl border-4 border-white w-full object-cover h-[600px]" 
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats & Trust Strip (Clean) */}
            <div className="bg-white py-16 border-y border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        <div>
                            <div className="text-4xl font-extrabold text-slate-900 mb-2">15k+</div>
                            <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">Ιδιοκτητες</div>
                        </div>
                        <div>
                            <div className="text-4xl font-extrabold text-slate-900 mb-2">850+</div>
                            <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">Κτηνιατροι</div>
                        </div>
                        <div>
                            <div className="text-4xl font-extrabold text-slate-900 mb-2">12</div>
                            <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">Πολεις</div>
                        </div>
                        <div>
                            <div className="text-4xl font-extrabold text-slate-900 mb-2">4.9</div>
                            <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">Μ.Ο. Αξιολογησης</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pro CTA Section */}
            <div className="bg-slate-900 py-24 relative overflow-hidden">
                {/* Decorative */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-600/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 bg-indigo-900/50 border border-indigo-500/30 rounded-full px-4 py-1 text-indigo-300 text-xs font-bold uppercase mb-6">
                        <StethoscopeIcon className="w-4 h-4" />
                        Για Επαγγελματιες
                    </div>
                    <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6">
                        Είστε Κτηνίατρος;
                    </h2>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                        Αναβαθμίστε το ιατρείο σας με το Vetly Pro. Διαχειριστείτε ραντεβού, ασθενείς και προωθήστε τις υπηρεσίες σας σε χιλιάδες ιδιοκτήτες.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button 
                            onClick={() => router.push('/login')}
                            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-lg transition-all shadow-lg shadow-indigo-900/50"
                        >
                            Είσοδος / Εγγραφή Ιατρού
                        </button>
                        <button 
                            onClick={() => console.log('Learn more')}
                            className="px-8 py-4 bg-transparent border border-slate-700 hover:bg-slate-800 text-white rounded-2xl font-bold text-lg transition-all"
                        >
                            Μάθετε Περισσότερα
                        </button>
                    </div>
                </div>
            </div>

            {/* Blog Teaser (Simple Grid) */}
            <div className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                     <div className="flex justify-between items-end mb-12">
                        <div>
                            <h3 className="text-3xl font-bold text-slate-900 mb-2">Vetly Magazine</h3>
                            <p className="text-slate-500">Συμβουλές και νέα από τους ειδικούς.</p>
                        </div>
                        <button onClick={() => console.log('View all blog')} className="hidden md:flex items-center gap-2 text-teal-600 font-bold hover:gap-3 transition-all">
                            Όλα τα άρθρα <ArrowRightIcon className="w-4 h-4" />
                        </button>
                     </div>
                     
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                         {MOCK_BLOG_POSTS.slice(0, 3).map(post => (
                             <div key={post.id} onClick={() => console.log('View post:', post.id)} className="cursor-pointer group">
                                 <div className="rounded-2xl overflow-hidden mb-4 h-56 relative">
                                     <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                     <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg text-xs font-bold text-slate-800 shadow-sm">
                                         {post.category}
                                     </div>
                                 </div>
                                 <h4 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-teal-600 transition-colors line-clamp-2">
                                     {post.title}
                                 </h4>
                                 <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                     <span>{post.date}</span>
                                     <span>•</span>
                                     <span>{post.readTime} διάβασμα</span>
                                 </div>
                             </div>
                         ))}
                     </div>
                </div>
            </div>
            </div>
        </div>
    );
};

export default HomePage;
