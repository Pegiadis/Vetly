
import React, { useState, useEffect } from 'react';
import { GoogleIcon, LogoIcon, ArrowRightIcon, StethoscopeIcon, UserIcon } from './Icons';

interface LoginProps {
    onLogin: (type: 'user' | 'vet') => void;
    onRegister?: (name: string) => void;
    onGoToVetRegistration?: () => void;
    initialUserType?: 'user' | 'vet';
}

const Login: React.FC<LoginProps> = ({ onLogin, onRegister, onGoToVetRegistration, initialUserType = 'user' }) => {
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [userType, setUserType] = useState<'user' | 'vet'>(initialUserType);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // Reset state when initialUserType changes (handled via key in App.tsx, but good practice)
    useEffect(() => {
        setUserType(initialUserType);
    }, [initialUserType]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Simulate API call
        setTimeout(() => {
            setLoading(false);
            if (!isLoginMode && userType === 'user' && onRegister) {
                onRegister(name || 'Νέος Χρήστης');
            }
            onLogin(userType);
        }, 1000);
    };

    const handleGoogleLogin = () => {
        setLoading(true);
        // Simulate Google Auth
        setTimeout(() => {
            setLoading(false);
            if (!isLoginMode && userType === 'user' && onRegister) {
                onRegister('Google User');
            }
            onLogin(userType);
        }, 1000);
    };

    const themeColor = userType === 'vet' ? 'indigo' : 'teal';
    const bgColor = userType === 'vet' ? 'bg-indigo-50' : 'bg-slate-50';
    const buttonColor = userType === 'vet' ? 'bg-indigo-900 hover:bg-indigo-800' : 'bg-slate-900 hover:bg-slate-800';
    const linkColor = userType === 'vet' ? 'text-indigo-600 hover:text-indigo-500' : 'text-teal-600 hover:text-teal-500';

    return (
        <div className={`min-h-screen flex items-center justify-center ${bgColor} py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden`}>
             {/* Background decorations */}
             {userType === 'user' ? (
                 <>
                    <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-teal-600/10 rounded-full filter blur-[80px]"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-amber-500/10 rounded-full filter blur-[80px]"></div>
                 </>
             ) : (
                 <>
                    <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full filter blur-[80px]"></div>
                    <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-teal-600/5 rounded-full filter blur-[80px]"></div>
                 </>
             )}

            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-3xl shadow-xl relative z-10 border border-slate-100 animate-scale-in">
                
                {/* Header */}
                <div className="text-center">
                    <div className={`mx-auto h-16 w-16 rounded-full flex items-center justify-center mb-4 ${userType === 'vet' ? 'bg-indigo-100 text-indigo-600' : 'bg-teal-100 text-teal-600'}`}>
                        {userType === 'vet' ? <StethoscopeIcon className="h-8 w-8" /> : <LogoIcon className="h-8 w-8" />}
                    </div>
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        {userType === 'vet' ? 'Vetly Pro' : 'Καλώς ήρθατε'}
                    </h2>
                    <p className="mt-2 text-sm text-slate-600">
                        {userType === 'user' 
                            ? (isLoginMode ? 'Συνδεθείτε για να διαχειριστείτε τα κατοικίδιά σας.' : 'Δημιουργήστε λογαριασμό δωρεάν.')
                            : 'Πύλη εισόδου για επαγγελματίες κτηνιάτρους.'
                        }
                    </p>
                </div>

                {/* Vet Registration Banner (Only in Vet Mode Login) */}
                {userType === 'vet' && !isLoginMode ? (
                    <div className="mt-6 text-center animate-fade-in">
                         <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 mb-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-2">Εγγραφή Ιατρείου</h3>
                            <p className="text-sm text-slate-600 mb-6">
                                Δημιουργήστε επαγγελματικό λογαριασμό, καταχωρήστε το ιατρείο σας και αποκτήστε πρόσβαση στο δίκτυο του Vetly.
                            </p>
                            <button 
                                onClick={onGoToVetRegistration}
                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                            >
                                Ξεκινήστε Εδώ <ArrowRightIcon className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="text-sm text-slate-500">
                            Έχετε ήδη λογαριασμό; 
                            <button onClick={() => setIsLoginMode(true)} className="text-indigo-600 font-bold ml-1 hover:underline">Σύνδεση</button>
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Social Login (User Only) */}
                        {userType === 'user' && (
                            <div className="mt-4 space-y-4">
                                <button 
                                    onClick={handleGoogleLogin}
                                    disabled={loading}
                                    className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-slate-200 rounded-xl shadow-sm bg-white text-slate-700 hover:bg-slate-50 font-medium transition-all"
                                >
                                    <GoogleIcon className="w-5 h-5" />
                                    {loading ? 'Σύνδεση...' : 'Συνέχεια με Google'}
                                </button>
                            </div>
                        )}

                        {userType === 'user' && (
                            <div className="relative mt-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-200"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white text-slate-500">ή με email</span>
                                </div>
                            </div>
                        )}

                        {/* Login/Register Form */}
                        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                {!isLoginMode && userType === 'user' && (
                                    <div>
                                        <label htmlFor="name" className="sr-only">Ονοματεπώνυμο</label>
                                        <input
                                            id="name"
                                            name="name"
                                            type="text"
                                            required
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-slate-300 placeholder-slate-500 text-slate-900 focus:outline-none focus:ring-2 focus:z-10 sm:text-sm transition-colors focus:ring-teal-500 focus:border-teal-500"
                                            placeholder="Ονοματεπώνυμο"
                                        />
                                    </div>
                                )}
                                <div>
                                    <label htmlFor="email-address" className="sr-only">Email</label>
                                    <input
                                        id="email-address"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className={`appearance-none rounded-xl relative block w-full px-4 py-3 border border-slate-300 placeholder-slate-500 text-slate-900 focus:outline-none focus:ring-2 focus:z-10 sm:text-sm transition-colors ${userType === 'vet' ? 'focus:ring-indigo-500 focus:border-indigo-500' : 'focus:ring-teal-500 focus:border-teal-500'}`}
                                        placeholder={userType === 'vet' ? "Επαγγελματικό Email" : "Διεύθυνση Email"}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="password" className="sr-only">Κωδικός</label>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        autoComplete="current-password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className={`appearance-none rounded-xl relative block w-full px-4 py-3 border border-slate-300 placeholder-slate-500 text-slate-900 focus:outline-none focus:ring-2 focus:z-10 sm:text-sm transition-colors ${userType === 'vet' ? 'focus:ring-indigo-500 focus:border-indigo-500' : 'focus:ring-teal-500 focus:border-teal-500'}`}
                                        placeholder="Κωδικός Πρόσβασης"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <input
                                        id="remember-me"
                                        name="remember-me"
                                        type="checkbox"
                                        className={`h-4 w-4 border-slate-300 rounded ${userType === 'vet' ? 'text-indigo-600 focus:ring-indigo-500' : 'text-teal-600 focus:ring-teal-500'}`}
                                    />
                                    <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-900">
                                        Απομνημόνευση
                                    </label>
                                </div>

                                {isLoginMode && (
                                    <div className="text-sm">
                                        <a href="#" className={`font-medium ${linkColor}`}>
                                            Ξεχάσατε τον κωδικό;
                                        </a>
                                    </div>
                                )}
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all disabled:opacity-70 ${buttonColor}`}
                                >
                                    {loading ? (
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    ) : (
                                        isLoginMode ? (userType === 'vet' ? 'Είσοδος στο Dashboard' : 'Σύνδεση') : 'Δημιουργία Λογαριασμού'
                                    )}
                                </button>
                            </div>
                        </form>

                        <div className="text-center mt-4">
                            {/* Registration Toggle (User Only - Vets use the special card) */}
                            {userType === 'user' && (
                                <p className="text-sm text-slate-600 mb-4">
                                    {isLoginMode ? 'Δεν έχετε λογαριασμό;' : 'Έχετε ήδη λογαριασμό;'}
                                    <button 
                                        onClick={() => setIsLoginMode(!isLoginMode)}
                                        className={`font-bold ml-1 ${linkColor}`}
                                    >
                                        {isLoginMode ? 'Εγγραφείτε δωρεάν' : 'Συνδεθείτε'}
                                    </button>
                                </p>
                            )}
                            
                            {/* Mode Switcher Link */}
                            <div className="border-t border-slate-100 pt-4 mt-6">
                                {userType === 'user' ? (
                                    <button 
                                        onClick={() => setUserType('vet')}
                                        className="text-xs font-medium text-slate-400 hover:text-indigo-600 flex items-center justify-center gap-1 mx-auto transition-colors"
                                    >
                                        <StethoscopeIcon className="w-3 h-3" />
                                        Είστε Κτηνίατρος; Είσοδος Επαγγελματία
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => setUserType('user')}
                                        className="text-xs font-medium text-slate-400 hover:text-teal-600 flex items-center justify-center gap-1 mx-auto transition-colors"
                                    >
                                        <UserIcon className="w-3 h-3" />
                                        Είστε Ιδιοκτήτης; Είσοδος Χρήστη
                                    </button>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Login;
