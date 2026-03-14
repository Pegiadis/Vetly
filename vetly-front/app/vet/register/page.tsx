'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api, ApiError } from '@/lib/api';
import PasswordStrengthIndicator from '@/components/PasswordStrengthIndicator';

export default function VetRegisterPage() {
  const router = useRouter();
  const { isAuthenticated, userType, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated && userType === 'vet') {
      router.replace('/vet/dashboard');
    }
  }, [isLoading, isAuthenticated, userType, router]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    specialty: '',
    license_number: '',
    phone: '',
    address: '',
    city: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [emailTaken, setEmailTaken] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

  const checkEmailAvailability = useCallback(async (email: string) => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    setCheckingEmail(true);
    try {
      const result = await api.get<{ available: boolean }>(`/auth/check-email?email=${encodeURIComponent(email)}&user_type=vet`);
      setEmailTaken(!result.available);
    } catch {
      // Silently fail — server-side validation is the fallback
    } finally {
      setCheckingEmail(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setTouched(prev => ({ ...prev, [e.target.name]: true }));
    if (e.target.name === 'email') setEmailTaken(false);
    setError('');
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    if (field === 'email') checkEmailAvailability(formData.email);
  };

  const fieldErrors: Record<string, string> = {};
  if (formData.name.length > 0 && formData.name.trim().length < 2) fieldErrors.name = 'Τουλάχιστον 2 χαρακτήρες.';
  if (emailTaken) fieldErrors.email = 'Αυτό το email χρησιμοποιείται ήδη.';
  if (formData.specialty.length > 0 && formData.specialty.trim().length < 2) fieldErrors.specialty = 'Τουλάχιστον 2 χαρακτήρες.';
  if (formData.license_number.length > 0 && formData.license_number.trim().length < 2) fieldErrors.license_number = 'Τουλάχιστον 2 χαρακτήρες.';
  if (formData.phone.length > 0 && formData.phone.trim().length < 5) fieldErrors.phone = 'Τουλάχιστον 5 χαρακτήρες.';
  if (formData.address.length > 0 && formData.address.trim().length < 5) fieldErrors.address = 'Τουλάχιστον 5 χαρακτήρες.';
  if (formData.city.length > 0 && formData.city.trim().length < 2) fieldErrors.city = 'Τουλάχιστον 2 χαρακτήρες.';
  if (formData.password.length > 0 && formData.password.length < 6) fieldErrors.password = 'Τουλάχιστον 6 χαρακτήρες.';
  if (formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword) fieldErrors.confirmPassword = 'Οι κωδικοί δεν ταιριάζουν.';

  const inputErr = (field: string) => touched[field] && fieldErrors[field] ? 'border-red-300 bg-red-50/30' : 'border-slate-300';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Οι κωδικοί δεν ταιριάζουν.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες.');
      return;
    }

    if (formData.name.trim().length < 2) {
      setError('Το όνομα πρέπει να έχει τουλάχιστον 2 χαρακτήρες.');
      return;
    }
    if (formData.specialty.trim().length < 2) {
      setError('Η ειδικότητα πρέπει να έχει τουλάχιστον 2 χαρακτήρες.');
      return;
    }
    if (formData.phone.trim().length < 5) {
      setError('Το τηλέφωνο πρέπει να έχει τουλάχιστον 5 χαρακτήρες.');
      return;
    }
    if (formData.address.trim().length < 5) {
      setError('Η διεύθυνση πρέπει να έχει τουλάχιστον 5 χαρακτήρες.');
      return;
    }
    if (formData.city.trim().length < 2) {
      setError('Η πόλη πρέπει να έχει τουλάχιστον 2 χαρακτήρες.');
      return;
    }

    setLoading(true);

    try {
      await api.post<{ message: string; email: string }>('/auth/vet/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        specialty: formData.specialty,
        license_number: formData.license_number,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
      });

      router.push(`/verify-email/pending?email=${encodeURIComponent(formData.email)}&userType=vet`);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Παρουσιάστηκε σφάλμα. Δοκιμάστε ξανά.');
      }
      setLoading(false);
    }
  };

  const inputBase = "appearance-none rounded-xl relative block w-full px-4 py-3 border placeholder-slate-500 text-slate-900 focus:outline-none focus:ring-2 focus:z-10 sm:text-sm transition-colors focus:ring-indigo-500 focus:border-indigo-500";

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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Εγγραφή στο Vetly Pro
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Δημιουργήστε επαγγελματικό λογαριασμό κτηνιάτρου.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Registration Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="name" className="sr-only">Ονοματεπώνυμο</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={255}
                  value={formData.name}
                  onChange={handleChange}
                  onBlur={() => handleBlur('name')}
                  className={`${inputBase} ${inputErr('name')}`}
                  placeholder="Ονοματεπώνυμο"
                />
                {touched.name && fieldErrors.name && <p className="text-xs text-red-600 mt-1">{fieldErrors.name}</p>}
              </div>
              <div>
                <label htmlFor="specialty" className="sr-only">Ειδικότητα</label>
                <input
                  id="specialty"
                  name="specialty"
                  type="text"
                  required
                  minLength={2}
                  maxLength={255}
                  value={formData.specialty}
                  onChange={handleChange}
                  onBlur={() => handleBlur('specialty')}
                  className={`${inputBase} ${inputErr('specialty')}`}
                  placeholder="Ειδικότητα"
                />
                {touched.specialty && fieldErrors.specialty && <p className="text-xs text-red-600 mt-1">{fieldErrors.specialty}</p>}
              </div>
            </div>
            <div>
              <label htmlFor="email" className="sr-only">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                onBlur={() => handleBlur('email')}
                className={`${inputBase} ${inputErr('email')}`}
                placeholder="Επαγγελματικό Email"
              />
              {checkingEmail && <p className="text-xs text-slate-500 mt-1">Έλεγχος email...</p>}
              {touched.email && fieldErrors.email && <p className="text-xs text-red-600 mt-1">{fieldErrors.email}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="license_number" className="sr-only">Αριθμός Άδειας</label>
                <input
                  id="license_number"
                  name="license_number"
                  type="text"
                  required
                  minLength={2}
                  maxLength={100}
                  value={formData.license_number}
                  onChange={handleChange}
                  onBlur={() => handleBlur('license_number')}
                  className={`${inputBase} ${inputErr('license_number')}`}
                  placeholder="Αριθμός Άδειας"
                />
                {touched.license_number && fieldErrors.license_number && <p className="text-xs text-red-600 mt-1">{fieldErrors.license_number}</p>}
              </div>
              <div>
                <label htmlFor="phone" className="sr-only">Τηλέφωνο</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  minLength={5}
                  maxLength={50}
                  value={formData.phone}
                  onChange={handleChange}
                  onBlur={() => handleBlur('phone')}
                  className={`${inputBase} ${inputErr('phone')}`}
                  placeholder="Τηλέφωνο"
                />
                {touched.phone && fieldErrors.phone && <p className="text-xs text-red-600 mt-1">{fieldErrors.phone}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="address" className="sr-only">Διεύθυνση</label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  autoComplete="street-address"
                  required
                  minLength={5}
                  maxLength={500}
                  value={formData.address}
                  onChange={handleChange}
                  onBlur={() => handleBlur('address')}
                  className={`${inputBase} ${inputErr('address')}`}
                  placeholder="Διεύθυνση"
                />
                {touched.address && fieldErrors.address && <p className="text-xs text-red-600 mt-1">{fieldErrors.address}</p>}
              </div>
              <div>
                <label htmlFor="city" className="sr-only">Πόλη</label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  autoComplete="address-level2"
                  required
                  minLength={2}
                  maxLength={100}
                  value={formData.city}
                  onChange={handleChange}
                  onBlur={() => handleBlur('city')}
                  className={`${inputBase} ${inputErr('city')}`}
                  placeholder="Πόλη"
                />
                {touched.city && fieldErrors.city && <p className="text-xs text-red-600 mt-1">{fieldErrors.city}</p>}
              </div>
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Κωδικός</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                maxLength={128}
                value={formData.password}
                onChange={handleChange}
                onBlur={() => handleBlur('password')}
                className={`${inputBase} ${inputErr('password')}`}
                placeholder="Κωδικός Πρόσβασης"
              />
              {touched.password && fieldErrors.password && <p className="text-xs text-red-600 mt-1">{fieldErrors.password}</p>}
              <PasswordStrengthIndicator password={formData.password} colorScheme="indigo" />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="sr-only">Επιβεβαίωση Κωδικού</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                maxLength={128}
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={() => handleBlur('confirmPassword')}
                className={`${inputBase} ${inputErr('confirmPassword')}`}
                placeholder="Επιβεβαίωση Κωδικού"
              />
              {touched.confirmPassword && fieldErrors.confirmPassword && <p className="text-xs text-red-600 mt-1">{fieldErrors.confirmPassword}</p>}
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
                'Δημιουργία Λογαριασμού'
              )}
            </button>
          </div>
        </form>

        {/* Login Link */}
        <div className="text-center mt-4">
          <p className="text-sm text-slate-600">
            Έχετε ήδη λογαριασμό;{' '}
            <Link href="/vet/login" className="font-bold text-indigo-600 hover:text-indigo-500">
              Σύνδεση
            </Link>
          </p>

          {/* Owner Registration Link */}
          <div className="border-t border-slate-100 pt-4 mt-6">
            <Link
              href="/register"
              className="text-xs font-medium text-slate-400 hover:text-teal-600 flex items-center justify-center gap-1 mx-auto transition-colors"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Είστε Ιδιοκτήτης; Εγγραφή Χρήστη
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
