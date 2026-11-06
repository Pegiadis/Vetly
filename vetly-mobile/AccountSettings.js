import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { request } from './api';
import { ui } from './mobileTheme';
import { a, AccountButton as Button, Field, Notice } from './AccountUI';
import { accountError, passwordError, profilePayload } from './accountForm.mjs';

const titles = { profile: 'Στοιχεία επικοινωνίας', password: 'Αλλαγή κωδικού', sessions: 'Αποσύνδεση συσκευών', delete: 'Διαγραφή λογαριασμού' };
export default function AccountSettings({ token, owner, onProfileSaved, onSessionEnded, onClose }) {
  const [panel, setPanel] = useState(null), [form, setForm] = useState({ name: owner?.name || '', phone: owner?.phone || '', address: owner?.address || '' });
  const [prefs, setPrefs] = useState(null), [loading, setLoading] = useState(true), [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState('');
  const [current, setCurrent] = useState(''), [password, setPassword] = useState(''), [repeat, setRepeat] = useState(''), [confirmation, setConfirmation] = useState('');
  const lock = useRef(false), alive = useRef(true), scroll = useRef(null);
  useEffect(() => { scroll.current?.scrollTo({ y: 0, animated: false }); }, [panel, error, message]);
  async function loadPrefs() {
    setLoading(true); setLoadError('');
    try { const data = await request('/owner/settings', token); if (alive.current) setPrefs(data); }
    catch (e) { if (alive.current) setLoadError(accountError(e)); }
    finally { if (alive.current) setLoading(false); }
  }
  useEffect(() => { alive.current = true; loadPrefs(); return () => { alive.current = false; }; }, [token]);
  function open(value) {
    if (lock.current) return;
    setPanel(value); setError(''); setMessage(''); setCurrent(''); setPassword(''); setRepeat(''); setConfirmation('');
    setForm({ name: owner?.name || '', phone: owner?.phone || '', address: owner?.address || '' });
  }
  function close() { if (!lock.current) { if (panel) open(null); else onClose(); } }
  async function perform(task) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(''); setMessage('');
    try { await task(); } catch (e) { if (alive.current) setError(accountError(e)); }
    finally { lock.current = false; if (alive.current) setBusy(false); }
  }
  const save = () => perform(async () => {
    if (panel === 'profile') {
      const profile = await request('/owner/profile', token, profilePayload(form), 'PUT');
      onProfileSaved(profile); setPanel(null); setMessage('Τα στοιχεία σου αποθηκεύτηκαν.'); return;
    }
    if (!current) throw new Error('Συμπλήρωσε τον τρέχοντα κωδικό σου.');
    if (panel === 'password') { const issue = passwordError(password, repeat); if (issue) throw new Error(issue); }
    if (panel === 'delete' && confirmation !== 'ΔΙΑΓΡΑΦΗ') throw new Error('Πληκτρολόγησε ΔΙΑΓΡΑΦΗ για επιβεβαίωση.');
    const endpoint = { password: 'password', sessions: 'logout-all', delete: 'delete-account' }[panel];
    await request(`/owner/settings/${endpoint}`, token, { current_password: current, ...(panel === 'password' ? { new_password: password } : {}), ...(panel === 'delete' ? { confirmation } : {}) });
    // These operations revoke this credential; clear it without a push unregister request.
    await onSessionEnded(panel === 'delete' ? 'Ο λογαριασμός διαγράφηκε.' : panel === 'password' ? 'Ο κωδικός άλλαξε. Συνδέσου με τον νέο κωδικό.' : 'Αποσυνδέθηκαν όλες οι συσκευές.');
  });
  return <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={close}><SafeAreaView style={{ flex: 1, backgroundColor: ui.background }}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <View style={ui.header}><Text style={{ ...ui.title, flex: 1, fontSize: 20 }}>{panel ? titles[panel] : 'Ρυθμίσεις λογαριασμού'}</Text><Button secondary title={panel ? 'Πίσω' : 'Κλείσιμο'} onPress={close} disabled={busy}/></View>
    <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 18, paddingBottom: 40, gap: 18, width: '100%', maxWidth: 620, alignSelf: 'center' }}>
      <Notice text={message}/><Notice text={error} error/>
      {!panel ? <>
        <View style={a.card}><Text style={a.title}>{owner?.name}</Text><Text style={a.body}>{owner?.email}</Text><Text style={a.body}>{owner?.phone || 'Χωρίς τηλέφωνο'}{ '\n' }{owner?.address || 'Χωρίς διεύθυνση'}</Text><Button secondary title="Επεξεργασία στοιχείων" onPress={() => open('profile')} disabled={busy || !owner}/></View>
        <View style={a.card}><Text style={a.label}>Ενημερώσεις μέσω email</Text><Text style={a.body}>Επίλεξε ποια email θέλεις να λαμβάνεις. Οι ειδοποιήσεις του κινητού ρυθμίζονται από το καμπανάκι.</Text>
          {loading ? <ActivityIndicator color={ui.brand}/> : loadError ? <><Notice text={loadError} error/><Button secondary title="Επανάληψη φόρτωσης" onPress={loadPrefs}/></> : prefs && <>
            {[['email_appointments', 'Ενημερώσεις ραντεβού'], ['email_reminders', 'Υπενθυμίσεις φροντίδας']].map(([key, label]) => <View key={key} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}><Text style={{ ...a.body, flex: 1 }}>{label}</Text><Switch accessibilityLabel={label} value={prefs[key]} onValueChange={value => setPrefs(old => ({ ...old, [key]: value }))} disabled={busy} trackColor={{ true: ui.brand }}/></View>)}
            <Button title={busy ? 'Αποθήκευση…' : 'Αποθήκευση προτιμήσεων'} disabled={busy} onPress={() => perform(async () => { setPrefs(await request('/owner/settings', token, prefs, 'PUT')); setMessage('Οι προτιμήσεις email αποθηκεύτηκαν.'); })}/>
          </>}
        </View>
        <View style={a.card}><Text style={a.label}>Ασφάλεια</Text><Button secondary title="Αλλαγή κωδικού" onPress={() => open('password')} disabled={busy}/><Button secondary title="Αποσύνδεση από όλες τις συσκευές" onPress={() => open('sessions')} disabled={busy}/></View>
        <View style={a.card}><Text style={a.label}>Διαγραφή λογαριασμού</Text><Text style={a.body}>Διαγράφονται ο λογαριασμός, τα κατοικίδια και τα συνδεδεμένα ιστορικά, αγωγές, αξιολογήσεις και συνομιλίες. Ανεξάρτητα αρχεία που τηρούν τα κτηνιατρεία παραμένουν· για αυτά επικοινώνησε με το ιατρείο.</Text><Button secondary title="Διαγραφή λογαριασμού" onPress={() => open('delete')} disabled={busy}/></View>
      </> : <View style={a.card}>
        {panel === 'profile' ? <>{[['name', 'Ονοματεπώνυμο', 255], ['phone', 'Τηλέφωνο', 50], ['address', 'Διεύθυνση', 500]].map(([key, label, max]) => <Field key={key} label={label} value={form[key]} onChangeText={value => setForm(old => ({ ...old, [key]: value }))} maxLength={max} keyboardType={key === 'phone' ? 'phone-pad' : 'default'} editable={!busy}/>)}<Text style={a.body}>Email σύνδεσης: {owner?.email}</Text></> : <>
          <Text style={a.body}>{panel === 'delete' ? 'Η διαγραφή είναι οριστική και δεν αναιρείται. Πρέπει πρώτα να ακυρωθούν ή να ολοκληρωθούν τα εκκρεμή και επιβεβαιωμένα ραντεβού σου.' : 'Επιβεβαίωσε τον τρέχοντα κωδικό σου. Θα χρειαστεί νέα σύνδεση σε όλες τις συσκευές, μαζί με αυτή.'}</Text>
          <Field label="Τρέχων κωδικός" value={current} onChangeText={setCurrent} secureTextEntry autoComplete="current-password" autoCapitalize="none" editable={!busy} maxLength={128}/>
          {panel === 'password' && <><Field label="Νέος κωδικός" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" autoCapitalize="none" editable={!busy} maxLength={128}/><Text style={a.body}>Τουλάχιστον 10 χαρακτήρες, με γράμματα και αριθμούς.</Text><Field label="Επιβεβαίωση νέου κωδικού" value={repeat} onChangeText={setRepeat} secureTextEntry autoComplete="new-password" autoCapitalize="none" editable={!busy} maxLength={128}/></>}
          {panel === 'delete' && <Field label="Πληκτρολόγησε ΔΙΑΓΡΑΦΗ" value={confirmation} onChangeText={setConfirmation} autoCorrect={false} editable={!busy} maxLength={20}/>}
        </>}
        <Button title={busy ? 'Περίμενε…' : panel === 'profile' ? 'Αποθήκευση στοιχείων' : panel === 'password' ? 'Ενημέρωση κωδικού' : panel === 'sessions' ? 'Αποσύνδεση όλων' : 'Οριστική διαγραφή'} danger={panel === 'delete'} onPress={save} disabled={busy || (panel === 'delete' && confirmation !== 'ΔΙΑΓΡΑΦΗ')}/>
        <Button secondary title="Ακύρωση" disabled={busy} onPress={() => open(null)}/>
      </View>}
    </ScrollView>
  </KeyboardAvoidingView></SafeAreaView></Modal>;
}
