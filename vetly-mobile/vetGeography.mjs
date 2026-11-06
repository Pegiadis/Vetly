export function coordinates(vet) {
  const parse = value => typeof value === 'number' ? value : typeof value === 'string' && /^[-+]?\d+(\.\d+)?$/.test(value.trim()) ? Number(value) : NaN;
  const latitude = parse(vet.coordinates_lat), longitude = parse(vet.coordinates_lng);
  return Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180 ? {latitude, longitude} : null;
}

export function distanceKm(a, b) {
  const rad = value => value * Math.PI / 180;
  const dLat = rad(b.latitude - a.latitude), dLon = rad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, h)));
}

export function nearbyVets(vets, location, radius = null) {
  const results = vets.map(vet => {
    const point = coordinates(vet);
    return {...vet, point, distance: location && point ? distanceKm(location, point) : null};
  });
  return results.filter(vet => !location || radius == null || (vet.distance != null && vet.distance <= radius))
    .sort((a, b) => location ? (a.distance ?? Infinity) - (b.distance ?? Infinity) : 0);
}

export function distanceLabel(value) {
  return value == null ? 'Άγνωστη απόσταση' : value < 1 ? `${Math.round(value * 1000)} μ.` : `${value.toFixed(1)} χλμ.`;
}
