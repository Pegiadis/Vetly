const LABELS = { 1: 'Κακή', 2: 'Μέτρια', 3: 'Καλή', 4: 'Πολύ καλή', 5: 'Εξαιρετική' };

export function starLabel(value) {
  return `${value} ${value === 1 ? 'αστέρι' : 'αστέρια'} · ${LABELS[value]}`;
}

/** Validates the form the same way the API does (rating 1–5, comment 1–2000 characters). */
export function reviewPayload(rating, comment) {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error('Διάλεξε βαθμολογία από 1 έως 5 αστέρια.');
  const text = comment.trim();
  if (!text) throw new Error('Γράψε ένα σύντομο σχόλιο.');
  if (text.length > 2000) throw new Error('Το σχόλιο μπορεί να έχει έως 2.000 χαρακτήρες.');
  return { rating, comment: text };
}

/** The owner's own reviews keyed by vet, so each completed visit knows whether its vet is already reviewed. */
export function reviewsByVet(items = []) {
  return Object.fromEntries(items.map(review => [review.vet_id, review]));
}

/** The latest completed visit per vet: the only one that shows the review button, since an owner reviews a vet once. */
export function reviewableVisitIds(appointments = []) {
  const latest = {};
  for (const visit of appointments) {
    if (visit.status !== 'completed' || !visit.vet_id) continue;
    const current = latest[visit.vet_id];
    if (!current || visit.scheduled_at > current.scheduled_at) latest[visit.vet_id] = visit;
  }
  return new Set(Object.values(latest).map(visit => visit.id));
}
