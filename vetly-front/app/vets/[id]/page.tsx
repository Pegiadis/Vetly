import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { PublicVetDetail, PublicReviewListResponse } from '@/types/vet';
import { getImageUrl } from '@/lib/api';

const API_URL =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:8000/api/v1';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ review_page?: string }>;
}

async function getPublicVet(idOrSlug: string): Promise<PublicVetDetail | null> {
  const res = await fetch(`${API_URL}/public/vets/${idOrSlug}`, {
    cache: 'no-store',
  });

  if (res.status === 404) return null;
  if (!res.ok) return null;

  return res.json();
}

interface VetService {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
  is_active: boolean;
}

async function getVetServices(idOrSlug: string): Promise<{ items: VetService[] }> {
  const res = await fetch(`${API_URL}/public/vets/${idOrSlug}/services`, {
    cache: 'no-store',
  });
  if (!res.ok) return { items: [] };
  return res.json();
}

async function getVetReviews(
  idOrSlug: string,
  page = 1
): Promise<PublicReviewListResponse> {
  const res = await fetch(
    `${API_URL}/public/vets/${idOrSlug}/reviews?page=${page}&page_size=5`,
    { cache: 'no-store' }
  );

  if (!res.ok) return { items: [], total: 0, page: 1, page_size: 5 };
  return res.json();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const vet = await getPublicVet(id);

  if (!vet) {
    return { title: 'Κτηνίατρος δεν βρέθηκε | Vetly' };
  }

  return {
    title: `${vet.name} - Κτηνίατρος ${vet.specialty || ''} | Vetly`,
    description: `${vet.name}, κτηνίατρος ${vet.specialty || ''} στην ${vet.city || 'Ελλάδα'}. Αξιολόγηση: ${vet.rating_average || 'N/A'}/5. Κλείστε ραντεβού online.`,
    openGraph: {
      title: `${vet.name} - Κτηνίατρος | Vetly`,
      description:
        vet.description ||
        `Κτηνίατρος ${vet.specialty || ''} στην ${vet.city || 'Ελλάδα'}`,
      images: vet.image_url ? [getImageUrl(vet.image_url) as string] : [],
    },
  };
}

const DAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

const DAY_LABELS: Record<string, string> = {
  monday: 'Δευτέρα',
  tuesday: 'Τρίτη',
  wednesday: 'Τετάρτη',
  thursday: 'Πέμπτη',
  friday: 'Παρασκευή',
  saturday: 'Σάββατο',
  sunday: 'Κυριακή',
};

