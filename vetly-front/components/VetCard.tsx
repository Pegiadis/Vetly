import Link from 'next/link';
import { Vet } from '@/types/vet';
import { getImageUrl } from '@/lib/api';

interface VetCardProps {
  vet: Vet;
}

export default function VetCard({ vet }: VetCardProps) {
  return (
    <Link href={`/vets/${vet.id}`}>
      <article className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow p-6 cursor-pointer">
        <div className="flex gap-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {vet.image_url ? (
              <img
                src={getImageUrl(vet.image_url)}
                alt={vet.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                <span className="text-emerald-600 text-xl font-semibold">
                  {vet.name.charAt(0)}
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 truncate">{vet.name}</h3>
              {vet.is_verified && (
                <span className="text-emerald-500" title="Verified">
                  ✓
                </span>
              )}
            </div>

            <p className="text-sm text-gray-600">{vet.specialty}</p>
            <p className="text-sm text-gray-500">{vet.city}</p>

            {/* Rating */}
            <div className="flex items-center gap-1 mt-2">
              <span className="text-yellow-400">★</span>
              <span className="text-sm font-medium text-gray-700">
                {Number(vet.rating_average).toFixed(1)}
              </span>
              <span className="text-sm text-gray-500">
                ({vet.reviews_count} reviews)
              </span>
            </div>
          </div>

          {/* On-call badge */}
          {vet.is_on_call && (
            <div className="flex-shrink-0">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                On Call
              </span>
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}
