import { useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { request } from './api';
import { ui } from './mobileTheme';
import { a, AccountButton as Button, Notice } from './AccountUI';
import { reviewPayload, starLabel } from './reviewForm.mjs';

/** Write or change the one review an owner can leave per vet, after a completed visit. */
export default function ReviewEditor({ vet, appointmentId, review, token, onClose, onSaved }) {
  const [rating, setRating] = useState(review?.rating || 0);
  const [comment, setComment] = useState(review?.comment || '');
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const lock = useRef(false);

  async function save(remove = false) {
    if (lock.current) return;
    setError('');
    let body;
    if (!remove) { try { body = reviewPayload(rating, comment); } catch (e) { setError(e.message); return; } }
    lock.current = true; setBusy(true);
    try {
      if (remove) await request(`/owner/reviews/${review.id}`, token, undefined, 'DELETE');
      else if (review) await request(`/owner/reviews/${review.id}`, token, body, 'PUT');
      else await request('/owner/reviews', token, { ...body, vet_id: vet.id, appointment_id: appointmentId || null });
      onSaved(remove ? 'Η αξιολόγηση διαγράφηκε.' : review ? 'Η αξιολόγηση ενημερώθηκε.' : 'Ευχαριστούμε! Η αξιολόγησή σου δημοσιεύτηκε.');
    } catch (e) { setError(e.message); }
    finally { lock.current = false; setBusy(false); }
  }

  return <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={() => { if (!lock.current) onClose(); }}><SafeAreaView style={{ flex: 1, backgroundColor: ui.background }}>
    <View style={ui.header}><Text style={{ ...ui.title, fontSize: 20, flex: 1 }}>{review ? 'Η αξιολόγησή σου' : 'Αξιολόγηση'}</Text><Button secondary title="Κλείσιμο" disabled={busy} onPress={onClose}/></View>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 18, paddingBottom: 40, gap: 18, maxWidth: 620, width: '100%', alignSelf: 'center' }}>
      <Notice text={error} error/>
      <View style={a.card}>
        <Text style={a.label}>Πώς ήταν η επίσκεψη στον/στην</Text>
        <Text style={a.title}>{vet.name}</Text>
        <View accessibilityRole="radiogroup" accessibilityLabel="Βαθμολογία" style={{ flexDirection: 'row', gap: 6 }}>
          {[1, 2, 3, 4, 5].map(value => <Pressable key={value} accessibilityRole="radio" accessibilityLabel={starLabel(value)} accessibilityState={{ checked: rating === value, disabled: busy }} disabled={busy} onPress={() => setRating(value)} hitSlop={6} style={{ padding: 4 }}>
            <Text style={{ fontSize: 36, color: value <= rating ? '#E8A317' : '#D9D9D9' }}>★</Text>
          </Pressable>)}
        </View>
        {rating > 0 && <Text style={a.body}>{starLabel(rating)}</Text>}
      </View>
      <View style={a.card}>
        <Text style={a.label}>Σχόλιο</Text>
        <TextInput accessibilityLabel="Σχόλιο" value={comment} onChangeText={setComment} editable={!busy} multiline maxLength={2000} placeholder="Τι σου άρεσε; Τι θα μπορούσε να γίνει καλύτερα;" placeholderTextColor={ui.muted} style={[ui.input, { minHeight: 120, textAlignVertical: 'top' }]}/>
        <Text style={a.body}>Η αξιολόγηση φαίνεται στο προφίλ του κτηνιάτρου με το όνομά σου. Ο κτηνίατρος μπορεί να απαντήσει.</Text>
      </View>
      {review?.reply && <View style={a.card}><Text style={a.label}>Απάντηση κτηνιάτρου</Text><Text style={a.body}>{review.reply}</Text></View>}
      <Button title={busy ? 'Αποθήκευση…' : review ? 'Αποθήκευση αλλαγών' : 'Δημοσίευση αξιολόγησης'} disabled={busy} onPress={() => save()}/>
      {review && <Button secondary title="Διαγραφή αξιολόγησης" disabled={busy} onPress={() => save(true)}/>}
    </ScrollView>
  </SafeAreaView></Modal>;
}
