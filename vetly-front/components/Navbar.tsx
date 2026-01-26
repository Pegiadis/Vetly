'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogoIcon, BookOpenIcon, MenuIcon, XIcon, StethoscopeIcon } from './Icons';

const Navbar: React.FC = () => {
    const router = useRouter();
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

        window.addEventListener('scroll', controlNavbar);
        
        return () => {
            window.removeEventListener('scroll', controlNavbar);
        };
    }, [lastScrollY]);

    const navClasses = `fixed top-0 w-full z-50 transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
    } bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm`;

    return (
        <nav className={navClasses}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div 
                        className="flex items-center cursor-pointer group"
                        onClick={() => router.push('/')}
                    >
                        <LogoIcon className="h-8 w-8 text-teal-600 group-hover:scale-110 transition-transform" />
                        <span className="ml-2 text-xl font-bold text-slate-800 tracking-tight">
                            Vetly
                        </span>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-8">
                        <button 
                            onClick={() => router.push('/')}
                            className="text-sm font-medium hover:text-teal-600 transition-colors text-teal-600 font-bold"
                        >
                            Αρχική
                        </button>
                        <button 
                            onClick={() => console.log('Navigate to About')}
                            className="text-sm font-medium hover:text-teal-600 transition-colors text-slate-600"
                        >
                            Σχετικά με εμάς
                        </button>
                        <button 
                            onClick={() => console.log('Navigate to Blog')}
                            className="text-sm font-medium hover:text-teal-600 transition-colors flex items-center gap-1 text-slate-600"
                        >
                            <BookOpenIcon className="w-4 h-4" />
                            Blog
                        </button>
                    </div>

                    {/* Right Side Buttons */}
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => router.push('/login')}
                            className="hidden md:block text-slate-600 hover:text-teal-600 text-sm font-bold px-4 py-2 transition-colors rounded-lg hover:bg-slate-50"
                        >
                            Σύνδεση
                        </button>
                        <button 
                            onClick={() => router.push('/login')}
                            className="hidden md:flex bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-5 py-2.5 rounded-full transition-all shadow-md items-center gap-2"
                        >
                            <StethoscopeIcon className="w-4 h-4" />
                            Είσοδος Ιατρού
                        </button>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 text-slate-600 hover:text-teal-600 transition-colors"
                        >
                            {mobileMenuOpen ? (
                                <XIcon className="w-6 h-6" />
                            ) : (
                                <MenuIcon className="w-6 h-6" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden bg-white border-t border-slate-200 shadow-lg">
                    <div className="px-4 pt-2 pb-4 space-y-2">
                        <button 
                            onClick={() => {
                                router.push('/');
                                setMobileMenuOpen(false);
                            }}
                            className="block w-full text-left px-4 py-3 text-sm font-medium text-teal-600 bg-teal-50 rounded-lg"
                        >
                            Αρχική
                        </button>
                        <button 
                            onClick={() => {
                                console.log('Navigate to About');
                                setMobileMenuOpen(false);
                            }}
                            className="block w-full text-left px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                        >
                            Σχετικά με εμάς
                        </button>
                        <button 
                            onClick={() => {
                                console.log('Navigate to Blog');
                                setMobileMenuOpen(false);
                            }}
                            className="block w-full text-left px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-2"
                        >
                            <BookOpenIcon className="w-4 h-4" />
                            Blog
                        </button>
                        <div className="pt-3 border-t border-slate-200 space-y-2">
                            <button 
                                onClick={() => {
                                    router.push('/login');
                                    setMobileMenuOpen(false);
                                }}
                                className="block w-full text-center px-4 py-3 text-sm font-bold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                Σύνδεση
                            </button>
                            <button 
                                onClick={() => {
                                    router.push('/login');
                                    setMobileMenuOpen(false);
                                }}
                                className="block w-full text-center px-4 py-3 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <StethoscopeIcon className="w-4 h-4" />
                                Είσοδος Ιατρού
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
