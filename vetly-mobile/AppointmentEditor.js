import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { request } from './api';
import { ui } from './mobileTheme';
import { a, AccountButton as Button, Notice } from './AccountUI';
import { appointmentDate, appointmentPermissions, athensNow, bookingLimit, calendarMonth, reschedulePayload, shiftMonth, slotPath } from './appointmentActions.mjs';

export default function AppointmentEditor({ appointment, mode, token, onClose, onSaved }) {
  const today = athensNow().slice(0, 10), maxDay = bookingLimit(today);
  const initialDay = appointment.scheduled_at.slice(0, 10);
  const [day, setDay] = useState(initialDay >= today && initialDay <= maxDay ? initialDay : today);
  const [month, setMonth] = useState(day.slice(0, 7)), [time, setTime] = useState(null);
  const [availability, setAvailability] = useState(null), [loading, setLoading] = useState(false), [slotsError, setSlotsError] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [retry, setRetry] = useState(0);
  const lock = useRef(false), scroll = useRef(null);
  const slots = availability?.day === day ? availability.slots : [];
  useEffect(() => { scroll.current?.scrollTo({ y: 0, animated: false }); }, [error]);
  useEffect(() => {
    if (mode !== 'reschedule') return;
    let active = true;
    setLoading(true); setSlotsError(''); setAvailability(null); setTime(null);
    request(slotPath(appointment, day), token).then(data => { if (active) setAvailability({ day, slots: data.slots }); }).catch(e => { if (active) setSlotsError(e.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [appointment.id, day, retry, token, mode]);
  function chooseDay(value) { if (!lock.current) { setDay(value); setTime(null); setAvailability(null); setError(''); } }
  async function submit() {
    if (lock.current) return;
    const allowed = appointmentPermissions(appointment);
    if (!allowed[mode]) { setError(mode === 'cancel' ? 'Η ακύρωση επιτρέπεται μέχρι 2 ώρες πριν. Επικοινώνησε με το κτηνιατρείο.' : 'Το ραντεβού δεν μπορεί πλέον να αλλάξει. Ανανέωσε τη λίστα.'); return; }
    let body;
    if (mode === 'reschedule') {
      try { body = reschedulePayload(appointment, day, time, slots); } catch (e) { setError(e.message); return; }
    }
    lock.current = true; setBusy(true); setError('');
    try {
      if (mode === 'reschedule') {
        const fresh = await request(slotPath(appointment, day), token);
        if (!fresh.slots.includes(time)) {
          setAvailability({ day, slots: fresh.slots }); setTime(null);
          throw new Error('Η ώρα μόλις δεσμεύτηκε. Επίλεξε άλλη διαθέσιμη ώρα.');
        }
      }
      const record = await request(`/owner/appointments/${appointment.id}/${mode}`, token, mode === 'cancel' ? {} : body, mode === 'cancel' ? 'POST' : 'PATCH');
      onSaved(record);
    } catch (e) {
      setError(e.message);
      if (e.status === 409 && mode === 'reschedule') { setTime(null); setAvailability(null); setRetry(value => value + 1); }
    } finally { lock.current = false; setBusy(false); }
  }
  const unchanged = `${day}T${time}:00` === appointment.scheduled_at.slice(0, 19);
  return <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={() => { if (!lock.current) onClose(); }}><SafeAreaView style={{ flex: 1, backgroundColor: ui.background }}>
    <View style={ui.header}><Text style={{ ...ui.title, fontSize: 20, flex: 1 }}>{mode === 'cancel' ? 'Ακύρωση ραντεβού' : 'Αλλαγή ραντεβού'}</Text><Button secondary title="Κλείσιμο" disabled={busy} onPress={onClose}/></View>
    <ScrollView ref={scroll} contentContainerStyle={{ padding: 18, paddingBottom: 40, gap: 18, maxWidth: 620, width: '100%', alignSelf: 'center' }}>
      <Notice text={error} error/>
      <View style={a.card}><Text style={a.title}>{appointment.pet?.name || 'Κατοικίδιο'}</Text><Text style={a.label}>{appointment.type}</Text><Text style={a.body}>{appointment.vet?.name}</Text><Text style={a.label}>{appointmentDate(appointment.scheduled_at)}</Text><Text style={a.body}>{appointment.duration_minutes || 30} λεπτά · Ώρα Ελλάδας</Text>{appointment.group_id && <Text style={a.body}>Η αλλαγή αφορά μόνο αυτό το κατοικίδιο, όχι τα υπόλοιπα της κοινής κράτησης.</Text>}</View>
      {mode === 'cancel' ? <View style={a.card}><Text style={a.title}>Να ακυρωθεί η επίσκεψη;</Text><Text style={a.body}>Ο κτηνίατρος θα ενημερωθεί και η ώρα θα ελευθερωθεί. Για νέα επίσκεψη θα χρειαστεί νέα κράτηση.</Text><Text style={a.body}>Η ακύρωση επιτρέπεται μέχρι 2 ώρες πριν από το ραντεβού.</Text></View> : <>
        <View style={a.card}><Text style={a.label}>Νέα ημέρα</Text><View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <Button secondary title="‹" disabled={busy || month <= today.slice(0, 7)} onPress={() => setMonth(shiftMonth(month, -1))}/><Text style={{ ...a.label, flex: 1, textAlign: 'center' }}>{new Date(`${month}-01T12:00:00Z`).toLocaleDateString('el-GR', { month: 'long', year: 'numeric', timeZone: 'UTC' })}</Text><Button secondary title="›" disabled={busy || month >= maxDay.slice(0, 7)} onPress={() => setMonth(shiftMonth(month, 1))}/>
        </View><View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {['Δ', 'Τ', 'Τ', 'Π', 'Π', 'Σ', 'Κ'].map((value, i) => <Text key={`week${i}`} style={{ width: '14.2857%', textAlign: 'center', paddingVertical: 8, color: ui.muted }}>{value}</Text>)}
          {calendarMonth(month).map((value, i) => value ? <Pressable key={value} accessibilityRole="button" accessibilityLabel={`Ημερομηνία ${value}`} accessibilityState={{ selected: day === value, disabled: busy || value < today || value > maxDay }} disabled={busy || value < today || value > maxDay} onPress={() => chooseDay(value)} style={{ width: '14.2857%', minHeight: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: day === value ? ui.accentSoft : 'transparent', opacity: value < today || value > maxDay ? .25 : 1 }}><Text>{Number(value.slice(8))}</Text></Pressable> : <View key={`blank${i}`} style={{ width: '14.2857%' }}/>)}</View>
          <Text style={a.label}>Ώρες για {day.split('-').reverse().join('/')}</Text><Text style={a.body}>Οι ώρες εμφανίζονται σε ώρα Ελλάδας.</Text>
          {loading ? <ActivityIndicator color={ui.brand}/> : slotsError ? <><Notice text={slotsError} error/><Button secondary title="Επανάληψη φόρτωσης ωρών" disabled={busy} onPress={() => setRetry(value => value + 1)}/></> : <><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{slots.map(value => <Pressable key={value} accessibilityRole="button" accessibilityLabel={`Ώρα ${value}`} accessibilityState={{ selected: time === value, disabled: busy }} disabled={busy} onPress={() => { setTime(value); setError(''); }} style={[ui.button, time === value && { backgroundColor: ui.accentSoft }]}><Text>{value}</Text></Pressable>)}</View>{availability && !slots.length && <Text style={a.body}>Δεν υπάρχουν διαθέσιμες ώρες. Επίλεξε άλλη ημέρα.</Text>}</>}
        </View>
        <Notice text="Με την αλλαγή, το ραντεβού θα περιμένει ξανά επιβεβαίωση από τον κτηνίατρο."/>
        {time && <Text style={a.label}>Νέα επίσκεψη: {appointmentDate(`${day}T${time}:00`)}</Text>}
      </>}
      <Button title={busy ? 'Αποθήκευση…' : mode === 'cancel' ? 'Ναι, ακύρωση ραντεβού' : 'Επιβεβαίωση αλλαγής'} danger={mode === 'cancel'} disabled={busy || (mode === 'reschedule' && (loading || !!slotsError || !time || !slots.includes(time) || unchanged))} onPress={submit}/>
      <Button secondary title={mode === 'cancel' ? 'Διατήρηση ραντεβού' : 'Επιστροφή χωρίς αλλαγή'} disabled={busy} onPress={onClose}/>
    </ScrollView>
  </SafeAreaView></Modal>;
}
