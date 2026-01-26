
import React from 'react';
import { HeartIcon, ShieldCheckIcon, UserGroupIcon, StethoscopeIcon, ActivityIcon, ChartBarIcon, CheckIcon, MapPinIcon } from './Icons';

const AboutPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* 1. Cinematic Hero */}
            <div className="relative bg-slate-900 pt-40 pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-teal-600/10 rounded-full filter blur-[120px] animate-pulse"></div>
                    <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-indigo-600/10 rounded-full filter blur-[120px]"></div>
                </div>
                
                <div className="relative z-10 max-w-4xl mx-auto text-center">
                    <span className="inline-block px-4 py-1 rounded-full bg-white/5 border border-white/10 text-teal-300 text-xs font-bold tracking-[0.2em] uppercase mb-8">
                        Η Ιστορία μας
                    </span>
                    <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-8 tracking-tight leading-tight">
                        Επαναπροσδιορίζουμε τη <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-300">
                            Φροντίδα Κατοικιδίων
                        </span>
                    </h1>
                    <p className="text-xl text-slate-300 leading-relaxed max-w-2xl mx-auto">
                        Το Vetly δεν είναι απλά μια εφαρμογή. Είναι το όραμά μας για έναν κόσμο όπου κάθε ζώο έχει πρόσβαση σε άμεση, ποιοτική και τεχνολογικά προηγμένη περίθαλψη.
                    </p>
                </div>
            </div>

            {/* 2. Statistics Strip */}
            <div className="bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-100">
                        <div className="p-8 text-center">
                            <div className="text-4xl font-bold text-slate-900 mb-2">15k+</div>
                            <div className="text-slate-500 text-sm font-bold uppercase tracking-wider">Χρηστες</div>
                        </div>
                        <div className="p-8 text-center">
                            <div className="text-4xl font-bold text-slate-900 mb-2">850+</div>
                            <div className="text-slate-500 text-sm font-bold uppercase tracking-wider">Κτηνιατροι</div>
                        </div>
                        <div className="p-8 text-center">
                            <div className="text-4xl font-bold text-slate-900 mb-2">12</div>
                            <div className="text-slate-500 text-sm font-bold uppercase tracking-wider">Πολεις</div>
                        </div>
                        <div className="p-8 text-center">
                            <div className="text-4xl font-bold text-slate-900 mb-2">4.9</div>
                            <div className="text-slate-500 text-sm font-bold uppercase tracking-wider">Αξιολογηση</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Main Content: Zig-Zag Layout */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 space-y-32">
                
                {/* Section A: The Origin */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div className="order-2 lg:order-1">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Πώς ξεκίνησαν όλα</h2>
                        <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                            Η ιδέα για το Vetly γεννήθηκε το 2023, όταν η ομάδα μας αντιμετώπισε μια προσωπική δυσκολία: να βρούμε διαθέσιμο κτηνίατρο Σαββατοκύριακο σε μια άγνωστη περιοχή.
                        </p>
                        <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                            Συνειδητοποιήσαμε ότι η κτηνιατρική φροντίδα στην Ελλάδα χρειαζόταν εκσυγχρονισμό. Έλειπε ένα κεντρικό σημείο αναφοράς που να συνδέει αξιόπιστα τους ιδιοκτήτες με τους επαγγελματίες υγείας. Έτσι, αποφασίσαμε να το δημιουργήσουμε.
                        </p>
                        <div className="flex gap-4">
                            <div className="bg-teal-50 px-4 py-2 rounded-lg text-teal-700 font-bold text-sm">Ιδρύθηκε: Αθήνα, 2023</div>
                        </div>
                    </div>
                    <div className="order-1 lg:order-2 relative">
                        <div className="absolute inset-0 bg-teal-200 rounded-[3rem] rotate-6 scale-95 opacity-30"></div>
                        <img 
                            src="https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=800&q=80" 
                            alt="Team working" 
                            className="relative rounded-[3rem] shadow-2xl w-full object-cover h-[500px]"
                        />
                    </div>
                </div>

                {/* Section B: Technology & Safety */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div className="relative">
                        <div className="absolute inset-0 bg-indigo-200 rounded-[3rem] -rotate-6 scale-95 opacity-30"></div>
                        <div className="relative bg-slate-900 rounded-[3rem] p-8 h-[500px] flex flex-col justify-center text-white shadow-2xl overflow-hidden">
                            {/* Decorative tech elements */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl"></div>
                            <div className="space-y-6 relative z-10">
                                <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl backdrop-blur-md">
                                    <ShieldCheckIcon className="w-8 h-8 text-teal-400" />
                                    <div>
                                        <h4 className="font-bold">GDPR Compliant</h4>
                                        <p className="text-xs text-slate-300">Τα δεδομένα σας είναι κρυπτογραφημένα.</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl backdrop-blur-md translate-x-8">
                                    <ActivityIcon className="w-8 h-8 text-teal-400" />
                                    <div>
                                        <h4 className="font-bold">Real-time Sync</h4>
                                        <p className="text-xs text-slate-300">Άμεση ενημέρωση ιατρικού φακέλου.</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl backdrop-blur-md">
                                    <UserGroupIcon className="w-8 h-8 text-teal-400" />
                                    <div>
                                        <h4 className="font-bold">Verified Pros</h4>
                                        <p className="text-xs text-slate-300">100% Έλεγχος πιστοποίησης ιατρών.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Τεχνολογία με Ασφάλεια</h2>
                        <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                            Η εμπιστοσύνη είναι το θεμέλιό μας. Χρησιμοποιούμε τεχνολογίες αιχμής για να διασφαλίσουμε ότι τα ιατρικά δεδομένα των κατοικιδίων σας είναι ασφαλή και προσβάσιμα μόνο από εσάς και τον κτηνίατρό σας.
                        </p>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                                <CheckIcon className="w-6 h-6 text-teal-500 mt-0.5" />
                                <span className="text-slate-700">Πλήρης επαλήθευση άδειας ασκήσεως επαγγέλματος για κάθε κτηνίατρο.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <CheckIcon className="w-6 h-6 text-teal-500 mt-0.5" />
                                <span className="text-slate-700">Κρυπτογραφημένη επικοινωνία και αποθήκευση δεδομένων.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <CheckIcon className="w-6 h-6 text-teal-500 mt-0.5" />
                                <span className="text-slate-700">Σύστημα αξιολογήσεων μόνο από επιβεβαιωμένα ραντεβού.</span>
                            </li>
                        </ul>
                    </div>
                </div>

            </div>

            {/* 4. The Team */}
            <div className="bg-white py-24 border-t border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="inline-block p-3 rounded-full bg-indigo-50 text-indigo-600 mb-6">
                        <UserGroupIcon className="w-8 h-8" />
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Η Ομάδα πίσω από το Vetly</h2>
                    <p className="text-slate-500 max-w-2xl mx-auto mb-16">
                        Μια ομάδα από προγραμματιστές, κτηνιάτρους και σχεδιαστές που μοιράζονται το ίδιο πάθος: την αγάπη για τα ζώα.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { name: 'Αλέξανδρος Δ.', role: 'Co-Founder & CEO', img: 'https://i.pravatar.cc/300?u=alex' },
                            { name: 'Μαρία Κ.', role: 'Head of Veterinary Relations', img: 'https://i.pravatar.cc/300?u=maria' },
                            { name: 'Γιάννης Π.', role: 'Lead Developer', img: 'https://i.pravatar.cc/300?u=john' },
                            { name: 'Ελένη Σ.', role: 'Product Designer', img: 'https://i.pravatar.cc/300?u=elena' },
                        ].map((member, idx) => (
                            <div key={idx} className="group">
                                <div className="w-40 h-40 mx-auto rounded-full overflow-hidden border-4 border-slate-50 mb-6 shadow-lg group-hover:scale-105 transition-transform duration-300">
                                    <img src={member.img} alt={member.name} className="w-full h-full object-cover" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900">{member.name}</h3>
                                <p className="text-teal-600 font-medium text-sm">{member.role}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 5. Values Grid */}
            <div className="bg-slate-50 py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 mb-6">
                                <HeartIcon className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Ενσυναίσθηση</h3>
                            <p className="text-slate-600">Κατανοούμε το άγχος του ιδιοκτήτη και την ευθύνη του κτηνιάτρου. Σχεδιάζουμε με γνώμονα τον άνθρωπο και το ζώο.</p>
                        </div>
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                            <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 mb-6">
                                <ChartBarIcon className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Καινοτομία</h3>
                            <p className="text-slate-600">Δεν σταματάμε να εξελισσόμαστε. Φέρνουμε την τεχνητή νοημοσύνη και τα digital tools στην υπηρεσία της υγείας.</p>
                        </div>
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                            <div className="w-12 h-12 bg-teal-100 rounded-2xl flex items-center justify-center text-teal-600 mb-6">
                                <StethoscopeIcon className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Επαγγελματισμός</h3>
                            <p className="text-slate-600">Συνεργαζόμαστε μόνο με πιστοποιημένους φορείς και προάγουμε την υπεύθυνη κηδεμονία ζώων.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 6. Locations / Footer Map Hint */}
            <div className="py-24 text-center px-4">
                <h2 className="text-2xl font-bold text-slate-900 mb-8">Δραστηριοποιούμαστε σε όλη την Ελλάδα</h2>
                <div className="flex flex-wrap justify-center gap-4">
                    {['Αθήνα', 'Θεσσαλονίκη', 'Πάτρα', 'Ηράκλειο', 'Λάρισα', 'Βόλος', 'Ιωάννινα'].map(city => (
                        <span key={city} className="px-6 py-2 bg-white border border-slate-200 rounded-full text-slate-600 font-medium shadow-sm flex items-center gap-2">
                            <MapPinIcon className="w-4 h-4 text-teal-500" /> {city}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AboutPage;
