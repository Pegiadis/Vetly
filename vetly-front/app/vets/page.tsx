import { Metadata } from 'next';
import VetList from '@/components/VetList';
import { VetListResponse } from '@/types/vet';

export const metadata: Metadata = {
  title: 'Κτηνίατροι | Vetly',
  description: 'Βρείτε τον κατάλληλο κτηνίατρο για το κατοικίδιό σας',
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

async function getVets(): Promise<VetListResponse> {
  const res = await fetch(`${API_URL}/vets`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch vets');
  }

  return res.json();
}

export default async function VetsPage() {
  const data = await getVets();

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Κτηνίατροι</h1>
          <p className="text-gray-600 mt-2">
            Βρείτε τον κατάλληλο κτηνίατρο για το κατοικίδιό σας
          </p>
        </div>

        {/* Results count */}
        <p className="text-sm text-gray-500 mb-4">
          {data.total} κτηνίατροι
        </p>

        {/* Vet list */}
        <VetList vets={data.items} />
      </div>
    </main>
  );
}
