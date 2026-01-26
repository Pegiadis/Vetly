
import React, { useState } from 'react';
import { ViewState } from '../types';
import { 
    UserIcon, 
    StethoscopeIcon, 
    CheckIcon, 
    ArrowRightIcon, 
    SearchIcon, 
    CalendarIcon, 
    ActivityIcon, 
    ChartBarIcon,
    ShieldCheckIcon,
    SmartphoneIcon
} from './Icons';

interface LandingPageProps {
    setViewState: (view: ViewState) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ setViewState }) => {
    const [email, setEmail] = useState('');
    const [userType, setUserType] = useState<'owner' | 'vet'>('owner');
    const [submitted, setSubmitted] = useState(false);
    const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (email) {
            setSubmitted(true);
            // Simulate API call
            setTimeout(() => {
                // Reset or redirect logic could go here
                // For now, we keep the success state visible
            }, 2000);
        }
    };

    const faqs = [
        {
            question: "Είναι η υπηρεσία δωρεάν για τους ιδιοκτήτες;",
            answer: "Ναι! Η χρήση του Vetly για την εύρεση κτηνιάτρου, το κλείσιμο ραντεβού και τη διαχείριση του προφίλ του κατοικιδίου σας είναι εντελώς δωρεάν."
        },
        {
            question: "Πώς μπορώ να κλείσω ραντεβού;",
            answer: "Αφού κάνετε εγγραφή, αναζητήστε τον κτηνίατρο που επιθυμείτε, δείτε το διαθέσιμο ωράριο στο προφίλ του και επιλέξτε την ώρα που σας εξυπηρετεί."
        },
        {
            question: "Τι γίνεται σε περίπτωση έκτακτης ανάγκης;",
            answer: "Το Vetly διαθέτει ειδικό φίλτρο 'Έκτακτη Ανάγκη' στην αναζήτηση, το οποίο εμφανίζει άμεσα κλινικές και ιατρούς που εφημερεύουν εκείνη τη στιγμή."
        },
        {
            question: "Πώς πιστοποιούνται οι κτηνίατροι στην πλατφόρμα;",
            answer: "Κάθε επαγγελματίας υγείας περνάει από διαδικασία επαλήθευσης της άδειας ασκήσεως επαγγέλματος και των στοιχείων του ιατρείου του πριν εμφανιστεί στο Vetly."
        },
        {
            question: "Μπορώ να μεταφέρω το ιστορικό σε νέο κτηνίατρο;",
            answer: "Φυσικά. Με τη λειτουργία 'Κοινοποίηση', μπορείτε να δημιουργήσετε έναν ασφαλή σύνδεσμο ή QR code για να δώσετε προσωρινή πρόσβαση στο ιστορικό του ζώου σας σε οποιονδήποτε κτηνίατρο."
        }
    ];

    const toggleFaq = (index: number) => {
        setOpenFaqIndex(openFaqIndex === index ? null : index);
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* Hero Section with Email Capture */}
            <div className="relative bg-slate-900 pt-32 pb-24 lg:pt-48 lg:pb-40 overflow-hidden px-4 sm:px-6 lg:px-8">
                {/* Background Effects */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                    <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-teal-600/20 rounded-full filter blur-[100px] animate-pulse"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full filter blur-[100px] animate-pulse delay-1000"></div>
                </div>

                <div className="relative z-10 max-w-7xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-teal-300 text-xs font-bold uppercase tracking-wider mb-10 backdrop-blur-sm">
                        <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
                        Η Νο1 Πλατφορμα στην Ελλαδα
                    </div>

                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight mb-8 leading-tight">
                        Η Επόμενη Γενιά στην <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-indigo-400">
                            Κτηνιατρική Φροντίδα
                        </span>
                    </h1>

                    <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-16 leading-relaxed">
                        Το Vetly ενώνει ιδιοκτήτες κατοικιδίων με κορυφαίους κτηνιάτρους. 
                        Κλείστε ραντεβού, διαχειριστείτε το ιστορικό υγείας και αναβαθμίστε τις υπηρεσίες σας.
                    </p>

                    {/* Interaction Card */}
                    <div className="max-w-lg mx-auto bg-white rounded-[2rem] p-2 shadow-2xl shadow-black/30 transform hover:scale-[1.01] transition-transform duration-300 border border-white/10">
                        {submitted ? (
                            <div className="p-10 text-center animate-fade-in">
                                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-green-50">
                                    <CheckIcon className="w-10 h-10" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-2">Ευχαριστούμε!</h3>
                                <p className="text-slate-600 mb-8">
                                    Θα λάβετε σύντομα ενημέρωση στο <span className="font-bold text-slate-900">{email}</span>.
                                </p>
                                <button 
                                    onClick={() => submitted && setViewState('LOGIN')}
                                    className="text-indigo-600 font-bold hover:text-indigo-800 transition-colors flex items-center justify-center gap-2 mx-auto"
                                >
                                    Συνέχεια στην Εφαρμογή <ArrowRightIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="p-6 md:p-8">
                                <div className="flex bg-slate-100 p-1.5 rounded-xl mb-8">
                                    <button
                                        type="button"
                                        onClick={() => setUserType('owner')}
                                        className={`flex-1 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                                            userType === 'owner' 
                                            ? 'bg-white text-teal-700 shadow-sm ring-1 ring-black/5' 
                                            : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                    >
                                        <UserIcon className="w-4 h-4" />
                                        Είμαι Ιδιοκτήτης
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setUserType('vet')}
                                        className={`flex-1 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                                            userType === 'vet' 
                                            ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-black/5' 
                                            : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                    >
                                        <StethoscopeIcon className="w-4 h-4" />
                                        Είμαι Κτηνίατρος
                                    </button>
                                </div>

                                <div className="space-y-5">
                                    <div>
                                        <label htmlFor="email" className="sr-only">Email</label>
                                        <input
                                            type="email"
                                            id="email"
                                            required
                                            placeholder="Το email σας..."
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all text-lg placeholder-slate-400"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className={`w-full py-4 rounded-xl font-bold text-white text-lg shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 ${
                                            userType === 'owner' 
                                            ? 'bg-teal-600 hover:bg-teal-700 shadow-teal-500/20' 
                                            : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20'
                                        }`}
                                    >
                                        {userType === 'owner' ? 'Βρείτε Κτηνίατρο' : 'Εγγραφή Ιατρείου'}
                                        <ArrowRightIcon className="w-5 h-5" />
                                    </button>
                                </div>
                                <p className="text-xs text-slate-400 mt-6">
                                    Εγγραφείτε δωρεάν. Δεν απαιτείται πιστωτική κάρτα.
                                </p>
                            </form>
                        )}
                    </div>
                </div>
            </div>

            {/* Benefits Split Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
                <div className="text-center mb-20">
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Γιατί να επιλέξετε το Vetly;</h2>
                    <p className="text-slate-600 max-w-2xl mx-auto text-lg leading-relaxed">
                        Σχεδιασμένο με προσοχή για να καλύπτει τις ανάγκες κάθε πλευράς της κτηνιατρικής φροντίδας, προσφέροντας εργαλεία που κάνουν τη διαφορά.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
                    {/* Pet Owners Column */}
                    <div className="bg-white rounded-[2.5rem] p-8 lg:p-12 shadow-xl shadow-slate-200/50 border border-slate-100 hover:border-teal-200 transition-all duration-300 group hover:-translate-y-1">
                        <div className="w-20 h-20 bg-teal-50 rounded-3xl flex items-center justify-center text-teal-600 mb-10 group-hover:scale-110 transition-transform duration-500 rotate-3">
                            <UserIcon className="w-10 h-10" />
                        </div>
                        <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-8">Για Ιδιοκτήτες Κατοικιδίων</h3>
                        <ul className="space-y-8">
                            <li className="flex items-start gap-5">
                                <div className="bg-teal-50 p-3 rounded-2xl text-teal-600 mt-1 shrink-0">
                                    <SearchIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-xl mb-2">Εύκολη Εύρεση & Ραντεβού</h4>
                                    <p className="text-slate-600 leading-relaxed">Βρείτε τον ιδανικό κτηνίατρο κοντά σας και κλείστε ραντεβού 24/7 με μερικά κλικ.</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-5">
                                <div className="bg-teal-50 p-3 rounded-2xl text-teal-600 mt-1 shrink-0">
                                    <ActivityIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-xl mb-2">Ψηφιακό Ιστορικό Υγείας</h4>
                                    <p className="text-slate-600 leading-relaxed">Όλα τα εμβόλια, οι εξετάσεις και οι αγωγές του ζώου σας σε ένα ασφαλές μέρος.</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-5">
                                <div className="bg-teal-50 p-3 rounded-2xl text-teal-600 mt-1 shrink-0">
                                    <SmartphoneIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-xl mb-2">Έξυπνες Υπενθυμίσεις</h4>
                                    <p className="text-slate-600 leading-relaxed">Λάβετε αυτόματες ειδοποιήσεις για εμβόλια και ραντεβού για να μην χάνετε τίποτα.</p>
                                </div>
                            </li>
                        </ul>
                        <button 
                            onClick={() => setViewState('FIND_VET')}
                            className="mt-12 w-full py-4 border-2 border-teal-100 text-teal-700 font-bold rounded-2xl hover:bg-teal-50 hover:border-teal-200 transition-colors"
                        >
                            Αναζήτηση Κτηνιάτρου
                        </button>
                    </div>

                    {/* Veterinarians Column */}
                    <div className="bg-white rounded-[2.5rem] p-8 lg:p-12 shadow-xl shadow-slate-200/50 border border-slate-100 hover:border-indigo-200 transition-all duration-300 group hover:-translate-y-1">
                        <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-600 mb-10 group-hover:scale-110 transition-transform duration-500 -rotate-3">
                            <StethoscopeIcon className="w-10 h-10" />
                        </div>
                        <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-8">Για Κτηνιάτρους</h3>
                        <ul className="space-y-8">
                            <li className="flex items-start gap-5">
                                <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600 mt-1 shrink-0">
                                    <ChartBarIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-xl mb-2">Ανάπτυξη Πελατολογίου</h4>
                                    <p className="text-slate-600 leading-relaxed">Προβληθείτε σε χιλιάδες ιδιοκτήτες που ψάχνουν ενεργά για τις υπηρεσίες σας.</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-5">
                                <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600 mt-1 shrink-0">
                                    <CalendarIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-xl mb-2">Ολοκληρωμένη Διαχείριση</h4>
                                    <p className="text-slate-600 leading-relaxed">Διαχειριστείτε ραντεβού, πελάτες και το πρόγραμμά σας από ένα κεντρικό dashboard.</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-5">
                                <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600 mt-1 shrink-0">
                                    <ShieldCheckIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-xl mb-2">Μείωση No-Show</h4>
                                    <p className="text-slate-600 leading-relaxed">Αυτόματες επιβεβαιώσεις και υπενθυμίσεις που μειώνουν δραστικά τις ακυρώσεις.</p>
                                </div>
                            </li>
                        </ul>
                        <button 
                            onClick={() => setViewState('LOGIN')}
                            className="mt-12 w-full py-4 border-2 border-indigo-100 text-indigo-700 font-bold rounded-2xl hover:bg-indigo-50 hover:border-indigo-200 transition-colors"
                        >
                            Είσοδος Επαγγελματία
                        </button>
                    </div>
                </div>
            </div>

            {/* FAQ Section */}
            <div className="bg-white py-24 lg:py-32 border-t border-slate-100">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Συχνές Ερωτήσεις</h2>
                        <p className="text-slate-600 text-lg max-w-2xl mx-auto">
                            Λύστε τις απορίες σας σχετικά με τη λειτουργία του Vetly και ξεκινήστε άμεσα.
                        </p>
                    </div>

                    <div className="space-y-6">
                        {faqs.map((faq, idx) => (
                            <div 
                                key={idx} 
                                className="border border-slate-200 rounded-2xl overflow-hidden transition-all duration-300 hover:border-teal-300 hover:shadow-lg hover:shadow-teal-50"
                            >
                                <button
                                    onClick={() => toggleFaq(idx)}
                                    className="w-full flex items-center justify-between p-6 md:p-8 text-left bg-slate-50 hover:bg-white transition-colors focus:outline-none group"
                                >
                                    <span className="font-bold text-slate-800 text-lg pr-8 group-hover:text-teal-700 transition-colors">{faq.question}</span>
                                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${openFaqIndex === idx ? 'bg-teal-600 text-white rotate-90' : 'bg-white border border-slate-200 text-slate-400 group-hover:border-teal-300 group-hover:text-teal-600'}`}>
                                        <ArrowRightIcon className="w-5 h-5" />
                                    </div>
                                </button>
                                <div 
                                    className={`overflow-hidden transition-all duration-500 ease-in-out ${openFaqIndex === idx ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}`}
                                >
                                    <div className="p-6 md:p-8 pt-0 text-slate-600 leading-relaxed bg-white text-lg">
                                        {faq.answer}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;
