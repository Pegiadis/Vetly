import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { DayHours, PublicVetDetail, PublicReviewListResponse } from '@/types/vet';
import { getImageUrl } from '@/lib/api';
import BookCta from './BookCta';

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

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex text-sm leading-none" aria-label={`${rating} από 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} aria-hidden="true" className={i < Math.round(rating) ? 'text-amber-500' : 'text-ink-300'}>
          ★
        </span>
      ))}
    </span>
  );
}

function Section({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-ink-200 bg-white">
      <h2 className="border-b border-ink-200 px-4 py-3 text-sm font-semibold tracking-tight text-ink-900 sm:px-5">
        {title}
        {count ? <span className="ml-2 font-normal text-ink-500">({count})</span> : null}
      </h2>
      <div className="px-4 py-4 sm:px-5">{children}</div>
    </section>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('el-GR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatHours(hours: DayHours | undefined) {
  if (!hours) return '-';
  if (hours.closed) return 'Κλειστά';
  const parts: string[] = [];
  if (hours.morning?.open && hours.morning?.close) parts.push(`${hours.morning.open} - ${hours.morning.close}`);
  if (hours.afternoon?.open && hours.afternoon?.close) parts.push(`${hours.afternoon.open} - ${hours.afternoon.close}`);
  return parts.length > 0 ? parts.join(', ') : '-';
}

export default async function VetDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { review_page } = await searchParams;
  const reviewPage = review_page ? parseInt(review_page, 10) || 1 : 1;

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
  const todayKey = new Date()
    .toLocaleDateString('en-US', { weekday: 'long', timeZone: 'Europe/Athens' })
    .toLowerCase();

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

  const pageLink =
    'rounded-[10px] bg-black/[0.06] px-3 py-1.5 text-[13px] font-medium text-ink-900 hover:bg-black/10';

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Navbar />
      <main className="min-h-screen bg-ink-50 pt-16">
        <div className="mx-auto max-w-4xl space-y-4 px-4 py-6 sm:px-6">
          {/* Header */}
          <header className="rounded-xl border border-ink-200 bg-white p-4 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt={vet.name}
                  className="h-20 w-20 shrink-0 rounded-full border border-ink-200 object-cover sm:h-24 sm:w-24"
                />
              ) : (
                <div
                  aria-hidden="true"
                  className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-clinic-100 text-3xl font-semibold text-clinic-800 sm:h-24 sm:w-24"
                >
                  {vet.name.charAt(0)}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="break-words text-2xl font-semibold tracking-tight text-ink-900">{vet.name}</h1>
                  {vet.is_on_call && (
                    <span className="inline-flex h-5 items-center rounded-full bg-clinic-100 px-2 text-xs font-medium text-clinic-800">
                      Σε εφημερία
                    </span>
                  )}
                </div>
                {vet.specialty && <p className="mt-1 text-sm font-medium text-clinic-700">{vet.specialty}</p>}
                {vet.city && <p className="mt-0.5 text-sm text-ink-500">{vet.city}</p>}
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                  {vet.reviews_count > 0 ? (
                    <>
                      <Stars rating={vet.rating_average} />
                      <span className="font-semibold text-ink-900">{Number(vet.rating_average).toFixed(1)}</span>
                      <span className="text-ink-500">({vet.reviews_count} κριτικές)</span>
                    </>
                  ) : (
                    <span className="text-ink-500">Δεν υπάρχουν κριτικές ακόμα</span>
                  )}
                </div>
              </div>

              <div className="hidden shrink-0 sm:block">
                <BookCta vetId={vet.id} />
              </div>
            </div>
          </header>

          {vet.description && (
            <Section title="Σχετικά">
              <p className="whitespace-pre-line break-words text-sm leading-6 text-ink-700">{vet.description}</p>
            </Section>
          )}

          {servicesData.items.length > 0 && (
            <Section title="Υπηρεσίες και τιμές">
              <ul className="-my-4 divide-y divide-ink-200">
                {servicesData.items.map((service) => (
                  <li key={service.id} className="flex items-start justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <p className="break-words text-sm font-medium text-ink-900">{service.name}</p>
                      {service.description && (
                        <p className="mt-0.5 break-words text-xs leading-5 text-ink-500">{service.description}</p>
                      )}
                      <p className="mt-0.5 text-xs text-ink-500">{service.duration_minutes} λεπτά</p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-clinic-800">
                      {Number(service.price).toFixed(2)} €
                    </span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {vet.working_hours && (
              <Section title="Ωράριο λειτουργίας">
                <dl className="-my-2 divide-y divide-ink-100">
                  {DAYS.map((day) => (
                    <div
                      key={day}
                      className={`flex justify-between gap-3 py-2 text-sm ${
                        todayKey === day ? 'font-semibold text-clinic-800' : 'text-ink-700'
                      }`}
                    >
                      <dt>{DAY_LABELS[day]}</dt>
                      <dd className={vet.working_hours?.[day]?.closed ? 'text-ink-400' : ''}>
                        {formatHours(vet.working_hours?.[day])}
                      </dd>
                    </div>
                  ))}
                </dl>
              </Section>
            )}

            <Section title="Διεύθυνση και επικοινωνία">
              <div className="space-y-3 text-sm text-ink-700">
                {vet.address && (
                  <p className="break-words">
                    {vet.address}
                    {vet.city ? `, ${vet.city}` : ''}
                  </p>
                )}
                {vet.phone && (
                  <p>
                    <a href={`tel:${vet.phone}`} className="font-medium text-clinic-700 underline-offset-4 hover:underline">
                      {vet.phone}
                    </a>
                  </p>
                )}
                {vet.coordinates_lat != null && vet.coordinates_lng != null && (
                  <p>
                    <a
                      href={`https://www.google.com/maps?q=${vet.coordinates_lat},${vet.coordinates_lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-clinic-700 underline-offset-4 hover:underline"
                    >
                      Δείτε στον χάρτη
                    </a>
                  </p>
                )}
                {!vet.address && !vet.phone && <p className="text-ink-500">Δεν υπάρχουν στοιχεία επικοινωνίας.</p>}
              </div>
            </Section>
          </div>

          <Section title="Κριτικές" count={reviewsData.total}>
            {reviewsData.items.length === 0 ? (
              <p className="py-2 text-center text-sm text-ink-500">Δεν υπάρχουν κριτικές ακόμα</p>
            ) : (
              <ul className="-my-4 divide-y divide-ink-200">
                {reviewsData.items.map((review) => (
                  <li key={review.id} className="py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-words text-sm font-medium text-ink-900">{review.owner_name}</p>
                        <p className="text-xs text-ink-500">{formatDate(review.created_at)}</p>
                      </div>
                      <Stars rating={review.rating} />
                    </div>
                    {review.comment && (
                      <p className="mt-2 break-words text-sm leading-6 text-ink-700">{review.comment}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {totalReviewPages > 1 && (
              <nav aria-label="Σελίδες κριτικών" className="mt-5 flex flex-wrap items-center justify-center gap-2">
                {reviewPage > 1 && (
                  <Link href={buildReviewPageUrl(reviewPage - 1)} className={pageLink}>
                    Προηγούμενες
                  </Link>
                )}
                <span className="text-xs text-ink-500">
                  Σελίδα {reviewPage} από {totalReviewPages}
                </span>
                {reviewPage < totalReviewPages && (
                  <Link href={buildReviewPageUrl(reviewPage + 1)} className={pageLink}>
                    Επόμενες
                  </Link>
                )}
              </nav>
            )}
          </Section>
        </div>
      </main>

      {/* Sticky booking bar on phones */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-200 bg-white px-4 py-3 sm:hidden">
        <BookCta vetId={vet.id} />
      </div>

      <Footer />
      <div aria-hidden="true" className="h-16 bg-ink-50 sm:hidden" />
    </>
  );
}
