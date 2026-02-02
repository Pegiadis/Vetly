'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function VetLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate login - replace with actual auth later
    setTimeout(() => {
      setLoading(false);
      router.push('/vet/dashboard');
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-indigo-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full filter blur-[80px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-teal-600/5 rounded-full filter blur-[80px]" />

      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-3xl shadow-xl relative z-10 border border-slate-100">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 rounded-full flex items-center justify-center mb-4 bg-indigo-100 text-indigo-600">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Vetly Pro
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Πύλη εισόδου για επαγγελματίες κτηνιάτρους.
          </p>
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-slate-300 placeholder-slate-500 text-slate-900 focus:outline-none focus:ring-2 focus:z-10 sm:text-sm transition-colors focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Επαγγελματικό Email"
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
                className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-slate-300 placeholder-slate-500 text-slate-900 focus:outline-none focus:ring-2 focus:z-10 sm:text-sm transition-colors focus:ring-indigo-500 focus:border-indigo-500"
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
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 border-slate-300 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-900">
                Απομνημόνευση
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
                Ξεχάσατε τον κωδικό;
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all disabled:opacity-70 bg-indigo-900 hover:bg-indigo-800"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                'Είσοδος στο Dashboard'
              )}
            </button>
          </div>
        </form>

        {/* Registration Link */}
        <div className="text-center mt-4">
          <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Εγγραφή Ιατρείου</h3>
            <p className="text-sm text-slate-600 mb-4">
              Δημιουργήστε επαγγελματικό λογαριασμό και αποκτήστε πρόσβαση στο δίκτυο του Vetly.
            </p>
            <Link
              href="/vet/register"
              className="w-full inline-flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all"
            >
              Ξεκινήστε Εδώ
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* User Login Link */}
          <div className="border-t border-slate-100 pt-4 mt-6">
            <Link
              href="/login"
              className="text-xs font-medium text-slate-400 hover:text-teal-600 flex items-center justify-center gap-1 mx-auto transition-colors"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Είστε Ιδιοκτήτης; Είσοδος Χρήστη
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
