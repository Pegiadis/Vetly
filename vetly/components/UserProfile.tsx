
import React, { useState } from 'react';
import { User } from '../types';
import { CameraIcon, UserIcon, LockIcon, BellIcon, SaveIcon, CheckIcon, ArrowRightIcon, ShieldCheckIcon, SmartphoneIcon, MonitorIcon, TrashIcon } from './Icons';

interface UserProfileProps {
    user: User;
    onUpdateUser: (updatedUser: User) => void;
    onBack: () => void;
}

type TabType = 'personal' | 'security' | 'notifications';

const UserProfile: React.FC<UserProfileProps> = ({ user, onUpdateUser, onBack }) => {
    const [activeTab, setActiveTab] = useState<TabType>('security');

    const [formData, setFormData] = useState({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        image: user.image || '',
    });

    const [passwordData, setPasswordData] = useState({
        current: '',
        new: '',
        confirm: ''
    });

    const [securitySettings, setSecuritySettings] = useState({
        twoFactor: false,
        loginAlerts: true
    });

    const [notifications, setNotifications] = useState({
        email: true,
        sms: true,
        promotions: false
    });

    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        // Simulate API call
        setTimeout(() => {
            onUpdateUser({
                ...user,
                ...formData
            });
            setIsSaving(false);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        }, 1000);
    };

    const renderSidebar = () => (
        <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 text-center">
                <div className="relative inline-block mb-4 group">
                    <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-teal-50 mx-auto">
                        {formData.image ? (
                            <img src={formData.image} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
                                <UserIcon className="w-12 h-12" />
                            </div>
                        )}
                    </div>
                    <button className="absolute bottom-0 right-0 bg-slate-900 text-white p-2 rounded-full hover:bg-teal-600 transition-colors shadow-lg">
                        <CameraIcon className="w-4 h-4" />
                    </button>
                </div>
                <h2 className="text-xl font-bold text-slate-900">{formData.name}</h2>
                <p className="text-slate-500 text-sm">{formData.email}</p>
            </div>

            {/* Menu */}
            <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100">
                <button 
                    onClick={() => setActiveTab('personal')}
                    className={`w-full text-left px-6 py-4 flex items-center justify-between transition-colors ${activeTab === 'personal' ? 'bg-teal-50 text-teal-800 font-bold border-l-4 border-teal-600' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                    <span className="flex items-center gap-3">
                        <UserIcon className="w-5 h-5" /> Προσωπικά Στοιχεία
                    </span>
                    {activeTab === 'personal' && <ArrowRightIcon className="w-4 h-4" />}
                </button>
                <button 
                    onClick={() => setActiveTab('security')}
                    className={`w-full text-left px-6 py-4 flex items-center justify-between transition-colors ${activeTab === 'security' ? 'bg-teal-50 text-teal-800 font-bold border-l-4 border-teal-600' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                    <span className="flex items-center gap-3">
                        <LockIcon className="w-5 h-5" /> Ασφάλεια
                    </span>
                    {activeTab === 'security' && <ArrowRightIcon className="w-4 h-4" />}
                </button>
                <button 
                    onClick={() => setActiveTab('notifications')}
                    className={`w-full text-left px-6 py-4 flex items-center justify-between transition-colors ${activeTab === 'notifications' ? 'bg-teal-50 text-teal-800 font-bold border-l-4 border-teal-600' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                    <span className="flex items-center gap-3">
                        <BellIcon className="w-5 h-5" /> Ειδοποιήσεις
                    </span>
                    {activeTab === 'notifications' && <ArrowRightIcon className="w-4 h-4" />}
                </button>
            </div>
        </div>
    );

    const renderPersonalInfo = () => (
        <div className="space-y-8 animate-fade-in">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                    <div className="bg-teal-100 text-teal-700 p-2 rounded-lg">
                        <UserIcon className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">Στοιχεία Χρήστη</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Ονοματεπώνυμο</label>
                        <input 
                            type="text" 
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
                        <input 
                            type="email" 
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Τηλέφωνο</label>
                        <input 
                            type="tel" 
                            name="phone"
                            placeholder="+30 690 000 0000"
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Διεύθυνση</label>
                        <input 
                            type="text" 
                            name="address"
                            placeholder="Οδός, Αριθμός, Πόλη"
                            value={formData.address}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none transition-all"
                        />
                    </div>
                </div>
            </div>
        </div>
    );

    const renderSecurity = () => (
        <div className="space-y-8 animate-fade-in">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full transform translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
                 <div className="relative z-10 flex items-center gap-4">
                     <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                         <ShieldCheckIcon className="w-8 h-8 text-teal-400" />
                     </div>
                     <div>
                         <h3 className="text-2xl font-bold">Κέντρο Ασφαλείας</h3>
                         <p className="text-slate-300 opacity-90">Διαχειριστείτε τον κωδικό σας και τις μεθόδους ταυτοποίησης.</p>
                     </div>
                 </div>
            </div>

            {/* Password Change */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-amber-100 text-amber-700 p-2 rounded-lg">
                            <LockIcon className="w-5 h-5" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">Αλλαγή Κωδικού</h3>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Τρέχων Κωδικός</label>
                        <input 
                            type="password" 
                            name="current"
                            value={passwordData.current}
                            onChange={handlePasswordChange}
                            placeholder="••••••••"
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none transition-all"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Νέος Κωδικός</label>
                            <input 
                                type="password" 
                                name="new"
                                value={passwordData.new}
                                onChange={handlePasswordChange}
                                placeholder="••••••••"
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Επιβεβαίωση Νέου Κωδικού</label>
                            <input 
                                type="password" 
                                name="confirm"
                                value={passwordData.confirm}
                                onChange={handlePasswordChange}
                                placeholder="••••••••"
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* 2FA & Login History Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 2FA */}
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col justify-between">
                     <div>
                         <div className="flex items-center gap-3 mb-4">
                            <div className="bg-teal-100 text-teal-600 p-2 rounded-lg">
                                <ShieldCheckIcon className="w-5 h-5" />
                            </div>
                            <h4 className="font-bold text-slate-800">Two-Factor Auth (2FA)</h4>
                        </div>
                        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                            Προσθέστε ένα επιπλέον επίπεδο ασφάλειας στον λογαριασμό σας. Θα ζητείται κωδικός SMS σε κάθε νέα σύνδεση.
                        </p>
                     </div>
                    
                    <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl">
                        <span className={`text-sm font-bold ${securitySettings.twoFactor ? 'text-teal-600' : 'text-slate-500'}`}>
                            {securitySettings.twoFactor ? 'Ενεργοποιημένο' : 'Απενεργοποιημένο'}
                        </span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={securitySettings.twoFactor} 
                                onChange={() => setSecuritySettings({...securitySettings, twoFactor: !securitySettings.twoFactor})} 
                                className="sr-only peer" 
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                        </label>
                    </div>
                </div>

                {/* Login History */}
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                    <h4 className="font-bold text-slate-800 mb-4">Ιστορικό Συσκευών</h4>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 pb-3 border-b border-slate-50">
                            <div className="bg-slate-100 p-2 rounded-lg text-slate-600">
                                <MonitorIcon className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-slate-800">Windows PC</p>
                                <p className="text-xs text-slate-500">Αθήνα, GR • Ενεργό τώρα</p>
                            </div>
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        </div>
                         <div className="flex items-center gap-3">
                            <div className="bg-slate-100 p-2 rounded-lg text-slate-600">
                                <SmartphoneIcon className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-slate-800">iPhone 13 Pro</p>
                                <p className="text-xs text-slate-500">Θεσσαλονίκη, GR • 2 ώρες πριν</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-50 rounded-3xl p-8 border border-red-100">
                <h4 className="font-bold text-red-800 mb-2 flex items-center gap-2">
                    <TrashIcon className="w-5 h-5" /> Περιοχή Κινδύνου
                </h4>
                <p className="text-sm text-red-600 mb-6 max-w-2xl">
                    Η διαγραφή του λογαριασμού είναι μόνιμη. Όλα τα δεδομένα, τα κατοικίδια και το ιστορικό ραντεβού θα διαγραφούν οριστικά.
                </p>
                <button className="px-6 py-2 bg-white border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-600 hover:text-white transition-colors text-sm">
                    Διαγραφή Λογαριασμού
                </button>
            </div>
        </div>
    );

    const renderNotifications = () => (
         <div className="space-y-8 animate-fade-in">
             <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                    <div className="bg-indigo-100 text-indigo-700 p-2 rounded-lg">
                        <BellIcon className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">Ρυθμίσεις Ειδοποιήσεων</h3>
                </div>
                
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                        <div>
                            <h4 className="font-bold text-slate-800">Email Ειδοποιήσεις</h4>
                            <p className="text-sm text-slate-500">Λάβετε ενημερώσεις για τα ραντεβού σας μέσω email.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={notifications.email} onChange={() => setNotifications({...notifications, email: !notifications.email})} className="sr-only peer" />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                        </label>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                        <div>
                            <h4 className="font-bold text-slate-800">SMS Ειδοποιήσεις</h4>
                            <p className="text-sm text-slate-500">Λάβετε υπενθυμίσεις στο κινητό σας.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={notifications.sms} onChange={() => setNotifications({...notifications, sms: !notifications.sms})} className="sr-only peer" />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                        </label>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                        <div>
                            <h4 className="font-bold text-slate-800">Προσφορές & Νέα</h4>
                            <p className="text-sm text-slate-500">Ενημερωθείτε για νέες υπηρεσίες και προσφορές.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={notifications.promotions} onChange={() => setNotifications({...notifications, promotions: !notifications.promotions})} className="sr-only peer" />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                        </label>
                    </div>
                </div>
            </div>
         </div>
    );

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
            
            {/* Header with Back Button */}
            <div className="flex items-center justify-between mb-8">
                <button 
                    onClick={onBack}
                    className="flex items-center text-slate-500 hover:text-teal-600 transition-colors font-medium group"
                >
                    <span className="transform group-hover:-translate-x-1 transition-transform inline-block mr-2">←</span> 
                    Πίσω
                </button>
                <h1 className="text-2xl font-bold text-slate-900">Ρυθμίσεις Λογαριασμού</h1>
                <div className="w-20"></div> {/* Spacer for centering */}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Sidebar */}
                {renderSidebar()}

                {/* Main Content */}
                <div className="lg:col-span-2">
                    <form onSubmit={handleSubmit}>
                        
                        {activeTab === 'personal' && renderPersonalInfo()}
                        {activeTab === 'security' && renderSecurity()}
                        {activeTab === 'notifications' && renderNotifications()}

                        {/* Action Buttons */}
                        <div className="flex items-center justify-end gap-4 mt-8">
                            <button 
                                type="button"
                                onClick={onBack}
                                className="px-6 py-3 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
                            >
                                Ακύρωση
                            </button>
                            <button 
                                type="submit"
                                disabled={isSaving}
                                className="px-8 py-3 rounded-xl font-bold text-white bg-slate-900 hover:bg-teal-600 transition-colors shadow-lg flex items-center gap-2 disabled:opacity-70"
                            >
                                {isSaving ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                        Αποθήκευση...
                                    </>
                                ) : (
                                    <>
                                        <SaveIcon className="w-4 h-4" />
                                        Αποθήκευση
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Success Message Toast */}
                    <div className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 transition-all duration-500 z-50 ${showSuccess ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
                        <div className="bg-green-500 rounded-full p-1">
                            <CheckIcon className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-bold">Οι αλλαγές αποθηκεύτηκαν επιτυχώς!</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