function StarRating({
  rating,
  max = 5,
  size = 'md',
}: {
  rating: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClass = size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-sm' : 'text-lg';
  return (
    <div className={`flex items-center gap-0.5 ${sizeClass}`}>
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} className={i < Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'}>
          ★
        </span>
      ))}
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('el-GR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default async function VetDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { review_page } = await searchParams;
  const reviewPage = review_page ? parseInt(review_page, 10) : 1;

  const [vet, reviewsData, servicesData] = await Promise.all([
    getPublicVet(id),
    getVetReviews(id, reviewPage),
    getVetServices(id),
  ]);

  if (!vet) {
    notFound();
  }

  const imageUrl = getImageUrl(vet.image_url);
  const totalReviewPages = Math.ceil(reviewsData.total / reviewsData.page_size);

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'VeterinaryCare',
    name: vet.name,
    address: {
      '@type': 'PostalAddress',
      streetAddress: vet.address,
      addressLocality: vet.city,
      addressCountry: 'GR',
    },
    telephone: vet.phone,
    ...(vet.reviews_count > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: vet.rating_average,
            reviewCount: vet.reviews_count,
          },
        }
      : {}),
    ...(imageUrl ? { image: imageUrl } : {}),
    ...(vet.description ? { description: vet.description } : {}),
  };

  function buildReviewPageUrl(page: number) {
    return `/vets/${id}?review_page=${page}`;
  }

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Navbar />
      <main className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Back link */}
          <Link
            href="/vets"
            className="inline-flex items-center text-teal-600 hover:text-teal-700 mb-6 text-sm font-medium"
          >
            ← Πίσω στους κτηνιάτρους
          </Link>

          {/* Hero card */}
          <div className="bg-white rounded-2xl shadow-md p-6 md:p-8 mb-6">
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={vet.name}
                    className="w-28 h-28 rounded-full object-cover ring-4 ring-teal-100"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-full bg-teal-100 flex items-center justify-center ring-4 ring-teal-50">
                    <span className="text-teal-600 text-4xl font-semibold">
                      {vet.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              {/* Basic info */}
              <div className="flex-1">
                <div className="flex flex-wrap items-start gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-gray-900">{vet.name}</h1>
                  {vet.is_on_call && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                      Σε Εφημερία
                    </span>
                  )}
                </div>

                {vet.specialty && (
                  <p className="text-lg text-teal-600 font-medium">{vet.specialty}</p>
                )}
                {vet.city && (
                  <p className="text-gray-500 mt-0.5">
                    <span className="mr-1">📍</span>
                    {vet.city}
                  </p>
                )}

                {/* Rating */}
                <div className="flex items-center gap-2 mt-3">
                  <StarRating rating={vet.rating_average} size="lg" />
                  <span className="font-semibold text-gray-800">
                    {Number(vet.rating_average).toFixed(1)}
                  </span>
                  <span className="text-gray-500 text-sm">
                    ({vet.reviews_count} κριτικές)
                  </span>
                </div>
              </div>

              {/* CTA */}
              <div className="sm:self-start">
                <Link
                  href={`/owner/book?vet=${vet.id}`}
                  className="inline-block bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors whitespace-nowrap"
                >
                  Κλείσε Ραντεβού
                </Link>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Description */}
            {vet.description && (
              <div className="bg-white rounded-2xl shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Σχετικά</h2>
                <p className="text-gray-600 leading-relaxed">{vet.description}</p>
              </div>
            )}

            {/* Contact */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Επικοινωνία</h2>
              <div className="space-y-3 text-gray-600">
                {vet.phone && (
                  <div className="flex items-center gap-2">
                    <span className="text-teal-500">📞</span>
                    <a
                      href={`tel:${vet.phone}`}
                      className="hover:text-teal-600 transition-colors"
                    >
                      {vet.phone}
                    </a>
                  </div>
                )}
                {vet.address && (
                  <div className="flex items-start gap-2">
                    <span className="text-teal-500 mt-0.5">📍</span>
                    <span>{vet.address}{vet.city ? `, ${vet.city}` : ''}</span>
                  </div>
                )}
                {vet.coordinates_lat && vet.coordinates_lng && (
                  <a
                    href={`https://www.google.com/maps?q=${vet.coordinates_lat},${vet.coordinates_lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-700 text-sm font-medium"
                  >
                    <span>🗺️</span> Δείτε στον χάρτη
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Services & Pricing */}
          {servicesData.items.length > 0 && (
            <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Υπηρεσίες & Τιμές</h2>
              <div className="divide-y divide-gray-100">
                {servicesData.items.map((service) => (
                  <div key={service.id} className="flex items-center justify-between py-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{service.name}</p>
                      {service.description && (
                        <p className="text-sm text-gray-500 mt-0.5">{service.description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">{service.duration_minutes} λεπτά</p>
                    </div>
                    <div className="ml-4 text-right flex-shrink-0">
                      <span className="text-lg font-semibold text-teal-600">{service.price}€</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Working hours */}
          {vet.working_hours && (
            <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Ωράριο Λειτουργίας</h2>
              <div className="divide-y divide-gray-100">
                {DAYS.map((day) => {
                  const hours = vet.working_hours?.[day];
                  const isToday =
                    new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() ===
                    day;
                  return (
                    <div
                      key={day}
                      className={`flex justify-between py-2.5 text-sm ${
                        isToday ? 'font-semibold text-teal-700' : 'text-gray-700'
                      }`}
                    >
                      <span>{DAY_LABELS[day]}</span>
                      <span
                        className={
                          hours?.closed
                            ? 'text-gray-400'
                            : 'text-gray-800'
                        }
                      >
                        {hours?.closed
                          ? 'Κλειστά'
                          : (() => {
                              const parts: string[] = [];
                              if (hours?.morning?.open && hours?.morning?.close) parts.push(`${hours.morning.open} - ${hours.morning.close}`);
                              if (hours?.afternoon?.open && hours?.afternoon?.close) parts.push(`${hours.afternoon.open} - ${hours.afternoon.close}`);
                              return parts.length > 0 ? parts.join(', ') : '-';
                            })()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Reviews */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Κριτικές
              {reviewsData.total > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({reviewsData.total})
                </span>
              )}
            </h2>

            {reviewsData.items.length === 0 ? (
              <p className="text-gray-500 text-sm py-4 text-center">
                Δεν υπάρχουν κριτικές ακόμα
              </p>
            ) : (
              <div className="space-y-5">
                {reviewsData.items.map((review) => (
                  <div key={review.id} className="border-b border-gray-100 last:border-0 pb-5 last:pb-0">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{review.owner_name}</p>
                        <p className="text-xs text-gray-400">{formatDate(review.created_at)}</p>
                      </div>
                      <StarRating rating={review.rating} size="sm" />
                    </div>
                    {review.comment && (
                      <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Review pagination */}
            {totalReviewPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                {reviewPage > 1 && (
                  <Link
                    href={buildReviewPageUrl(reviewPage - 1)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    ← Προηγούμενες
                  </Link>
                )}
                <span className="text-sm text-gray-500">
                  Σελίδα {reviewPage} από {totalReviewPages}
                </span>
                {reviewPage < totalReviewPages && (
                  <Link
                    href={buildReviewPageUrl(reviewPage + 1)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Επόμενες →
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
