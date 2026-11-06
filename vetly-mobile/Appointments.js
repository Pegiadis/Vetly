import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { request } from './api';
import { ui } from './mobileTheme';
import { a, AccountButton as Button, Notice } from './AccountUI';
import { appointmentDate, appointmentPermissions, appointmentStatuses } from './appointmentActions.mjs';
import AppointmentEditor from './AppointmentEditor';

export default function Appointments({ token, upcoming, ready, refreshSignal, onChanged }) {
  const [all, setAll] = useState(false), [page, setPage] = useState(1), [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false), [error, setError] = useState(''), [retry, setRetry] = useState(0);
  const [editor, setEditor] = useState(null), [message, setMessage] = useState('');
  useEffect(() => {
    if (!all) return;
    let active = true;
    setLoading(true); setError(''); setResult(null);
    request(`/owner/appointments?page=${page}&page_size=20`, token).then(data => { if (active) setResult(data); }).catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token, all, page, retry, refreshSignal]);
  function saved(record) {
    setEditor(null);
    setMessage(record.status === 'cancelled' ? 'Το ραντεβού ακυρώθηκε. Θα το βρεις στα «Όλα». Ο κτηνίατρος ενημερώνεται για την ακύρωση.' : 'Η ημέρα και η ώρα άλλαξαν. Αναμένεις νέα επιβεβαίωση από τον κτηνίατρο.');
    setResult(old => old && ({ ...old, items: old.items.map(item => item.id === record.id ? record : item) }));
    onChanged(record); setRetry(value => value + 1);
  }
  const items = all ? result?.items || [] : upcoming;
  return <View style={{ gap: 16 }}>
    {editor && <AppointmentEditor appointment={editor.appointment} mode={editor.mode} token={token} onClose={() => setEditor(null)} onSaved={saved}/>}
    <Text style={a.title}>Τα ραντεβού σου</Text>
    <View style={{ flexDirection: 'row', gap: 8 }}><Button secondary={all} title="Επερχόμενα" onPress={() => setAll(false)}/><Button secondary={!all} title="Όλα" onPress={() => { setPage(1); setAll(true); }}/></View>
    <Notice text={message}/><Notice text={error} error/>
    {error && <Button secondary title="Επανάληψη φόρτωσης" onPress={() => setRetry(value => value + 1)}/>}
    {(all ? loading : !ready) && <ActivityIndicator color={ui.brand}/>}
    {items.map(appointment => {
      const allowed = appointmentPermissions(appointment);
      return <View key={appointment.id} style={a.card}>
        <Text style={a.label}>{appointmentDate(appointment.scheduled_at)} · Ώρα Ελλάδας</Text>
        <Text style={{ ...a.title, fontSize: 20 }}>{appointment.pet?.name} · {appointment.type}</Text>
        <Text style={a.body}>{appointment.vet?.name}</Text>
        <Text style={{ color: appointment.status === 'confirmed' ? ui.green : appointment.status === 'cancelled' ? '#a32929' : ui.brand, fontWeight: '600' }}>{appointmentStatuses[appointment.status] || appointment.status}</Text>
        {allowed.reschedule && <><Button secondary title="Αλλαγή ημέρας / ώρας" onPress={() => setEditor({ appointment, mode: 'reschedule' })}/><Button secondary title="Ακύρωση ραντεβού" disabled={!allowed.cancel} onPress={() => setEditor({ appointment, mode: 'cancel' })}/>{!allowed.cancel && <Text style={a.body}>Απομένουν λιγότερες από 2 ώρες. Για ακύρωση επικοινώνησε με το κτηνιατρείο.</Text>}</>}
      </View>;
    })}
    {(all ? result && !loading : ready) && !error && !items.length && <Text style={a.body}>{all ? 'Δεν υπάρχουν καταχωρημένα ραντεβού.' : 'Δεν έχεις επερχόμενα ραντεβού.'}</Text>}
    {all && result && result.total > 20 && <View style={{ gap: 10 }}><Text style={a.body}>Σελίδα {page} από {Math.ceil(result.total / 20)}</Text><View style={{ flexDirection: 'row', gap: 8 }}><Button secondary title="Προηγούμενη" disabled={page === 1 || loading} onPress={() => setPage(value => value - 1)}/><Button secondary title="Επόμενη" disabled={page * 20 >= result.total || loading} onPress={() => setPage(value => value + 1)}/></View></View>}
  </View>;
}
