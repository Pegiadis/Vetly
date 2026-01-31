import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Vet } from '@/types/vet';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getVet(id: string): Promise<Vet | null> {
  const res = await fetch(`${API_URL}/vets/${id}`, {
    cache: 'no-store',
  });

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    throw new Error('Failed to fetch vet');
  }

  return res.json();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const vet = await getVet(id);

  if (!vet) {
    return { title: 'Vet not found | Vetly' };
  }

  return {
    title: `${vet.name} | Vetly`,
    description: vet.description || `${vet.specialty} in ${vet.city}`,
  };
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS: Record<string, string> = {
  monday: 'Δευτέρα',
  tuesday: 'Τρίτη',
  wednesday: 'Τετάρτη',
  thursday: 'Πέμπτη',
  friday: 'Παρασκευή',
  saturday: 'Σάββατο',
  sunday: 'Κυριακή',
};

export default async function VetDetailPage({ params }: PageProps) {
  const { id } = await params;
  const vet = await getVet(id);

  if (!vet) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link
          href="/vets"
          className="inline-flex items-center text-emerald-600 hover:text-emerald-700 mb-6"
        >
          ← Πίσω στους κτηνιάτρους
        </Link>

        {/* Profile card */}
        <div className="bg-white rounded-2xl shadow-md p-8">
          {/* Header */}
          <div className="flex gap-6 mb-6">
            {vet.image_url ? (
              <img
                src={vet.image_url}
                alt={vet.name}
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center">
                <span className="text-emerald-600 text-3xl font-semibold">
                  {vet.name.charAt(0)}
                </span>
              </div>
            )}

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">{vet.name}</h1>
                {vet.is_verified && (
                  <span className="text-emerald-500 text-xl" title="Verified">
                    ✓
                  </span>
                )}
              </div>
              <p className="text-lg text-gray-600">{vet.specialty}</p>
              <p className="text-gray-500">{vet.city}</p>

              {/* Rating */}
              <div className="flex items-center gap-1 mt-2">
                <span className="text-yellow-400 text-lg">★</span>
                <span className="font-medium text-gray-700">
                  {Number(vet.rating_average).toFixed(1)}
                </span>
                <span className="text-gray-500">({vet.reviews_count} κριτικές)</span>
              </div>
            </div>
          </div>

          {/* Description */}
          {vet.description && (
            <div className="mb-6">
              <h2 className="font-semibold text-gray-900 mb-2">Σχετικά</h2>
              <p className="text-gray-600">{vet.description}</p>
            </div>
          )}

          {/* Contact info */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <h2 className="font-semibold text-gray-900 mb-2">Επικοινωνία</h2>
              <div className="space-y-2 text-gray-600">
                <p>📞 {vet.phone}</p>
                <p>📧 {vet.email}</p>
                <p>📍 {vet.address}</p>
              </div>
            </div>

            {/* Working hours */}
            {vet.hours && (
              <div>
                <h2 className="font-semibold text-gray-900 mb-2">Ωράριο</h2>
                <div className="space-y-1 text-sm text-gray-600">
                  {DAYS.map((day) => {
                    const hours = vet.hours?.[day];
                    return (
                      <div key={day} className="flex justify-between">
                        <span>{DAY_LABELS[day]}</span>
                        <span>
                          {hours?.closed
                            ? 'Κλειστά'
                            : hours?.open && hours?.close
                            ? `${hours.open} - ${hours.close}`
                            : '-'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Badges */}
          <div className="flex gap-2">
            {vet.is_on_call && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                🟢 Εφημερία
              </span>
            )}
            {vet.is_verified && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                ✓ Επιβεβαιωμένος
              </span>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
