export const eventTypes = {
  Vaccination: 'Εμβολιασμός', Checkup: 'Εξέταση', Surgery: 'Χειρουργείο',
  Dental: 'Οδοντιατρικά', Emergency: 'Επείγον', 'Lab Test': 'Εργαστηριακές εξετάσεις',
  'X-Ray': 'Ακτινογραφία', Medication: 'Φαρμακευτική αγωγή',
};
// Calendar dates from the API must never shift with the device timezone.
export function medicalDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}/.test(value || '')) return 'Δεν έχει καταχωριστεί ημερομηνία';
  const [year, month, day] = value.slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
}
export async function fetchMedicalHistory({ request, token, petIds, page, type, pageSize = 10 }) {
  if (!petIds.length) return { items: [], total: 0, pages: 1 };
  const query = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (type) query.set('event_type', type);
  const results = await Promise.all(petIds.map(id => request(`/owner/pets/${encodeURIComponent(id)}/medical-history?${query}`, token)));
  return {
    items: results.flatMap(r => r.items).sort((a,b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id)),
    total: results.reduce((total,r) => total+r.total,0),
    // Match web pagination: up to ten records per pet on each page.
    pages: Math.max(1,...results.map(r => Math.ceil(r.total/pageSize))),
  };
}
