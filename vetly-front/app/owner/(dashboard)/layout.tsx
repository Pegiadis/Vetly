import OwnerSidebar from '@/components/owner/OwnerSidebar';
import OwnerHeader from '@/components/owner/OwnerHeader';

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <OwnerSidebar />
      <div className="ml-64">
        <OwnerHeader />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
