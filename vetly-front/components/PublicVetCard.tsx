import Link from 'next/link';
import { PublicVet } from '@/types/vet';
import { getImageUrl } from '@/lib/api';

interface PublicVetCardProps {
  vet: PublicVet;
}

function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className={i < Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function PublicVetCard({ vet }: PublicVetCardProps) {
  const imageUrl = getImageUrl(vet.image_url);

  return (
    <Link href={`/vets/${vet.slug || vet.id}`}>
      <article className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow p-6 cursor-pointer h-full">
        <div className="flex gap-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={vet.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center">
                <span className="text-teal-600 text-xl font-semibold">
                  {vet.name.charAt(0)}
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-gray-900 truncate">{vet.name}</h3>
              {vet.is_on_call && (
                <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Εφημερία
                </span>
              )}
            </div>

            {vet.specialty && (
              <p className="text-sm text-teal-600 font-medium mt-0.5">{vet.specialty}</p>
            )}
            {vet.city && (
              <p className="text-sm text-gray-500 mt-0.5">
                <span className="mr-1">📍</span>{vet.city}
              </p>
            )}

            {/* Rating */}
            <div className="flex items-center gap-1.5 mt-2">
              <StarRating rating={vet.rating_average} />
              <span className="text-sm font-medium text-gray-700">
                {Number(vet.rating_average).toFixed(1)}
              </span>
              <span className="text-sm text-gray-500">
                ({vet.reviews_count} κριτικές)
              </span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
