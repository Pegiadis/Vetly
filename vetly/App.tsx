
import React, { useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import FindVet from './components/FindVet';
import VetProfile from './components/VetProfile';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Footer from './components/Footer';
import AIChat from './components/AIChat';
import UserProfile from './components/UserProfile';
import AddPet from './components/AddPet';
import EditPet from './components/EditPet';
import ChangeAppointment from './components/ChangeAppointment';
import PetCalendar from './components/PetCalendar';
import VetDashboard from './components/VetDashboard';
import VetPatients from './components/VetPatients';
import VetAddPatient from './components/VetAddPatient';
import VetNewAppointment from './components/VetNewAppointment';
import VetSchedule from './components/VetSchedule';
import VetProfileSettings from './components/VetProfileSettings';
import VetAppointmentsToday from './components/VetAppointmentsToday';
import VetPendingRequests from './components/VetPendingRequests';
import VetReviews from './components/VetReviews';
import VetRegistration from './components/VetRegistration';
import VetAnalytics from './components/VetAnalytics';
import VetGuide from './components/VetGuide';
import LandingPage from './components/LandingPage';
import Blog from './components/Blog';
import BlogPostView from './components/BlogPostView';
import AboutSection from './components/AboutSection';
import AboutPage from './components/AboutPage';
import HowItWorks from './components/HowItWorks';
import { ViewState, Vet, User, Pet, Appointment, VetPatient, Notification, PetMedication, BlogPost } from './types';
import { MOCK_USER, MOCK_VETS, MOCK_VET_PATIENTS, MOCK_REVIEWS, MOCK_BLOG_POSTS } from './constants';
import { MapPinIcon, ArrowRightIcon, ActivityIcon, UserIcon, StarIcon, SearchIcon, CheckIcon, CalendarIcon, ShieldCheckIcon, UserGroupIcon, SmartphoneIcon, StethoscopeIcon, HeartIcon } from './components/Icons';

const App: React.FC = () => {
    const [viewState, setViewState] = useState<ViewState>('HOME');
    const [selectedVet, setSelectedVet] = useState<Vet | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [vetUser, setVetUser] = useState<Vet | null>(null); // New state for logged-in vet
    const [vetPatients, setVetPatients] = useState<VetPatient[]>(MOCK_VET_PATIENTS); // Manage vet patients list
    const [selectedPetForEdit, setSelectedPetForEdit] = useState<Pet | null>(null);
    const [selectedAppointmentForChange, setSelectedAppointmentForChange] = useState<Appointment | null>(null);
    const [preSelectedPatientId, setPreSelectedPatientId] = useState<string | undefined>(undefined);
    const [selectedBlogPost, setSelectedBlogPost] = useState<BlogPost | null>(null);
    const [initialLoginType, setInitialLoginType] = useState<'user' | 'vet'>('user');
    const [findVetInitialFilter, setFindVetInitialFilter] = useState<'all' | 'emergency'>('all');

    // Vet Notifications State (Global)
    const [vetNotifications, setVetNotifications] = useState<Notification[]>([
        { id: 'v1', type: 'Νέο Ραντεβού', text: 'Αίτημα από Μαρία Π.', time: '10:00' },
        { id: 'v2', type: 'Επείγον', text: 'Περιστατικό στην περιοχή σας', time: '11:30' }
    ]);

    // Initial Vet Appointments Mock
    const [vetAppointments, setVetAppointments] = useState<Appointment[]>([
        { id: 'a1', vetId: 'v1', petId: 'p1', ownerName: 'Ελένη Παππά', petName: 'Ρόκυ', type: 'Ετήσιος Εμβολιασμός', date: 'Σήμερα', time: '10:00', status: 'confirmed' },
        { id: 'a2', vetId: 'v1', petId: 'p2', ownerName: 'Κώστας Δημητρίου', petName: 'Λούνα', type: 'Εξέταση Αίματος', date: 'Σήμερα', time: '11:30', status: 'confirmed' },
        { id: 'a3', vetId: 'v1', petId: 'p3', ownerName: 'Άννα Βασιλείου', petName: 'Μάξ', type: 'Γενικός Έλεγχος', date: '2024-06-28', time: '17:00', status: 'pending' },
        { id: 'a4', vetId: 'v1', petId: 'p4', ownerName: 'Γιάννης Οικονόμου', petName: 'Μπέλλα', type: 'Καθαρισμός Δοντιών', date: '2024-06-29', time: '09:00', status: 'pending' },
    ]);

    const handleVetSelect = (vet: Vet) => {
        setSelectedVet(vet);
        setViewState('VET_PROFILE');
    };

    const handleLogin = (type: 'user' | 'vet') => {
        if (type === 'user') {
            setUser(MOCK_USER);
            setVetUser(null);
            setViewState('DASHBOARD');
        } else {
            // Log in as the first vet from mocks for demo purposes
            setVetUser(MOCK_VETS[0]);
            setUser(null);
            setViewState('VET_DASHBOARD');
        }
    };

    const handleUserRegistration = (userName: string) => {
        const newNotification: Notification = {
            id: Date.now().toString(),
            type: 'Info',
            text: `Νέος χρήστης εγγράφηκε: ${userName}`,
            time: new Date().toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' })
        };
        setVetNotifications(prev => [newNotification, ...prev]);
    };

    // New function to handle Vet Registration
    const handleVetRegistration = (newVet: Vet) => {
        setVetUser(newVet);
        setUser(null);
        setViewState('VET_DASHBOARD');
        // Also trigger a welcome notification
        const newNotification: Notification = {
            id: Date.now().toString(),
            type: 'Info',
            text: `Καλώς ήρθατε στο Vetly Pro! Ολοκληρώστε το προφίλ σας.`,
            time: new Date().toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' })
        };
        setVetNotifications([newNotification]);
    };

    const handleLogout = () => {
        setUser(null);
        setVetUser(null);
        setViewState('HOME');
    };

    const handleUpdateUser = (updatedUser: User) => {
        setUser(updatedUser);
    };

    const handleUpdateVet = (updatedVet: Vet) => {
        setVetUser(updatedVet);
    };

    const handleAddPet = (newPet: Pet) => {
        if (user) {
            const updatedUser = {
                ...user,
                pets: [...user.pets, newPet]
            };
            setUser(updatedUser);
            setViewState('DASHBOARD');
        }
    };

    const handleEditPetClick = (pet: Pet) => {
        setSelectedPetForEdit(pet);
        setViewState('EDIT_PET');
    };

    const handleUpdatePet = (updatedPet: Pet) => {
        if (user) {
            const updatedPets = user.pets.map(p => p.id === updatedPet.id ? updatedPet : p);
            setUser({ ...user, pets: updatedPets });
            setViewState('DASHBOARD');
        }
    };

    const handleDeletePet = (petId: string) => {
        if (user) {
            const updatedPets = user.pets.filter(p => p.id !== petId);
            setUser({ ...user, pets: updatedPets });
            setViewState('DASHBOARD');
        }
    };

    const handleChangeAppointmentClick = (appointment: Appointment) => {
        setSelectedAppointmentForChange(appointment);
        setViewState('CHANGE_APPOINTMENT');
    };

    const handleCancelAppointment = (appointmentId: string) => {
        if (user) {
            const updatedAppointments = user.appointments.map(a =>
                a.id === appointmentId ? { ...a, status: 'cancelled' as const } : a
            );
            setUser({ ...user, appointments: updatedAppointments });
            
            // Notify Vet
            const appointment = user.appointments.find(a => a.id === appointmentId);
            if (appointment) {
                 const newNotification: Notification = {
                    id: Date.now().toString(),
                    type: 'Ακύρωση',
                    text: `Ο/Η ${user.name} ακύρωσε το ραντεβού για ${appointment.petName}.`,
                    time: new Date().toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' })
                };
                setVetNotifications(prev => [newNotification, ...prev]);
            }
        }
    };

    const handleUpdateAppointment = (updatedAppointment: Appointment) => {
        if (user) {
            const updatedAppointments = user.appointments.map(a => 
                a.id === updatedAppointment.id ? updatedAppointment : a
            );
            setUser({ ...user, appointments: updatedAppointments });
            setViewState('DASHBOARD');

            // Notify Vet about the change
            const newNotification: Notification = {
                id: Date.now().toString(),
                type: 'Αλλαγή',
                text: `Ο/Η ${user.name} άλλαξε το ραντεβού για ${updatedAppointment.petName} στις ${updatedAppointment.date} ${updatedAppointment.time}.`,
                time: new Date().toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' })
            };
            setVetNotifications(prev => [newNotification, ...prev]);
        }
    };

    const handleAddVetPatient = (newPatient: VetPatient) => {
        setVetPatients([...vetPatients, newPatient]);
        setViewState('VET_PATIENTS');
    };

    // New function to sync Vet changes to Patient/User data
    const handleVetUpdatePatient = (updatedPatient: VetPatient) => {
        // 1. Update Vet's view of the patient list
        setVetPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));

        // 2. Sync with User's Pet data (Simulate Backend Update)
        // We find the corresponding pet in the MOCK_USER (since user might not be logged in context)
        // and update its history.
        
        // In a real app, this would be a DB call. Here we update the mock reference directly
        // so when the user logs in, they see the changes.
        const userPet = MOCK_USER.pets.find(p => p.id === updatedPatient.id);
        
        if (userPet && updatedPatient.history.length > 0) {
            // Get the latest added record (the one added by the vet)
            const latestRecord = updatedPatient.history[0];
            
            // Check if this specific record already exists to prevent duplicates (simple check)
            const exists = userPet.history.some(h => 
                h.date === latestRecord.date && h.title === latestRecord.title
            );

            if (!exists) {
                userPet.history.unshift({
                    date: latestRecord.date,
                    title: latestRecord.title,
                    notes: latestRecord.notes,
                    vetName: vetUser?.name || 'Κτηνίατρος'
                });
            }
        }
    };

    const handleVetUpdateAppointmentStatus = (id: string, newStatus: 'confirmed' | 'cancelled' | 'blocked' | 'completed') => {
        // 1. Update Vet's local state
        setVetAppointments(prev => prev.map(apt => apt.id === id ? { ...apt, status: newStatus } : apt));

        // 2. Sync with Pet Owner's Calendar (MOCK_USER and active user state)
        // Find if this appointment exists in the user's record (simulating backend sync)
        const mockUserApt = MOCK_USER.appointments.find(a => a.id === id);
        if (mockUserApt) {
            mockUserApt.status = newStatus as any;
        }

        // If the pet owner is currently logged in (stored in 'user' state), update that state too
        // so the UI reflects changes immediately if we were to switch users or if they are observing
        if (user) {
            const updatedUserAppointments = user.appointments.map(a => 
                a.id === id ? { ...a, status: newStatus as any } : a
            );
            setUser({ ...user, appointments: updatedUserAppointments });
        }
    };

    const handleVetCreateAppointment = (newAppointment: Appointment) => {
        // Update vet side
        setVetAppointments([...vetAppointments, newAppointment]);
        
        // Simulate User side update
        MOCK_USER.appointments.push(newAppointment);

        setViewState('VET_DASHBOARD');
    };

    const handleVetPatientNewAppointment = (patientId: string) => {
        setPreSelectedPatientId(patientId);
        setViewState('VET_NEW_APPOINTMENT');
    };

    const handleAddMedication = (medication: PetMedication) => {
        if (user) {
            const updatedUser = {
                ...user,
                medications: [...user.medications, medication]
            };
            setUser(updatedUser);
        }
    };

    const handleProtectedNavigation = (targetView: ViewState) => {
        if (!user && !vetUser) {
            setViewState('LOGIN');
        } else {
            setViewState(targetView);
        }
    };

    const handleReadBlogPost = (post: BlogPost) => {
        setSelectedBlogPost(post);
        setViewState('BLOG_POST');
    };

    const renderView = () => {
        switch (viewState) {
            case 'LOGIN':
                return (
                    <Login 
                        key={initialLoginType} // Force re-render when type changes
                        onLogin={handleLogin} 
                        onRegister={handleUserRegistration}
                        onGoToVetRegistration={() => setViewState('VET_REGISTRATION')}
                        initialUserType={initialLoginType}
                    />
                );
            case 'VET_REGISTRATION':
                return (
                    <VetRegistration 
                        onRegister={handleVetRegistration}
                        onCancel={() => setViewState('LOGIN')}
                    />
                );
            case 'HOME':
                 return (
                    <div className="animate-fade-in">
                        <Hero setViewState={setViewState} />
                        
                        {/* --- CLEAN & PROFESSIONAL LAYOUT --- */}
                        
                        {/* 1. Core Services (Overlapping Cards) */}
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
                                        onClick={() => {
                                            setFindVetInitialFilter('all');
                                            setViewState('FIND_VET');
                                        }}
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
                                        onClick={() => {
                                            setFindVetInitialFilter('emergency');
                                            setViewState('FIND_VET');
                                        }}
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
                                        onClick={() => handleProtectedNavigation('DASHBOARD')}
                                        className="flex items-center gap-2 text-indigo-600 font-bold hover:gap-3 transition-all group-hover:text-indigo-700"
                                    >
                                        Διαχείριση Προφίλ <ArrowRightIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 2. Feature Section (Split Layout) */}
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

                        {/* 3. Stats & Trust Strip (Clean) */}
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

                        {/* 4. Pro CTA Section */}
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
                                        onClick={() => {
                                            setInitialLoginType('vet');
                                            setViewState('LOGIN');
                                        }}
                                        className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-lg transition-all shadow-lg shadow-indigo-900/50"
                                    >
                                        Είσοδος / Εγγραφή Ιατρού
                                    </button>
                                    <button 
                                        onClick={() => {
                                            setInitialLoginType('vet');
                                            setViewState('VET_REGISTRATION');
                                        }}
                                        className="px-8 py-4 bg-transparent border border-slate-700 hover:bg-slate-800 text-white rounded-2xl font-bold text-lg transition-all"
                                    >
                                        Μάθετε Περισσότερα
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 5. Blog Teaser (Simple Grid) */}
                        <div className="py-24 bg-white">
                            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                                 <div className="flex justify-between items-end mb-12">
                                    <div>
                                        <h3 className="text-3xl font-bold text-slate-900 mb-2">Vetly Magazine</h3>
                                        <p className="text-slate-500">Συμβουλές και νέα από τους ειδικούς.</p>
                                    </div>
                                    <button onClick={() => setViewState('BLOG')} className="hidden md:flex items-center gap-2 text-teal-600 font-bold hover:gap-3 transition-all">
                                        Όλα τα άρθρα <ArrowRightIcon className="w-4 h-4" />
                                    </button>
                                 </div>
                                 
                                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                     {MOCK_BLOG_POSTS.slice(0, 3).map(post => (
                                         <div key={post.id} onClick={() => handleReadBlogPost(post)} className="cursor-pointer group">
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

                        {/* --- END NEW LAYOUT --- */}
                    </div>
                );
            case 'FIND_VET':
                return <FindVet onSelectVet={handleVetSelect} initialFilter={findVetInitialFilter} />;
            case 'VET_PROFILE':
                return selectedVet ? (
                    <VetProfile vet={selectedVet} onBack={() => setViewState('FIND_VET')} />
                ) : (
                    <FindVet onSelectVet={handleVetSelect} initialFilter={findVetInitialFilter} />
                );
            case 'DASHBOARD':
                return user ? (
                    <Dashboard 
                        user={user} 
                        onAddNewPet={() => setViewState('ADD_PET')} 
                        onEditPet={handleEditPetClick}
                        onChangeAppointment={handleChangeAppointmentClick}
                        onCancelAppointment={handleCancelAppointment}
                        onViewCalendar={() => setViewState('USER_CALENDAR')}
                        onViewGuide={() => setViewState('HOW_IT_WORKS')} // New Handler
                    />
                ) : <Login key={initialLoginType} onLogin={handleLogin} onRegister={handleUserRegistration} onGoToVetRegistration={() => setViewState('VET_REGISTRATION')} initialUserType={initialLoginType} />;
            case 'USER_CALENDAR':
                return user ? (
                    <PetCalendar 
                        user={user}
                        onBack={() => setViewState('DASHBOARD')}
                        onAddMedication={handleAddMedication}
                    />
                ) : <Login key={initialLoginType} onLogin={handleLogin} onRegister={handleUserRegistration} onGoToVetRegistration={() => setViewState('VET_REGISTRATION')} initialUserType={initialLoginType} />;
            case 'ADD_PET':
                return <AddPet onAdd={handleAddPet} onCancel={() => setViewState('DASHBOARD')} />;
            case 'EDIT_PET':
                return selectedPetForEdit ? (
                    <EditPet 
                        pet={selectedPetForEdit} 
                        onSave={handleUpdatePet} 
                        onDelete={handleDeletePet}
                        onCancel={() => setViewState('DASHBOARD')} 
                    />
                ) : <Dashboard user={user!} onAddNewPet={() => setViewState('ADD_PET')} onEditPet={handleEditPetClick} />;
            case 'USER_PROFILE':
                return user ? (
                    <UserProfile 
                        user={user} 
                        onUpdateUser={handleUpdateUser} 
                        onBack={() => setViewState('DASHBOARD')} 
                    />
                ) : <Login key={initialLoginType} onLogin={handleLogin} onRegister={handleUserRegistration} onGoToVetRegistration={() => setViewState('VET_REGISTRATION')} initialUserType={initialLoginType} />;
            case 'CHANGE_APPOINTMENT':
                return selectedAppointmentForChange ? (
                    <ChangeAppointment 
                        appointment={selectedAppointmentForChange}
                        onSave={handleUpdateAppointment}
                        onCancel={() => setViewState('DASHBOARD')}
                    />
                ) : <Dashboard user={user!} onAddNewPet={() => setViewState('ADD_PET')} onEditPet={handleEditPetClick} />;
            case 'VET_DASHBOARD':
                return vetUser ? (
                    <VetDashboard 
                        vet={vetUser} 
                        appointments={vetAppointments}
                        onUpdateStatus={handleVetUpdateAppointmentStatus}
                        onNavigateToPatients={() => setViewState('VET_PATIENTS')} 
                        onNewAppointmentClick={() => {
                            setPreSelectedPatientId(undefined);
                            setViewState('VET_NEW_APPOINTMENT');
                        }}
                        onNavigateToToday={() => setViewState('VET_APPOINTMENTS_TODAY')}
                        onNavigateToPending={() => setViewState('VET_PENDING')}
                        onNavigateToReviews={() => setViewState('VET_REVIEWS')}
                        onNavigateToAnalytics={() => setViewState('VET_ANALYTICS')}
                        onNavigateToProfileSettings={() => setViewState('VET_PROFILE_SETTINGS')}
                    />
                ) : <Login key={initialLoginType} onLogin={handleLogin} onRegister={handleUserRegistration} onGoToVetRegistration={() => setViewState('VET_REGISTRATION')} initialUserType={initialLoginType} />;
            case 'VET_PATIENTS':
                return vetUser ? (
                    <VetPatients 
                        vet={vetUser} 
                        patients={vetPatients}
                        onBack={() => setViewState('VET_DASHBOARD')} 
                        onAddPatientClick={() => setViewState('VET_ADD_PATIENT')}
                        onNewAppointment={handleVetPatientNewAppointment}
                        onUpdatePatient={handleVetUpdatePatient}
                    />
                ) : <Login key={initialLoginType} onLogin={handleLogin} onRegister={handleUserRegistration} onGoToVetRegistration={() => setViewState('VET_REGISTRATION')} initialUserType={initialLoginType} />;
            case 'VET_ADD_PATIENT':
                return vetUser ? (
                    <VetAddPatient 
                        onSave={handleAddVetPatient} 
                        onCancel={() => setViewState('VET_PATIENTS')} 
                    />
                ) : <Login key={initialLoginType} onLogin={handleLogin} onRegister={handleUserRegistration} onGoToVetRegistration={() => setViewState('VET_REGISTRATION')} initialUserType={initialLoginType} />;
            case 'VET_NEW_APPOINTMENT':
                return vetUser ? (
                    <VetNewAppointment 
                        patients={vetPatients}
                        vetId={vetUser.id}
                        onSave={handleVetCreateAppointment}
                        onCancel={() => setViewState('VET_DASHBOARD')}
                        initialPatientId={preSelectedPatientId}
                    />
                ) : <Login key={initialLoginType} onLogin={handleLogin} onRegister={handleUserRegistration} onGoToVetRegistration={() => setViewState('VET_REGISTRATION')} initialUserType={initialLoginType} />;
            case 'VET_SCHEDULE':
                return vetUser ? (
                    <VetSchedule 
                        vet={vetUser}
                        appointments={vetAppointments}
                        onUpdateStatus={handleVetUpdateAppointmentStatus}
                        onBack={() => setViewState('VET_DASHBOARD')}
                        onNewAppointment={() => {
                            setPreSelectedPatientId(undefined);
                            setViewState('VET_NEW_APPOINTMENT');
                        }}
                    />
                ) : <Login key={initialLoginType} onLogin={handleLogin} onRegister={handleUserRegistration} onGoToVetRegistration={() => setViewState('VET_REGISTRATION')} initialUserType={initialLoginType} />;
            case 'VET_PROFILE_SETTINGS':
                return vetUser ? (
                    <VetProfileSettings 
                        vet={vetUser}
                        onUpdateVet={handleUpdateVet}
                        onBack={() => setViewState('VET_DASHBOARD')}
                    />
                ) : <Login key={initialLoginType} onLogin={handleLogin} onRegister={handleUserRegistration} onGoToVetRegistration={() => setViewState('VET_REGISTRATION')} initialUserType={initialLoginType} />;
            case 'VET_APPOINTMENTS_TODAY':
                return vetUser ? (
                    <VetAppointmentsToday 
                        appointments={vetAppointments}
                        onBack={() => setViewState('VET_DASHBOARD')}
                        onUpdateStatus={handleVetUpdateAppointmentStatus}
                    />
                ) : <Login key={initialLoginType} onLogin={handleLogin} onRegister={handleUserRegistration} onGoToVetRegistration={() => setViewState('VET_REGISTRATION')} initialUserType={initialLoginType} />;
            case 'VET_PENDING':
                return vetUser ? (
                    <VetPendingRequests 
                        appointments={vetAppointments}
                        onBack={() => setViewState('VET_DASHBOARD')}
                        onUpdateStatus={handleVetUpdateAppointmentStatus}
                    />
                ) : <Login key={initialLoginType} onLogin={handleLogin} onRegister={handleUserRegistration} onGoToVetRegistration={() => setViewState('VET_REGISTRATION')} initialUserType={initialLoginType} />;
            case 'VET_REVIEWS':
                return vetUser ? (
                    <VetReviews 
                        reviews={MOCK_REVIEWS}
                        overallRating={vetUser.rating}
                        reviewsCount={vetUser.reviewsCount}
                        onBack={() => setViewState('VET_DASHBOARD')}
                    />
                ) : <Login key={initialLoginType} onLogin={handleLogin} onRegister={handleUserRegistration} onGoToVetRegistration={() => setViewState('VET_REGISTRATION')} initialUserType={initialLoginType} />;
            case 'VET_ANALYTICS':
                return vetUser ? (
                    <VetAnalytics 
                        onBack={() => setViewState('VET_DASHBOARD')}
                    />
                ) : <Login key={initialLoginType} onLogin={handleLogin} onRegister={handleUserRegistration} onGoToVetRegistration={() => setViewState('VET_REGISTRATION')} initialUserType={initialLoginType} />;
            case 'VET_GUIDE':
                return vetUser ? (
                    <VetGuide />
                ) : <Login key={initialLoginType} onLogin={handleLogin} onRegister={handleUserRegistration} onGoToVetRegistration={() => setViewState('VET_REGISTRATION')} initialUserType={initialLoginType} />;
            case 'BLOG':
                return (
                    <Blog 
                        posts={MOCK_BLOG_POSTS}
                        onReadPost={handleReadBlogPost}
                    />
                );
            case 'BLOG_POST':
                return selectedBlogPost ? (
                    <BlogPostView 
                        post={selectedBlogPost}
                        onBack={() => setViewState('BLOG')}
                    />
                ) : <Blog posts={MOCK_BLOG_POSTS} onReadPost={handleReadBlogPost} />;
            case 'ABOUT':
                return <AboutPage />;
            case 'HOW_IT_WORKS':
                return user ? (
                    <HowItWorks 
                        onBack={() => setViewState('DASHBOARD')} 
                        onGoToCalendar={() => setViewState('USER_CALENDAR')} 
                    />
                ) : <Login key={initialLoginType} onLogin={handleLogin} onRegister={handleUserRegistration} onGoToVetRegistration={() => setViewState('VET_REGISTRATION')} initialUserType={initialLoginType} />;
            default:
                return (
                    <div className="animate-fade-in">
                        <Hero setViewState={setViewState} />
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20 mb-24">
                            {/* ... existing home page content ... */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="bg-white p-8 rounded-[2rem] shadow-xl hover:-translate-y-2 transition-all duration-300 border border-slate-100 flex flex-col items-start group">
                                    <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600 mb-6 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                                        <SearchIcon className="w-7 h-7" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-3">Βρείτε Κτηνίατρο</h3>
                                    <p className="text-slate-500 mb-8 flex-grow leading-relaxed">
                                        Αναζητήστε πιστοποιημένους κτηνιάτρους στην περιοχή σας, διαβάστε κριτικές και κλείστε ραντεβού άμεσα.
                                    </p>
                                    <button onClick={() => { setFindVetInitialFilter('all'); setViewState('FIND_VET'); }} className="flex items-center gap-2 text-teal-600 font-bold hover:gap-3 transition-all group-hover:text-teal-700">
                                        Αναζήτηση <ArrowRightIcon className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="bg-white p-8 rounded-[2rem] shadow-xl hover:-translate-y-2 transition-all duration-300 border border-slate-100 flex flex-col items-start group relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-20 h-20 bg-red-50 rounded-bl-[2rem] -mr-4 -mt-4 z-0"></div>
                                    <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 mb-6 relative z-10 group-hover:bg-red-600 group-hover:text-white transition-colors">
                                        <ActivityIcon className="w-7 h-7" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-3 relative z-10">Έκτακτη Ανάγκη</h3>
                                    <p className="text-slate-500 mb-8 flex-grow leading-relaxed relative z-10">
                                        Δείτε ποια ιατρεία και κλινικές εφημερεύουν τώρα κοντά σας για άμεση εξυπηρέτηση.
                                    </p>
                                    <button onClick={() => { setFindVetInitialFilter('emergency'); setViewState('FIND_VET'); }} className="flex items-center gap-2 text-red-600 font-bold hover:gap-3 transition-all relative z-10">
                                        Εύρεση Βοήθειας SOS <ArrowRightIcon className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="bg-white p-8 rounded-[2rem] shadow-xl hover:-translate-y-2 transition-all duration-300 border border-slate-100 flex flex-col items-start group">
                                    <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                        <UserIcon className="w-7 h-7" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-3">Το Κατοικίδιό μου</h3>
                                    <p className="text-slate-500 mb-8 flex-grow leading-relaxed">
                                        Διαχειριστείτε το ιατρικό ιστορικό, τα ραντεβού και τις υπενθυμίσεις εμβολιασμών σε ένα μέρος.
                                    </p>
                                    <button onClick={() => handleProtectedNavigation('DASHBOARD')} className="flex items-center gap-2 text-indigo-600 font-bold hover:gap-3 transition-all group-hover:text-indigo-700">
                                        Διαχείριση Προφίλ <ArrowRightIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="py-24 bg-slate-50 border-t border-slate-200">
                            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                                    <div className="order-2 lg:order-1">
                                        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-6 leading-tight">Φροντίδα υψηλών προδιαγραφών,<br/><span className="text-teal-600">απλά και ψηφιακά.</span></h2>
                                        <p className="text-lg text-slate-600 mb-8 leading-relaxed">Το Vetly δεν είναι απλά ένας κατάλογος. Είναι το εργαλείο που συνδέει υπεύθυνους ιδιοκτήτες με κορυφαίους επαγγελματίες, εξασφαλίζοντας την καλύτερη δυνατή υγεία για τους τετράποδους φίλους μας.</p>
                                        <div className="space-y-6">
                                            <div className="flex items-start gap-4">
                                                <div className="bg-white p-2 rounded-full text-teal-600 shadow-sm border border-slate-100 mt-1"><ShieldCheckIcon className="w-5 h-5" /></div>
                                                <div><h4 className="text-xl font-bold text-slate-900">Πιστοποιημένοι Επαγγελματίες</h4><p className="text-slate-500 mt-1">Όλοι οι κτηνίατροι ελέγχονται για την άδεια ασκήσεως επαγγέλματος.</p></div>
                                            </div>
                                            <div className="flex items-start gap-4">
                                                <div className="bg-white p-2 rounded-full text-teal-600 shadow-sm border border-slate-100 mt-1"><CalendarIcon className="w-5 h-5" /></div>
                                                <div><h4 className="text-xl font-bold text-slate-900">Online Ραντεβού 24/7</h4><p className="text-slate-500 mt-1">Κλείστε ραντεβού οποιαδήποτε στιγμή, χωρίς τηλεφωνικές αναμονές.</p></div>
                                            </div>
                                            <div className="flex items-start gap-4">
                                                <div className="bg-white p-2 rounded-full text-teal-600 shadow-sm border border-slate-100 mt-1"><HeartIcon className="w-5 h-5" /></div>
                                                <div><h4 className="text-xl font-bold text-slate-900">Ιστορικό Υγείας</h4><p className="text-slate-500 mt-1">Κρατήστε αρχείο εμβολίων και εξετάσεων, προσβάσιμο πάντα από το κινητό σας.</p></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="order-1 lg:order-2 relative">
                                        <div className="absolute top-0 right-0 w-full h-full bg-teal-100 rounded-[3rem] rotate-3 scale-95 -z-10"></div>
                                        <img src="https://images.unsplash.com/photo-1623366302587-b38b1ddaefd9?auto=format&fit=crop&w=800&q=80" alt="Veterinarian with dog" className="rounded-[3rem] shadow-2xl border-4 border-white w-full object-cover h-[600px]" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white py-16 border-y border-slate-100">
                            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                                    <div><div className="text-4xl font-extrabold text-slate-900 mb-2">15k+</div><div className="text-sm font-bold text-slate-500 uppercase tracking-widest">Ιδιοκτητες</div></div>
                                    <div><div className="text-4xl font-extrabold text-slate-900 mb-2">850+</div><div className="text-sm font-bold text-slate-500 uppercase tracking-widest">Κτηνιατροι</div></div>
                                    <div><div className="text-4xl font-extrabold text-slate-900 mb-2">12</div><div className="text-sm font-bold text-slate-500 uppercase tracking-widest">Πολεις</div></div>
                                    <div><div className="text-4xl font-extrabold text-slate-900 mb-2">4.9</div><div className="text-sm font-bold text-slate-500 uppercase tracking-widest">Μ.Ο. Αξιολογησης</div></div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-slate-900 py-24 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
                            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-600/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4"></div>
                            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                                <div className="inline-flex items-center gap-2 bg-indigo-900/50 border border-indigo-500/30 rounded-full px-4 py-1 text-indigo-300 text-xs font-bold uppercase mb-6"><StethoscopeIcon className="w-4 h-4" />Για Επαγγελματιες</div>
                                <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6">Είστε Κτηνίατρος;</h2>
                                <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">Αναβαθμίστε το ιατρείο σας με το Vetly Pro. Διαχειριστείτε ραντεβού, ασθενείς και προωθήστε τις υπηρεσίες σας σε χιλιάδες ιδιοκτήτες.</p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <button onClick={() => { setInitialLoginType('vet'); setViewState('LOGIN'); }} className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-lg transition-all shadow-lg shadow-indigo-900/50">Είσοδος / Εγγραφή Ιατρού</button>
                                    <button onClick={() => { setInitialLoginType('vet'); setViewState('VET_REGISTRATION'); }} className="px-8 py-4 bg-transparent border border-slate-700 hover:bg-slate-800 text-white rounded-2xl font-bold text-lg transition-all">Μάθετε Περισσότερα</button>
                                </div>
                            </div>
                        </div>
                        <div className="py-24 bg-white">
                            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                                 <div className="flex justify-between items-end mb-12">
                                    <div><h3 className="text-3xl font-bold text-slate-900 mb-2">Vetly Magazine</h3><p className="text-slate-500">Συμβουλές και νέα από τους ειδικούς.</p></div>
                                    <button onClick={() => setViewState('BLOG')} className="hidden md:flex items-center gap-2 text-teal-600 font-bold hover:gap-3 transition-all">Όλα τα άρθρα <ArrowRightIcon className="w-4 h-4" /></button>
                                 </div>
                                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                     {MOCK_BLOG_POSTS.slice(0, 3).map(post => (
                                         <div key={post.id} onClick={() => handleReadBlogPost(post)} className="cursor-pointer group">
                                             <div className="rounded-2xl overflow-hidden mb-4 h-56 relative">
                                                 <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                                 <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg text-xs font-bold text-slate-800 shadow-sm">{post.category}</div>
                                             </div>
                                             <h4 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-teal-600 transition-colors line-clamp-2">{post.title}</h4>
                                             <div className="flex items-center gap-2 text-xs font-bold text-slate-400"><span>{post.date}</span><span>•</span><span>{post.readTime} διάβασμα</span></div>
                                         </div>
                                     ))}
                                 </div>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
            {viewState !== 'LOGIN' && viewState !== 'VET_REGISTRATION' && (
                <Header 
                    setViewState={setViewState} 
                    currentView={viewState} 
                    user={user} 
                    vetUser={vetUser}
                    onLogout={handleLogout}
                    onLoginClick={(type) => {
                        setInitialLoginType(type);
                        setViewState('LOGIN');
                    }}
                    notifications={vetNotifications}
                />
            )}
            <main className="flex-grow w-full">
                {renderView()}
            </main>
            {viewState !== 'LOGIN' && viewState !== 'VET_REGISTRATION' && <Footer />}
            <AIChat />
        </div>
    );
};

export default App;
