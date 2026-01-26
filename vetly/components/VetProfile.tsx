import React, { useState } from 'react';
import { Vet } from '../types';
import { StarIcon, CalendarIcon, MapPinIcon, PhoneIcon, ClockIcon } from './Icons';

interface VetProfileProps {
    vet: Vet;
    onBack: () => void;
}

const VetProfile: React.FC<VetProfileProps> = ({ vet, onBack }) => {
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [selectedTime, setSelectedTime] = useState<string>('');
    const [bookingStep, setBookingStep] = useState<'select' | 'confirm' | 'success'>('select');

    const availableTimes = ['09:00', '10:00', '11:30', '14:00', '16:30', '18:00'];

    const handleBook = () => {
        setBookingStep('confirm');
        setTimeout(() => {
            setBookingStep('success');
        }, 1500);
    };

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <button 
                onClick={onBack}
                className="mb-6 flex items-center text-slate-500 hover:text-primary transition-colors font-medium"
            >
                ← Πίσω στην αναζήτηση
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Info */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                        <div className="flex flex-col md:flex-row gap-6 items-start">
                            <img src={vet.image} alt={vet.name} className="w-32 h-32 rounded-2xl object-cover shadow-md" />
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900">{vet.name}</h1>
                                <p className="text-teal-600 text-lg font-medium mb-2">{vet.specialty}</p>
                                <div className="flex items-center gap-2 text-slate-500 mb-1">
                                    <MapPinIcon className="w-4 h-4" />
                                    {vet.address}
                                </div>
                                <div className="flex items-center gap-2 text-slate-500 mb-4">
                                    <PhoneIcon className="w-4 h-4" />
                                    {vet.phone}
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                                        <StarIcon className="w-4 h-4 text-amber-400" fill="currentColor" />
                                        <span className="font-bold text-amber-700">{vet.rating}</span>
                                        <span className="text-amber-600 text-sm">({vet.reviewsCount} αξιολογήσεις)</span>
                                    </div>
                                    {vet.isOnCall && (
                                        <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-sm font-bold border border-red-100">
                                            Εφημερεύει
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <hr className="my-6 border-slate-100" />
                        
                        <h3 className="text-xl font-bold text-slate-800 mb-3">Πληροφορίες</h3>
                        <p className="text-slate-600 leading-relaxed">{vet.description}</p>
                        
                        <div className="mt-6 grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <span className="text-slate-400 text-xs uppercase font-bold tracking-wider">Ωραριο</span>
                                <p className="font-medium text-slate-800">{vet.hours}</p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <span className="text-slate-400 text-xs uppercase font-bold tracking-wider">Πολη</span>
                                <p className="font-medium text-slate-800">{vet.city}</p>
                            </div>
                        </div>
                    </div>

                    {/* Reviews Mock */}
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                        <h3 className="text-xl font-bold text-slate-800 mb-4">Αξιολογήσεις Πελατών</h3>
                        <div className="space-y-4">
                            {[1, 2].map((review) => (
                                <div key={review} className="border-b border-slate-50 last:border-0 pb-4 last:pb-0">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-bold text-slate-700">Χρήστης {review}</span>
                                        <div className="flex text-amber-400">★★★★★</div>
                                    </div>
                                    <p className="text-slate-500 text-sm">Εξαιρετικός γιατρός, πολύ προσεκτικός με τον σκύλο μου. Το συνιστώ ανεπιφύλακτα!</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Booking Widget */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-3xl p-6 shadow-lg border border-slate-100 sticky top-24">
                        <div className="flex items-center gap-2 mb-6 text-teal-700">
                            <CalendarIcon className="w-6 h-6" />
                            <h3 className="text-xl font-bold">Κλείστε Ραντεβού</h3>
                        </div>

                        {bookingStep === 'select' && (
                            <>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Ημερομηνία</label>
                                    <input 
                                        type="date" 
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                    />
                                </div>
                                
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Ώρα</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {availableTimes.map(time => (
                                            <button
                                                key={time}
                                                onClick={() => setSelectedTime(time)}
                                                className={`py-2 rounded-lg text-sm font-medium transition-all ${selectedTime === time ? 'bg-teal-600 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-teal-50'}`}
                                            >
                                                {time}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button 
                                    disabled={!selectedDate || !selectedTime}
                                    onClick={handleBook}
                                    className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                                >
                                    Συνέχεια
                                </button>
                            </>
                        )}

                        {bookingStep === 'confirm' && (
                            <div className="flex flex-col items-center py-10">
                                <div className="w-10 h-10 border-4 border-slate-200 border-t-teal-600 rounded-full animate-spin mb-4"></div>
                                <p className="text-slate-600">Επεξεργασία...</p>
                            </div>
                        )}

                        {bookingStep === 'success' && (
                            <div className="flex flex-col items-center py-6 text-center">
                                <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-4 ring-8 ring-amber-50/50 animate-pulse">
                                    <ClockIcon className="w-10 h-10 text-amber-500" />
                                </div>
                                <h4 className="text-xl font-bold text-slate-900 mb-2">Αίτημα σε Αναμονή</h4>
                                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-6 text-left w-full">
                                    <p className="text-slate-700 text-sm mb-2">
                                        Το αίτημά σας για ραντεβού καταχωρήθηκε επιτυχώς και αναμένει έγκριση.
                                    </p>
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wide mt-3">
                                        <span>Λεπτομερειες</span>
                                        <div className="h-px bg-slate-200 flex-1"></div>
                                    </div>
                                    <div className="mt-2 text-sm">
                                        <div className="flex justify-between py-1">
                                            <span className="text-slate-500">Ιατρός:</span>
                                            <span className="font-bold text-slate-800 text-right">{vet.name}</span>
                                        </div>
                                        <div className="flex justify-between py-1">
                                            <span className="text-slate-500">Ημερομηνία:</span>
                                            <span className="font-bold text-slate-800">{selectedDate}</span>
                                        </div>
                                        <div className="flex justify-between py-1">
                                            <span className="text-slate-500">Ώρα:</span>
                                            <span className="font-bold text-slate-800">{selectedTime}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <p className="text-slate-500 text-xs mb-6 leading-relaxed">
                                    Θα λάβετε ειδοποίηση μόλις ο κτηνίατρος εγκρίνει ή απορρίψει το αίτημα. Μπορείτε να παρακολουθείτε την εξέλιξη στο προφίλ σας.
                                </p>

                                <button 
                                    onClick={onBack}
                                    className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg"
                                >
                                    Επιστροφή
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VetProfile;