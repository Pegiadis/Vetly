export function normalizedSearch(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('el-GR').replace(/ς/g,'σ').trim();
}
export function filterOnCallVets(vets, search, city) {
  const query = normalizedSearch(search);
  return vets.filter(v => (!city || v.city === city) && normalizedSearch([v.name,v.city,v.address,v.specialty].filter(Boolean).join(' ')).includes(query));
}
export function phoneUrl(value) {
  const raw = String(value || '').trim();
  if (!/^\+?[\d\s().-]+$/.test(raw)) return null;
  const number = raw.replace(/[\s().-]/g,'').replace(/^00/,'+');
  return /^\+?\d{7,15}$/.test(number) ? `tel:${number}` : null;
}
export function mapDestination(vet) {
  // The API serializes database decimals as strings. Empty values must not become zero.
  const coordinate = value => typeof value === 'number' ? value : typeof value === 'string' && /^[-+]?\d+(\.\d+)?$/.test(value.trim()) ? Number(value) : NaN;
  const lat = coordinate(vet.coordinates_lat), lng = coordinate(vet.coordinates_lng);
  if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat)<=90 && Math.abs(lng)<=180) return `${lat},${lng}`;
  // A city alone is not a sufficiently precise clinic destination.
  return vet.address?.trim() ? [vet.address.trim(),vet.city?.trim()].filter(Boolean).join(', ') : null;
}
export function directionsUrl(vet, platform) {
  const destination = mapDestination(vet);
  if (!destination) return null;
  return platform==='ios' ? `https://maps.apple.com/?daddr=${encodeURIComponent(destination)}&dirflg=d` : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving`;
}
