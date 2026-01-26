
import React from 'react';
import { StethoscopeIcon, CalendarIcon, UserGroupIcon, SettingsIcon, CheckIcon, BellIcon, ChartBarIcon } from './Icons';

const VetGuide: React.FC = () => {
    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto font-sans">
            
            {/* Header */}
            <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 mb-4">
                    <StethoscopeIcon className="w-8 h-8" />
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">Οδηγός Χρήσης Vetly Pro</h1>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                    Καλώς ήρθατε στην επαγγελματική πλατφόρμα του Vetly. Εδώ θα βρείτε όλα όσα χρειάζεστε για να ξεκινήσετε.
                </p>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* 1. Dashboard & Status */}
                <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600">
                            <ChartBarIcon className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">Dashboard & Κατάσταση</h3>
                    </div>
                    <div className="space-y-4 text-slate-600">
                        <p>Το Dashboard είναι το κέντρο ελέγχου σας. Από εδώ έχετε μια γρήγορη εικόνα της ημέρας σας.</p>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-2">
                                <CheckIcon className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                                <span><strong>On-Call Status:</strong> Χρησιμοποιήστε τον διακόπτη πάνω δεξιά για να δηλώσετε διαθεσιμότητα για επείγοντα περιστατικά. Αυτό σας εμφανίζει με ειδική σήμανση στην αναζήτηση "SOS".</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckIcon className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                                <span><strong>Στατιστικά:</strong> Παρακολουθήστε τα ραντεβού της ημέρας, τις εκκρεμότητες και τη βαθμολογία σας με μια ματιά.</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* 2. Managing Appointments */}
                <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600">
                            <CalendarIcon className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">Διαχείριση Ραντεβού</h3>
                    </div>
                    <div className="space-y-4 text-slate-600">
                        <p>Δεχτείτε και οργανώστε τις επισκέψεις στο ιατρείο σας.</p>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-2">
                                <CheckIcon className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                                <span><strong>Εγκρίσεις:</strong> Τα νέα αιτήματα εμφανίζονται ως "Pending". Μπορείτε να τα εγκρίνετε ή να τα απορρίψετε. Ο πελάτης ειδοποιείται αυτόματα.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckIcon className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                                <span><strong>Ημερολόγιο:</strong> Δείτε το πρόγραμμά σας σε εβδομαδιαία ή ημερήσια προβολή και προσθέστε χειροκίνητα ραντεβού για πελάτες εκτός εφαρμογής.</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* 3. Patients & History */}
                <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600">
                            <UserGroupIcon className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">Ασθενείς & Ιστορικό</h3>
                    </div>
                    <div className="space-y-4 text-slate-600">
                        <p>Κρατήστε οργανωμένο αρχείο για κάθε ζώο που επισκέπτεται το ιατρείο.</p>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-2">
                                <CheckIcon className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                                <span><strong>Ηλεκτρονικός Φάκελος:</strong> Καταχωρήστε εμβόλια, εξετάσεις και σημειώσεις. Το ιστορικό είναι άμεσα προσβάσιμο στον ιδιοκτήτη.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckIcon className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                                <span><strong>Νέος Ασθενής:</strong> Καταχωρήστε εύκολα νέα ζώα και συνδέστε τα με τα στοιχεία του ιδιοκτήτη τους.</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* 4. Profile & Settings */}
                <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600">
                            <SettingsIcon className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">Προφίλ & Ρυθμίσεις</h3>
                    </div>
                    <div className="space-y-4 text-slate-600">
                        <p>Βεβαιωθείτε ότι οι πληροφορίες του ιατρείου σας είναι πάντα ενημερωμένες.</p>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-2">
                                <CheckIcon className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                                <span><strong>Ωράριο:</strong> Ρυθμίστε τις ώρες λειτουργίας ανά ημέρα. Αυτό καθορίζει πότε μπορούν οι πελάτες να κλείσουν ραντεβού.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckIcon className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                                <span><strong>Στοιχεία:</strong> Ενημερώστε τη διεύθυνση, το τηλέφωνο και το επαγγελματικό σας βιογραφικό για να προσελκύσετε νέους πελάτες.</span>
                            </li>
                        </ul>
                    </div>
                </div>

            </div>

             {/* Notification Tip */}
             <div className="mt-8 bg-amber-50 border border-amber-100 rounded-2xl p-6 flex items-start gap-4">
                <div className="bg-amber-100 p-2 rounded-full text-amber-600 mt-1">
                    <BellIcon className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="font-bold text-amber-900 mb-1">Συμβουλή: Ειδοποιήσεις</h4>
                    <p className="text-sm text-amber-800">
                        Ελέγχετε τακτικά το εικονίδιο με το "καμπανάκι" πάνω δεξιά. Εκεί θα βλέπετε άμεσα ακυρώσεις, αλλαγές ραντεβού και νέα μηνύματα από το σύστημα.
                    </p>
                </div>
            </div>

        </div>
    );
};

export default VetGuide;
