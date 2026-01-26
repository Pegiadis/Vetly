
import React from 'react';
import { SearchIcon, CalendarIcon, ActivityIcon, BellIcon, ArrowRightIcon, UserIcon, ShareIcon, SmartphoneIcon, ShieldCheckIcon } from './Icons';

interface HowItWorksProps {
    onBack: () => void;
    onGoToCalendar?: () => void;
}

const HowItWorks: React.FC<HowItWorksProps> = ({ onBack, onGoToCalendar }) => {
    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto font-sans">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                <div>
                    <button 
                        onClick={onBack}
                        className="mb-4 inline-flex items-center text-slate-500 hover:text-teal-600 transition-colors font-bold text-sm uppercase tracking-wide"
                    >
                        <span className="mr-2">←</span> Πισω στο Dashboard
                    </button>
                    <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 leading-tight">
                        Οδηγός Χρήσης <span className="text-teal-600">Vetly</span>
                    </h1>
                    <p className="text-lg text-slate-500 mt-2 max-w-2xl">
                        Αξιοποιήστε στο έπακρο τα εργαλεία μας για την υγεία του κατοικιδίου σας.
                    </p>
                </div>
                <div className="hidden md:block">
                    <div className="bg-teal-50 text-teal-800 font-bold px-4 py-2 rounded-xl text-sm">
                        Έκδοση 2.0
                    </div>
                </div>
            </div>

            {/* Core Journey Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                {/* Step 1 */}
                <div className="bg-white p-8 rounded-[2rem] shadow-lg shadow-slate-100 border border-slate-100 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-teal-50 to-teal-100 rounded-bl-[100%] -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-teal-600 shadow-sm mb-6 ring-4 ring-teal-50">
                            <SearchIcon className="w-7 h-7" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">1. Εύρεση</h3>
                        <p className="text-slate-500 text-sm leading-relaxed mb-4">
                            Αναζητήστε κτηνιάτρους βάσει περιοχής, ειδικότητας και διαθεσιμότητας.
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <span className="px-2 py-1 bg-slate-50 text-slate-600 text-xs font-bold rounded-md border border-slate-200">Χάρτης</span>
                            <span className="px-2 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-md border border-red-100">SOS</span>
                        </div>
                    </div>
                </div>

                {/* Step 2 */}
                <div className="bg-white p-8 rounded-[2rem] shadow-lg shadow-slate-100 border border-slate-100 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-bl-[100%] -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm mb-6 ring-4 ring-indigo-50">
                            <CalendarIcon className="w-7 h-7" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">2. Ραντεβού</h3>
                        <p className="text-slate-500 text-sm leading-relaxed mb-4">
                            Κλείστε ραντεβού online 24/7. Λάβετε επιβεβαίωση και υπενθυμίσεις.
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <span className="px-2 py-1 bg-slate-50 text-slate-600 text-xs font-bold rounded-md border border-slate-200">Online Booking</span>
                            <span className="px-2 py-1 bg-green-50 text-green-600 text-xs font-bold rounded-md border border-green-100">SMS</span>
                        </div>
                    </div>
                </div>

                {/* Step 3 */}
                <div className="bg-white p-8 rounded-[2rem] shadow-lg shadow-slate-100 border border-slate-100 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-rose-50 to-rose-100 rounded-bl-[100%] -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-rose-600 shadow-sm mb-6 ring-4 ring-rose-50">
                            <ActivityIcon className="w-7 h-7" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">3. Υγεία</h3>
                        <p className="text-slate-500 text-sm leading-relaxed mb-4">
                            Κρατήστε πλήρες ιστορικό υγείας, εμβολίων και αγωγών σε ένα σημείο.
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <span className="px-2 py-1 bg-slate-50 text-slate-600 text-xs font-bold rounded-md border border-slate-200">Ιστορικό</span>
                            <span className="px-2 py-1 bg-purple-50 text-purple-600 text-xs font-bold rounded-md border border-purple-100">Στατιστικά</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Smart Features Bento Grid */}
            <h2 className="text-2xl font-bold text-slate-900 mb-8">Έξυπνες Λειτουργίες</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                
                {/* Share History - Large Card */}
                <div className="md:col-span-2 bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3"></div>
                    <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
                        <div className="flex-1">
                            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm">
                                <ShareIcon className="w-6 h-6 text-teal-400" />
                            </div>
                            <h3 className="text-2xl font-bold mb-2">Κοινοποίηση Ιστορικού</h3>
                            <p className="text-slate-400 mb-6 leading-relaxed">
                                Αλλάζετε κτηνίατρο ή πάτε διακοπές; Δημιουργήστε ένα ασφαλές link ή QR code και μοιραστείτε το ιατρικό ιστορικό του κατοικιδίου σας προσωρινά με οποιονδήποτε επαγγελματία.
                            </p>
                            <button className="px-4 py-2 bg-teal-600 hover:bg-teal-500 rounded-lg text-sm font-bold transition-colors">
                                Δοκιμάστε το στο Προφίλ
                            </button>
                        </div>
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10 w-full md:w-64 shrink-0">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 bg-slate-700 rounded-full"></div>
                                <div className="h-2 w-20 bg-slate-700 rounded"></div>
                            </div>
                            <div className="space-y-2">
                                <div className="h-2 w-full bg-slate-700/50 rounded"></div>
                                <div className="h-2 w-3/4 bg-slate-700/50 rounded"></div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-white/10 flex justify-center">
                                <div className="w-24 h-24 bg-white p-1 rounded">
                                    <div className="w-full h-full bg-slate-900"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notifications Card */}
                <div className="bg-indigo-50 rounded-[2rem] p-8 border border-indigo-100 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-200 rounded-full opacity-50 blur-2xl"></div>
                    <div>
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-4 shadow-sm text-indigo-600">
                            <BellIcon className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-indigo-900 mb-2">Smart Reminders</h3>
                        <p className="text-indigo-700/80 text-sm">
                            Μην ξεχνάτε ποτέ ξανά εμβόλια ή χάπια. Το σύστημα σας ειδοποιεί αυτόματα.
                        </p>
                    </div>
                    <div className="mt-6 bg-white p-3 rounded-xl shadow-sm border border-indigo-100 flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                            <SmartphoneIcon className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-800">Εμβολιασμός</p>
                            <p className="text-[10px] text-slate-500">Αύριο, 10:00 π.μ.</p>
                        </div>
                    </div>
                </div>

                {/* Security Card */}
                <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm hover:border-teal-300 transition-colors group">
                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mb-4 text-slate-600 group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
                        <ShieldCheckIcon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Ασφάλεια</h3>
                    <p className="text-slate-500 text-sm mb-4">
                        Τα δεδομένα σας είναι κρυπτογραφημένα και προσβάσιμα μόνο από εσάς και τους γιατρούς που επιλέγετε.
                    </p>
                    <span className="text-xs font-bold text-teal-600 uppercase tracking-wide">GDPR Compliant</span>
                </div>

                {/* Calendar Card */}
                <div className="md:col-span-2 bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-8">
                    <div className="flex-1">
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">Ημερολόγιο Υγείας</h3>
                        <p className="text-slate-500 mb-6">
                            Οργανώστε τη ζωή του κατοικιδίου σας. Προσθέστε υπενθυμίσεις για φάρμακα, ραντεβού καλλωπισμού και γενέθλια σε ένα όμορφο ημερολόγιο.
                        </p>
                        <button 
                            onClick={onGoToCalendar}
                            className="text-indigo-600 font-bold text-sm flex items-center gap-2 hover:underline"
                        >
                            Μετάβαση στο Ημερολόγιο <ArrowRightIcon className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="flex-1 w-full bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <div className="grid grid-cols-7 gap-2 text-center text-xs text-slate-400 mb-2">
                            <span>Δ</span><span>Τ</span><span>Τ</span><span>Π</span><span>Π</span><span>Σ</span><span>Κ</span>
                        </div>
                        <div className="grid grid-cols-7 gap-2">
                            {[...Array(7)].map((_, i) => (
                                <div key={i} className={`h-8 rounded-lg flex items-center justify-center text-xs font-bold ${i === 3 ? 'bg-teal-600 text-white shadow-lg shadow-teal-200' : 'bg-white text-slate-600'}`}>
                                    {10 + i}
                                </div>
                            ))}
                        </div>
                        <div className="mt-3 space-y-2">
                            <div className="bg-white p-2 rounded-lg border-l-4 border-teal-500 text-xs font-bold text-slate-700 shadow-sm">
                                Χάπι Αποπαρασίτωσης
                            </div>
                            <div className="bg-white p-2 rounded-lg border-l-4 border-indigo-500 text-xs font-bold text-slate-700 shadow-sm">
                                Ραντεβού με Δρ. Παππά
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Bottom CTA */}
            <div className="text-center">
                <button 
                    onClick={onBack}
                    className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold text-lg hover:bg-teal-600 transition-colors shadow-xl shadow-slate-200 hover:shadow-teal-200 inline-flex items-center gap-3"
                >
                    Έχω καταλάβει, πάμε! <ArrowRightIcon className="w-5 h-5" />
                </button>
            </div>

        </div>
    );
};

export default HowItWorks;
