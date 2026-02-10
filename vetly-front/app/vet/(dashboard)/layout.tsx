'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import VetSidebar from '@/components/vet/VetSidebar';
import VetHeader from '@/components/vet/VetHeader';

export default function VetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, userType, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || userType !== 'vet') {
      router.replace('/vet/login');
    }
  }, [isAuthenticated, userType, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!isAuthenticated || userType !== 'vet') {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <VetSidebar />
      <div className="ml-64">
        <VetHeader />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
