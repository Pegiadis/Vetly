import VetSidebar from '@/components/vet/VetSidebar';
import VetHeader from '@/components/vet/VetHeader';

export default function VetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
