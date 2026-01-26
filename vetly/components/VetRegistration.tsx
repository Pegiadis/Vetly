
import React, { useState } from 'react';
import { Vet } from '../types';
import { UserIcon, BuildingIcon, IdentificationIcon, PhoneIcon, MapPinIcon, LockIcon, ArrowRightIcon, CheckIcon, StethoscopeIcon } from './Icons';

interface VetRegistrationProps {
    onRegister: (vet: Vet) => void;
    onCancel: () => void;
}

const VetRegistration: React.FC<VetRegistrationProps> = ({ onRegister, onCancel }) => {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const [formData, setFormData] = useState({
        name: '', // Vet Name
        email: '',
        password: '',
        phone: '',
        clinicName: '',
        address: '',
        city: '',
        specialty: '',
        licenseNumber: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (step < 3) {
            setStep((prev) => (prev + 1) as 1 | 2 | 3);
        } else {
            setIsSubmitting(true);
            // Simulate API call
            setTimeout(() => {
                const newVet: Vet = {
                    id: `v-new-${Math.random().toString(36).substr(2, 9)}`,
                    name: formData.name, // For simplicity, Name is Vet Name
                    specialty: formData.specialty || 'Γενικός Κτηνίατρος',
                    address: formData.address,
                    city: formData.city,
                    rating: 0,
                    reviewsCount: 0,
                    image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=400&q=80', // Default placeholder
                    isOnCall: false,
                    coordinates: { x: 50, y: 50 }, // Mock
                    phone: formData.phone,
                    email: formData.email,
                    licenseNumber: formData.licenseNumber,
                    hours: '09:00 - 17:00', // Default
                    description: `Καλώς ήρθατε στο ιατρείο ${formData.clinicName}.`,
                };
                setShowSuccess(true);
                setTimeout(() => {
                    onRegister(newVet);
                }, 2000);
            }, 1500);
        }
    };

    if (showSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-indigo-50 px-4">
                <div className="bg-white rounded-3xl p-10 shadow-2xl text-center max-w-md w-full animate-scale-in">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-green-50">
                        <CheckIcon className="w-12 h-12 text-green-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-2">Καλώς ήρθατε!</h2>
                    <p className="text-slate-600 mb-6">
                        Ο λογαριασμός για το ιατρείο <span className="font-bold">{formData.clinicName}</span> δημιουργήθηκε επιτυχώς.
                    </p>
                    <p className="text-sm text-indigo-600 font-bold animate-pulse">Μετάβαση στο Dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-indigo-50 flex flex-col lg:flex-row">
            {/* Left Panel - Info */}
            <div className="lg:w-5/12 bg-indigo-900 p-8 lg:p-16 text-white flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-white/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] bg-teal-500/20 rounded-full blur-3xl"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-2 text-2xl font-bold mb-8">
                        <StethoscopeIcon className="w-8 h-8 text-teal-400" />
                        Vetly Pro
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-6">
                        Αναβαθμίστε τις <br/> υπηρεσίες του <br/> <span className="text-teal-400">ιατρείου σας.</span>
                    </h1>
                    <p className="text-indigo-200 text-lg leading-relaxed mb-8">
                        Εγγραφείτε στο μεγαλύτερο δίκτυο κτηνιατρικής φροντίδας στην Ελλάδα. 
                        Διαχειριστείτε ραντεβού, ασθενείς και προωθήστε το ιατρείο σας σε χιλιάδες ιδιοκτήτες.
                    </p>
                    
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                            <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center text-white font-bold">1</div>
                            <div>
                                <h4 className="font-bold">Δημιουργία Προφίλ</h4>
                                <p className="text-sm text-indigo-200">Καταχωρήστε τα στοιχεία του ιατρείου.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                            <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">2</div>
                            <div>
                                <h4 className="font-bold">Πιστοποίηση</h4>
                                <p className="text-sm text-indigo-200">Επαλήθευση άδειας ασκήσεως επαγγέλματος.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                            <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold">3</div>
                            <div>
                                <h4 className="font-bold">Είστε Έτοιμοι!</h4>
                                <p className="text-sm text-indigo-200">Ξεκινήστε να δέχεστε ραντεβού.</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <p className="text-xs text-indigo-300 mt-8 relative z-10">© 2024 Vetly Pro. All rights reserved.</p>
            </div>

            {/* Right Panel - Form */}
            <div className="lg:w-7/12 p-6 lg:p-16 flex items-center justify-center">
                <div className="max-w-2xl w-full bg-white rounded-[2rem] p-8 shadow-xl border border-slate-100">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold text-slate-900">Εγγραφή Ιατρείου</h2>
                        <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">Βήμα {step} από 3</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 h-2 rounded-full mb-10 overflow-hidden">
                        <div 
                            className="bg-indigo-600 h-full transition-all duration-500 ease-out"
                            style={{ width: `${(step / 3) * 100}%` }}
                        ></div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        
                        {/* Step 1: Account */}
                        {step === 1 && (
                            <div className="animate-fade-in space-y-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                                        <UserIcon className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800">Στοιχεία Λογαριασμού</h3>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Ονοματεπώνυμο Ιατρού *</label>
                                        <input 
                                            type="text" 
                                            name="name"
                                            required
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                            placeholder="Δρ. Όνομα Επίθετο"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Email *</label>
                                        <input 
                                            type="email" 
                                            name="email"
                                            required
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Τηλέφωνο Κινητό *</label>
                                        <div className="relative">
                                            <PhoneIcon className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                                            <input 
                                                type="tel" 
                                                name="phone"
                                                required
                                                value={formData.phone}
                                                onChange={handleChange}
                                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Κωδικός Πρόσβασης *</label>
                                        <div className="relative">
                                            <LockIcon className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                                            <input 
                                                type="password" 
                                                name="password"
                                                required
                                                value={formData.password}
                                                onChange={handleChange}
                                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Clinic */}
                        {step === 2 && (
                            <div className="animate-fade-in space-y-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="bg-teal-100 p-2 rounded-lg text-teal-600">
                                        <BuildingIcon className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800">Στοιχεία Ιατρείου</h3>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Όνομα Ιατρείου / Κλινικής *</label>
                                    <input 
                                        type="text" 
                                        name="clinicName"
                                        required
                                        value={formData.clinicName}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        placeholder="π.χ. Vet Care Center"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Διεύθυνση *</label>
                                    <div className="relative">
                                        <MapPinIcon className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                                        <input 
                                            type="text" 
                                            name="address"
                                            required
                                            value={formData.address}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                            placeholder="Οδός, Αριθμός"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Πόλη / Περιοχή *</label>
                                    <input 
                                        type="text" 
                                        name="city"
                                        required
                                        value={formData.city}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Step 3: Professional */}
                        {step === 3 && (
                            <div className="animate-fade-in space-y-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="bg-amber-100 p-2 rounded-lg text-amber-600">
                                        <IdentificationIcon className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800">Επαγγελματική Πιστοποίηση</h3>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Ειδικότητα</label>
                                    <select 
                                        name="specialty"
                                        value={formData.specialty}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="">Γενικός Κτηνίατρος</option>
                                        <option value="Χειρουργική">Χειρουργική</option>
                                        <option value="Ορθοπεδική">Ορθοπεδική</option>
                                        <option value="Οδοντιατρική">Οδοντιατρική</option>
                                        <option value="Δερματολογία">Δερματολογία</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Αριθμός Αδείας Ασκήσεως Επαγγέλματος *</label>
                                    <input 
                                        type="text" 
                                        name="licenseNumber"
                                        required
                                        value={formData.licenseNumber}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        placeholder="π.χ. 12345/2024"
                                    />
                                    <p className="text-xs text-slate-500 mt-2">
                                        * Ο αριθμός θα επαληθευτεί από την ομάδα μας εντός 24 ωρών.
                                    </p>
                                </div>
                                
                                <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100 text-sm text-amber-800">
                                    <input type="checkbox" required className="mt-1" />
                                    <span>
                                        Δηλώνω υπεύθυνα ότι τα στοιχεία είναι αληθή και αποδέχομαι τους όρους χρήσης της υπηρεσίας Vetly Pro.
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex items-center justify-between pt-8 border-t border-slate-100">
                            {step === 1 ? (
                                <button 
                                    type="button" 
                                    onClick={onCancel}
                                    className="text-slate-500 font-bold hover:text-indigo-600 transition-colors"
                                >
                                    Ακύρωση
                                </button>
                            ) : (
                                <button 
                                    type="button" 
                                    onClick={() => setStep((prev) => (prev - 1) as 1 | 2 | 3)}
                                    className="text-slate-500 font-bold hover:text-indigo-600 transition-colors"
                                >
                                    Πίσω
                                </button>
                            )}

                            <button 
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center gap-2 disabled:opacity-70"
                            >
                                {isSubmitting ? (
                                    <>
                                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                        Επεξεργασία...
                                    </>
                                ) : step === 3 ? (
                                    'Ολοκλήρωση Εγγραφής'
                                ) : (
                                    <>
                                        Επόμενο <ArrowRightIcon className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="text-center mt-8">
                        <p className="text-sm text-slate-500">
                            Έχετε ήδη λογαριασμό; 
                            <button onClick={onCancel} className="text-indigo-600 font-bold ml-1 hover:underline">Σύνδεση</button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VetRegistration;
