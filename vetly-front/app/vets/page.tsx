import { Metadata } from 'next';
import Link from 'next/link';
import PublicVetCard from '@/components/PublicVetCard';
import { PublicVetListResponse } from '@/types/vet';

export const metadata: Metadata = {
  title: 'Κτηνίατροι | Vetly - Βρείτε τον κτηνίατρό σας',
  description:
    'Βρείτε κτηνιάτρους κοντά σας. Δείτε αξιολογήσεις, ωράρια και κλείστε ραντεβού online.',
};

const API_URL =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:8000/api/v1';

interface SearchParams {
  page?: string;
  search?: string;
  city?: string;
  specialty?: string;
}

async function getPublicVets(params: SearchParams): Promise<PublicVetListResponse> {
  const page = params.page ? parseInt(params.page, 10) : 1;
  const query = new URLSearchParams({
    page: String(page),
    page_size: '12',
    ...(params.search ? { search: params.search } : {}),
    ...(params.city ? { city: params.city } : {}),
    ...(params.specialty ? { specialty: params.specialty } : {}),
  });

  const res = await fetch(`${API_URL}/public/vets?${query.toString()}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    return { items: [], total: 0, page: 1, page_size: 12 };
  }

  return res.json();
}

interface PageProps {
  searchParams: Promise<SearchParams>;
}

export default async function VetsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const data = await getPublicVets(params);

  const currentPage = params.page ? parseInt(params.page, 10) : 1;
  const totalPages = Math.ceil(data.total / data.page_size);

  function buildPageUrl(page: number) {
    const qs = new URLSearchParams({
      ...(params.search ? { search: params.search } : {}),
      ...(params.city ? { city: params.city } : {}),
      ...(params.specialty ? { specialty: params.specialty } : {}),
      page: String(page),
    });
    return `/vets?${qs.toString()}`;
  }

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

        {/* Search & Filters */}
        <form method="GET" action="/vets" className="bg-white rounded-2xl shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="search" className="block text-xs font-medium text-gray-500 mb-1">
                Αναζήτηση
              </label>
              <input
                id="search"
                name="search"
                type="text"
                defaultValue={params.search ?? ''}
                placeholder="Όνομα ή ειδικότητα…"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label htmlFor="city" className="block text-xs font-medium text-gray-500 mb-1">
                Πόλη
              </label>
              <input
                id="city"
                name="city"
                type="text"
                defaultValue={params.city ?? ''}
                placeholder="π.χ. Αθήνα"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label htmlFor="specialty" className="block text-xs font-medium text-gray-500 mb-1">
                Ειδικότητα
              </label>
              <input
                id="specialty"
                name="specialty"
                type="text"
                defaultValue={params.specialty ?? ''}
                placeholder="π.χ. Χειρουργική"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
          <div className="flex items-center justify-between mt-3">
            <button
              type="submit"
              className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Αναζήτηση
            </button>
            {(params.search || params.city || params.specialty) && (
              <Link
                href="/vets"
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Καθαρισμός φίλτρων
              </Link>
            )}
          </div>
        </form>

        {/* Results count */}
        <p className="text-sm text-gray-500 mb-4">
          {data.total === 0
            ? 'Δεν βρέθηκαν κτηνίατροι'
            : `${data.total} κτηνίατροι`}
        </p>

        {/* Vet grid */}
        {data.items.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-4xl mb-4">🔍</p>
            <p className="text-gray-600 text-lg font-medium">Δεν βρέθηκαν κτηνίατροι</p>
            <p className="text-gray-500 text-sm mt-1">
              Δοκιμάστε διαφορετικά φίλτρα αναζήτησης
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.items.map((vet) => (
              <PublicVetCard key={vet.id} vet={vet} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            {currentPage > 1 && (
              <Link
                href={buildPageUrl(currentPage - 1)}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                ← Προηγούμενη
              </Link>
            )}

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (p) =>
                    p === 1 ||
                    p === totalPages ||
                    Math.abs(p - currentPage) <= 2
                )
                .reduce<(number | string)[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1) {
                    acc.push('...');
                  }
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, idx) =>
                  p === '...' ? (
                    <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">
                      …
                    </span>
                  ) : (
                    <Link
                      key={p}
                      href={buildPageUrl(p as number)}
                      className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm transition-colors ${
                        p === currentPage
                          ? 'bg-teal-600 text-white font-medium'
                          : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {p}
                    </Link>
                  )
                )}
            </div>

            {currentPage < totalPages && (
              <Link
                href={buildPageUrl(currentPage + 1)}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Επόμενη →
              </Link>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
