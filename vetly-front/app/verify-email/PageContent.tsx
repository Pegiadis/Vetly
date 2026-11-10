'use client';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api, ApiError } from '@/lib/api';
import { consumePendingNext } from '@/lib/next-path';

interface VerifyResponse {
  access_token: string;
  token_type: string;
  message: string;
  pending_professional_verification?: boolean;
}

export default function VerifyEmailPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login } = useAuth();
  const token = searchParams.get('token') || '';
  const startedToken = useRef<string | null>(null);

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('Ανακατεύθυνση στον πίνακα ελέγχου...');
  const [userType, setUserType] = useState<'vet' | 'pet_owner'>('pet_owner');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('Δεν βρέθηκε token επιβεβαίωσης.');
      return;
    }
    // Strict Mode replays effects; a verification link is consumed only once.
    if (startedToken.current === token) return;
    startedToken.current = token;

    // Decode user type from token for redirect
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (payload.type === 'vet' || payload.type === 'pet_owner') {
        setUserType(payload.type);
      }
    } catch {
      // ignore decode errors
    }

    const verify = async () => {
      try {
        const response = await api.post<VerifyResponse>('/auth/verify-email', { token });
        setStatus('success');
        if (response.pending_professional_verification) {
          consumePendingNext();
          setSuccessMessage('Το email επιβεβαιώθηκε. Εκκρεμεί ο έλεγχος των επαγγελματικών στοιχείων σας για την πιλοτική δοκιμή.');
          return;
        }

        // Decode type from returned token
        let resolvedType: 'vet' | 'pet_owner' = userType;
        try {
          const payload = JSON.parse(atob(response.access_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
          if (payload.type === 'vet' || payload.type === 'pet_owner') {
            resolvedType = payload.type;
          }
        } catch {
          // ignore
        }

        await login(response.access_token, resolvedType);
        const dashboard = resolvedType === 'vet' ? '/vet/dashboard' : '/owner/dashboard';
        // The return path was stored on this browser when the user registered or signed in.
        router.push(consumePendingNext() ?? dashboard);
      } catch (err) {
        setStatus('error');
        if (err instanceof ApiError) {
          setErrorMessage(err.message);
        } else {
          setErrorMessage('Παρουσιάστηκε σφάλμα κατά την επιβεβαίωση.');
        }
      }
    };

    verify();
  }, [token]);

  const isTeal = userType === 'pet_owner';

  return (
    <div className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-ink-50`}>

      <div className="max-w-sm w-full space-y-5 bg-white p-6 rounded-xl relative z-10 border border-ink-200 text-center">
        {status === 'verifying' && (
          <>
            <div className={`mx-auto h-20 w-20 rounded-full flex items-center justify-center ${isTeal ? 'bg-teal-100' : 'bg-clinic-100'}`}>
              <svg className={`animate-spin h-10 w-10 ${isTeal ? 'text-teal-600' : 'text-clinic-700'}`} fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-ink-900">Επιβεβαίωση email...</h2>
            <p className="text-sm text-ink-600">Παρακαλώ περιμένετε.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mx-auto h-20 w-20 rounded-full flex items-center justify-center bg-green-100 text-green-600">
              <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-ink-900">Επιτυχής επιβεβαίωση!</h2>
            <p className="text-sm text-ink-600">{successMessage}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mx-auto h-20 w-20 rounded-full flex items-center justify-center bg-red-100 text-red-600">
              <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-ink-900">Αποτυχία επιβεβαίωσης</h2>
            <p className="text-sm text-red-600">{errorMessage}</p>
            <Link
              href={`/verify-email/pending?userType=${userType}`}
              className={`inline-block mt-4 px-4 py-2.5 text-sm font-medium rounded-[10px] text-white transition-all ${
                isTeal ? 'bg-teal-600 hover:bg-teal-700' : 'bg-clinic-600 hover:bg-clinic-700'
              }`}
            >
              Αποστολή νέου email επιβεβαίωσης
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
