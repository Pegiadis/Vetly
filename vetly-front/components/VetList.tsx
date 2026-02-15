import { Vet } from '@/types/vet';
import VetCard from './VetCard';

interface VetListProps {
  vets: Vet[];
  isLoading?: boolean;
}

export default function VetList({ vets, isLoading }: VetListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl shadow-md p-6 animate-pulse"
          >
            <div className="flex gap-4">
              <div className="w-16 h-16 rounded-full bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-1/3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (vets.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No veterinarians found</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {vets.map((vet) => (
        <VetCard key={vet.id} vet={vet} />
      ))}
    </div>
  );
}
