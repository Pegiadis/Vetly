import Link from 'next/link';

const Footer = () => {
    return (
        <footer className="bg-slate-900 text-slate-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Brand */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <svg className="h-7 w-7 text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .08.703 1.725 1.722 3.656 1 1.261-.472 1.96-1.45 2.344-2.5M14 5.172C14 3.782 15.577 2.679 17.5 3c2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.96-1.45-2.344-2.5" />
                                <path d="M8 14v.5M16 14v.5" />
                                <path d="M11.25 16.25h1.5L12 17l-.75-.75z" />
                                <path d="M4.42 11.247A13.152 13.152 0 004 14.556C4 18.728 7.582 21 12 21s8-2.272 8-6.444a13.152 13.152 0 00-.42-3.31" />
                            </svg>
                            <span className="text-xl font-bold text-white">Vetly</span>
                        </div>
                        <p className="text-sm text-slate-400">
                            Η πλατφόρμα κτηνιατρικής φροντίδας
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Σύνδεσμοι</h4>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link href="/" className="hover:text-teal-400 transition-colors">
                                    Αρχική
                                </Link>
                            </li>
                            <li>
                                <Link href="/vets" className="hover:text-teal-400 transition-colors">
                                    Κτηνίατροι
                                </Link>
                            </li>
                            <li>
                                <Link href="/owner/login" className="hover:text-teal-400 transition-colors">
                                    Σύνδεση
                                </Link>
                            </li>
                            <li>
                                <Link href="/vet/register" className="hover:text-teal-400 transition-colors">
                                    Εγγραφή Ιατρού
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Επικοινωνία</h4>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <a href="mailto:info@vetly.gr" className="hover:text-teal-400 transition-colors">
                                    info@vetly.gr
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="border-t border-slate-800 mt-10 pt-6 text-center text-xs text-slate-500">
                    &copy; 2026 Vetly. Με αγάπη για τα κατοικίδια.
                </div>
            </div>
        </footer>
    );
};

export default Footer;
