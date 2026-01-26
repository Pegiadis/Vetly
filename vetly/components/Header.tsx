import React, { useState, useEffect, useRef } from 'react';
import { LogoIcon, UserIcon, SearchIcon, BellIcon, CalendarIcon, LogoutIcon, SettingsIcon, ClipboardIcon, BookOpenIcon, StethoscopeIcon, HeartIcon, HelpCircleIcon } from './Icons';
import { ViewState, User, Vet, Notification } from '../types';

interface HeaderProps {
    setViewState: (view: ViewState) => void;
    currentView: ViewState;
    user: User | null;
    vetUser: Vet | null;
    onLogout: () => void;
    onLoginClick: (type: 'user' | 'vet') => void;
    notifications?: Notification[];
}

const Header: React.FC<HeaderProps> = ({ setViewState, currentView, user, vetUser, onLogout, onLoginClick, notifications = [] }) => {
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const notificationRef = useRef<HTMLDivElement>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);

    // Active appointments for user
    const upcomingAppointments = user ? user.appointments.filter(a => 
        a.status === 'confirmed' || a.status === 'pending'
    ) : [];

    useEffect(() => {
        const controlNavbar = () => {
            if (typeof window !== 'undefined') {
                if (window.scrollY > lastScrollY && window.scrollY > 100) {
                    setIsVisible(false);
                } else {
                    setIsVisible(true);
                }
                setLastScrollY(window.scrollY);
            }
        };

        const handleClickOutside = (event: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setShowUserMenu(false);
            }
        };

        window.addEventListener('scroll', controlNavbar);
        document.addEventListener('mousedown', handleClickOutside);
        
        return () => {
            window.removeEventListener('scroll', controlNavbar);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [lastScrollY]);

    const handleVetNotificationClick = (type: string) => {
        setShowNotifications(false);
        // Route based on notification type
        switch (type) {
            case 'Νέο Ραντεβού':
            case 'Αλλαγή':
                setViewState('VET_PENDING');
                break;
            case 'Ακύρωση':
            case 'Info':
            case 'Επείγον':
            default:
                setViewState('VET_DASHBOARD');
                break;
        }
    };

    const navClasses = `fixed top-0 w-full z-50 transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'
        } bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm`;

    // Navigation links based on user type
    const renderNavLinks = () => {
        // VETERINARIAN VIEW
        if (vetUser) {
            return (
                <div className="hidden md:flex items-center space-x-8">
                    <button 
                        onClick={() => setViewState('VET_DASHBOARD')} 
                        className={`text-sm font-medium hover:text-teal-600 transition-colors ${currentView === 'VET_DASHBOARD' ? 'text-teal-600 font-bold' : 'text-slate-600'}`}
                    >
                        Dashboard
                    </button>
                    <button 
                        onClick={() => setViewState('VET_PATIENTS')} 
                        className={`text-sm font-medium hover:text-teal-600 transition-colors ${currentView === 'VET_PATIENTS' ? 'text-teal-600 font-bold' : 'text-slate-600'}`}
                    >
                        Ασθενείς
                    </button>
                    <button 
                        onClick={() => setViewState('VET_SCHEDULE')} 
                        className={`text-sm font-medium hover:text-teal-600 transition-colors ${currentView === 'VET_SCHEDULE' ? 'text-teal-600 font-bold' : 'text-slate-600'}`}
                    >
                        Πρόγραμμα
                    </button>
                     <button 
                        onClick={() => setViewState('VET_GUIDE')} 
                        className={`text-sm font-medium hover:text-teal-600 transition-colors flex items-center gap-1 ${currentView === 'VET_GUIDE' ? 'text-teal-600 font-bold' : 'text-slate-600'}`}
                    >
                        <HelpCircleIcon className="w-4 h-4" />
                        Οδηγός
                    </button>
                </div>
            );
        }

        // PET OWNER VIEW (Logged In)
        if (user) {
            return (
                <div className="hidden md:flex items-center space-x-8">
                    <button 
                        onClick={() => setViewState('HOME')} 
                        className={`text-sm font-medium hover:text-primary transition-colors ${currentView === 'HOME' ? 'text-primary' : 'text-slate-600'}`}
                    >
                        Αρχική
                    </button>
                    <button 
                        onClick={() => setViewState('FIND_VET')} 
                        className={`text-sm font-medium hover:text-primary transition-colors ${currentView === 'FIND_VET' ? 'text-primary' : 'text-slate-600'}`}
                    >
                        Εύρεση Ιατρού
                    </button>
                    <button 
                        onClick={() => setViewState('DASHBOARD')} 
                        className={`text-sm font-medium hover:text-primary transition-colors flex items-center gap-1 ${currentView === 'DASHBOARD' ? 'text-primary' : 'text-slate-600'}`}
                    >
                        <UserIcon className="w-4 h-4" />
                        Τα Κατοικίδια μου
                    </button>
                    <button 
                        onClick={() => setViewState('BLOG')} 
                        className={`text-sm font-medium hover:text-primary transition-colors flex items-center gap-1 ${currentView === 'BLOG' ? 'text-primary' : 'text-slate-600'}`}
                    >
                        <BookOpenIcon className="w-4 h-4" />
                        Blog
                    </button>
                </div>
            );
        }

        // GUEST VIEW (Not Logged In)
        return (
            <div className="hidden md:flex items-center space-x-8">
                <button 
                    onClick={() => setViewState('HOME')} 
                    className={`text-sm font-medium hover:text-primary transition-colors ${currentView === 'HOME' ? 'text-primary' : 'text-slate-600'}`}
                >
                    Αρχική
                </button>
                <button 
                    onClick={() => setViewState('ABOUT')} 
                    className={`text-sm font-medium hover:text-primary transition-colors ${currentView === 'ABOUT' ? 'text-primary' : 'text-slate-600'}`}
                >
                    Σχετικά με εμάς
                </button>
                <button 
                    onClick={() => setViewState('BLOG')} 
                    className={`text-sm font-medium hover:text-primary transition-colors flex items-center gap-1 ${currentView === 'BLOG' ? 'text-primary' : 'text-slate-600'}`}
                >
                    <BookOpenIcon className="w-4 h-4" />
                    Blog
                </button>
            </div>
        );
    };

    return (
        <nav className={navClasses}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div 
                        className="flex items-center cursor-pointer group"
                        onClick={() => setViewState(vetUser ? 'VET_DASHBOARD' : 'HOME')}
                    >
                        <LogoIcon className={`h-8 w-8 ${vetUser ? 'text-indigo-600' : 'text-primary'} group-hover:scale-110 transition-transform`} />
                        <span className="ml-2 text-xl font-bold text-slate-800 tracking-tight">
                            Vetly {vetUser && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full ml-1 align-middle">PRO</span>}
                        </span>
                    </div>

                    {renderNavLinks()}

                    <div className="flex items-center space-x-4">
                        {!vetUser && (
                            <button 
                                className="p-2 text-slate-500 hover:text-primary transition-colors md:hidden"
                                onClick={() => setViewState('FIND_VET')}
                            >
                                <SearchIcon className="h-6 w-6" />
                            </button>
                        )}
                        
                        {/* Notification Bell - Only if logged in */}
                        {(user || vetUser) && (
                            <div className="relative" ref={notificationRef}>
                                <button 
                                    onClick={() => setShowNotifications(!showNotifications)}
                                    className="p-2 text-slate-600 hover:text-teal-600 transition-colors relative"
                                >
                                    <BellIcon className="h-6 w-6" />
                                    {(upcomingAppointments.length > 0 || notifications.length > 0) && (
                                        <span className="absolute top-1 right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-white"></span>
                                    )}
                                </button>

                                {showNotifications && (
                                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-scale-in">
                                        <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                                            <span className="font-bold text-sm text-slate-800">Ειδοποιήσεις</span>
                                            <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-bold">
                                                {vetUser ? notifications.length : upcomingAppointments.length} Νέες
                                            </span>
                                        </div>
                                        <div className="max-h-64 overflow-y-auto">
                                            {vetUser ? (
                                                notifications.length > 0 ? (
                                                    notifications.map(notif => (
                                                        <div 
                                                            key={notif.id} 
                                                            className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer"
                                                            onClick={() => handleVetNotificationClick(notif.type)}
                                                        >
                                                             <div className="flex gap-3">
                                                                <div className={`mt-1 p-2 rounded-lg h-fit ${notif.type === 'Ακύρωση' ? 'bg-red-50 text-red-600' : notif.type === 'Αλλαγή' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                                                    <BellIcon className="w-4 h-4" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-bold text-slate-800">{notif.type}</p>
                                                                    <p className="text-xs text-slate-500 mt-0.5">{notif.text}</p>
                                                                    <p className="text-xs font-medium text-indigo-600 mt-1">{notif.time}</p>
                                                                </div>
                                                             </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="p-4 text-center text-slate-400 text-sm">Καμία ειδοποίηση</div>
                                                )
                                            ) : (
                                                upcomingAppointments.length > 0 ? (
                                                    upcomingAppointments.map((apt) => (
                                                        <div key={apt.id} className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => {
                                                            setViewState('DASHBOARD');
                                                            setShowNotifications(false);
                                                        }}>
                                                            <div className="flex gap-3">
                                                                <div className="mt-1 bg-teal-50 p-2 rounded-lg h-fit text-teal-600">
                                                                    <CalendarIcon className="w-4 h-4" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-bold text-slate-800">Υπενθύμιση Ραντεβού</p>
                                                                    <p className="text-xs text-slate-500 mt-0.5">
                                                                        {apt.type} με {apt.vetName}
                                                                    </p>
                                                                    <p className="text-xs font-medium text-teal-600 mt-1">
                                                                        {apt.date} στις {apt.time}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="p-4 text-center text-slate-400 text-sm">Κανένα προσεχές ραντεβού</div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* User/Vet Menu */}
                        {(user || vetUser) ? (
                            <div className="relative" ref={userMenuRef}>
                                <button 
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    className={`flex items-center justify-center h-10 w-10 rounded-full overflow-hidden transition-all font-bold shadow-inner border ${vetUser ? 'bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-200' : 'bg-teal-100 text-teal-700 border-teal-200 hover:bg-teal-200'}`}
                                >
                                    {(user?.image || vetUser?.image) ? (
                                        <img src={user?.image || vetUser?.image} alt={user?.name || vetUser?.name} className="w-full h-full object-cover" />
                                    ) : (
                                        (user?.name || vetUser?.name || 'U').charAt(0)
                                    )}
                                </button>
                                
                                {showUserMenu && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-scale-in">
                                        <div className="px-4 py-3 border-b border-slate-50">
                                            <p className="text-sm font-bold text-slate-800 truncate">{user?.name || vetUser?.name}</p>
                                            <p className="text-xs text-slate-500 truncate">{user ? user.email : 'Κτηνίατρος'}</p>
                                        </div>
                                        {user && (
                                            <>
                                                <button 
                                                    onClick={() => {
                                                        setViewState('USER_PROFILE');
                                                        setShowUserMenu(false);
                                                    }}
                                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
                                                >
                                                    <SettingsIcon className="w-4 h-4" />
                                                    Ρυθμίσεις
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        setViewState('DASHBOARD');
                                                        setShowUserMenu(false);
                                                    }}
                                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
                                                >
                                                    <UserIcon className="w-4 h-4" />
                                                    Τα Κατοικίδια
                                                </button>
                                            </>
                                        )}
                                        {vetUser && (
                                            <>
                                                <button 
                                                    onClick={() => {
                                                        setViewState('VET_DASHBOARD');
                                                        setShowUserMenu(false);
                                                    }}
                                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
                                                >
                                                    <ClipboardIcon className="w-4 h-4" />
                                                    Διαχείριση
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        setViewState('VET_PROFILE_SETTINGS');
                                                        setShowUserMenu(false);
                                                    }}
                                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
                                                >
                                                    <SettingsIcon className="w-4 h-4" />
                                                    Ρυθμίσεις
                                                </button>
                                            </>
                                        )}
                                        <button 
                                            onClick={() => {
                                                onLogout();
                                                setShowUserMenu(false);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                                        >
                                            <LogoutIcon className="w-4 h-4" />
                                            Αποσύνδεση
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => onLoginClick('user')}
                                    className="text-slate-600 hover:text-teal-600 text-sm font-bold px-4 py-2 transition-colors rounded-lg hover:bg-slate-50"
                                >
                                    Σύνδεση
                                </button>
                                <button 
                                    onClick={() => onLoginClick('vet')}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-5 py-2.5 rounded-full transition-all shadow-md flex items-center gap-2"
                                >
                                    <StethoscopeIcon className="w-4 h-4" />
                                    Είσοδος Ιατρού
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Header;