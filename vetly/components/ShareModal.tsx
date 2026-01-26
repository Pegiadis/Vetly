import React, { useState, useEffect } from 'react';
import { XIcon, CopyIcon, CheckIcon, QrCodeIcon } from './Icons';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    petName: string;
    petId: string;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, petName, petId }) => {
    const [step, setStep] = useState<'config' | 'generated'>('config');
    const [duration, setDuration] = useState('24h');
    const [copied, setCopied] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setStep('config');
            setCopied(false);
            setIsGenerating(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleGenerate = () => {
        setIsGenerating(true);
        setTimeout(() => {
            setStep('generated');
            setIsGenerating(false);
        }, 1500);
    };

    const shareUrl = `https://vetly.gr/share/${petId}/${Math.random().toString(36).substring(7)}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
                
                {/* Header */}
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-slate-800">Κοινοποίηση Ιστορικού</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {step === 'config' ? (
                        <div className="space-y-6">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <QrCodeIcon className="w-8 h-8" />
                                </div>
                                <p className="text-slate-600 text-sm">
                                    Δημιουργήστε έναν ασφαλή, προσωρινό σύνδεσμο για να μοιραστείτε το ιατρικό ιστορικό του/της <span className="font-bold text-slate-900">{petName}</span> με τον κτηνίατρό σας.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-slate-700">Διάρκεια Ισχύος</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {['1 Ώρα', '24 Ώρες', '7 Ημέρες'].map((opt) => (
                                        <button
                                            key={opt}
                                            onClick={() => setDuration(opt)}
                                            className={`py-2 px-3 rounded-xl text-sm font-medium transition-all border ${
                                                duration === opt 
                                                ? 'bg-teal-50 border-teal-500 text-teal-700 ring-1 ring-teal-500' 
                                                : 'bg-white border-slate-200 text-slate-600 hover:border-teal-300'
                                            }`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button 
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                className="w-full py-3.5 bg-slate-900 hover:bg-teal-600 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-teal-500/20 flex justify-center items-center"
                            >
                                {isGenerating ? (
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                ) : (
                                    'Δημιουργία Συνδέσμου'
                                )}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-fade-in">
                            <div className="text-center">
                                <div className="bg-white p-4 border-2 border-dashed border-slate-200 rounded-2xl inline-block mb-4 relative overflow-hidden">
                                     {/* Mock QR Code */}
                                    <div className="w-40 h-40 bg-slate-900 p-2 grid grid-cols-6 grid-rows-6 gap-1">
                                        {[...Array(36)].map((_, i) => (
                                            <div key={i} className={`rounded-sm ${Math.random() > 0.5 ? 'bg-white' : 'bg-slate-900'}`}></div>
                                        ))}
                                        {/* Big squares for QR look */}
                                        <div className="absolute top-4 left-4 w-10 h-10 border-4 border-white bg-slate-900 z-10"></div>
                                        <div className="absolute top-4 right-4 w-10 h-10 border-4 border-white bg-slate-900 z-10"></div>
                                        <div className="absolute bottom-4 left-4 w-10 h-10 border-4 border-white bg-slate-900 z-10"></div>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                                    Δείξτε αυτόν τον κωδικό στον κτηνίατρο
                                </p>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center gap-3">
                                <div className="flex-1 truncate font-mono text-sm text-slate-600 select-all">
                                    {shareUrl}
                                </div>
                                <button 
                                    onClick={handleCopy}
                                    className={`p-2 rounded-lg transition-colors ${copied ? 'bg-green-100 text-green-600' : 'bg-white text-slate-500 hover:text-teal-600 shadow-sm'}`}
                                >
                                    {copied ? <CheckIcon className="w-5 h-5" /> : <CopyIcon className="w-5 h-5" />}
                                </button>
                            </div>

                            <div className="bg-amber-50 text-amber-800 text-xs p-3 rounded-lg border border-amber-100 flex gap-2">
                                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                                Αυτός ο σύνδεσμος λήγει σε {duration}. Μοιραστείτε τον μόνο με πιστοποιημένους επαγγελματίες.
                            </div>

                            <button 
                                onClick={onClose}
                                className="w-full py-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-semibold transition-colors"
                            >
                                Κλείσιμο
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShareModal;