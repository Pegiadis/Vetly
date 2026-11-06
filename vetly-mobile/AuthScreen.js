import { useEffect, useRef, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { request } from './api';
import { ui } from './mobileTheme';
import { a, AccountButton as Button, Field, Notice } from './AccountUI';
import { accountError, parseAccountLink, passwordError, validEmail } from './accountForm.mjs';

export default function AuthScreen({ onAuthenticated, intent, onCloseIntent, onReset, notice, allowedOrigins }) {
  const [mode, setMode] = useState(intent?.action || 'login');
  const [email, setEmail] = useState(''), [name, setName] = useState('');
  const [password, setPassword] = useState(''), [repeat, setRepeat] = useState('');
  const [link, setLink] = useState(''), [activeIntent, setActiveIntent] = useState(intent);
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState(notice || '');
  const [retryAt, setRetryAt] = useState(0);
  const lock = useRef(false), scroll = useRef(null);
  useEffect(() => { scroll.current?.scrollTo({ y: 0, animated: false }); }, [mode, error, message]);
  function go(next) { if (lock.current) return; setMode(next); setError(''); setMessage(''); setPassword(''); setRepeat(''); setLink(''); setActiveIntent(null); }
  async function perform(task) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(''); setMessage('');
    try { await task(); } catch (e) { setError(accountError(e)); }
    finally { lock.current = false; setBusy(false); }
  }
  function requireEmail() { if (!validEmail(email)) throw new Error('Συμπλήρωσε ένα έγκυρο email.'); return email.trim(); }
  function requirePassword() { const issue = passwordError(password, repeat); if (issue) throw new Error(issue); }
  async function sendEmail(path) {
    const address = requireEmail();
    if (Date.now() < retryAt) throw new Error('Περίμενε ένα λεπτό πριν ζητήσεις νέο email.');
    await request(path, null, { email: address, user_type: 'pet_owner', client: 'mobile' });
    setRetryAt(Date.now() + 60000);
  }
  const submit = () => perform(async () => {
    if (mode === 'login') {
      const address = requireEmail();
      if (!password) throw new Error('Συμπλήρωσε τον κωδικό σου.');
      try {
        const result = await request('/auth/pet-owner/login', null, { email: address, password });
        await onAuthenticated(result.access_token);
      } catch (e) {
        if (e.status === 403 && e.message === 'Email not verified') { setMode('pending'); setPassword(''); }
        throw e;
      }
    } else if (mode === 'register') {
      const address = requireEmail(); requirePassword();
      if (name.trim().length < 2) throw new Error('Συμπλήρωσε το ονοματεπώνυμό σου.');
      await request('/auth/pet-owner/register', null, { name: name.trim(), email: address, password, client: 'mobile' });
      setPassword(''); setRepeat(''); setMode('pending'); setRetryAt(Date.now() + 60000);
      setMessage('Ο λογαριασμός δημιουργήθηκε. Έλεγξε τα εισερχόμενα και την ανεπιθύμητη αλληλογραφία για την επιβεβαίωση.');
    } else if (mode === 'forgot') {
      await sendEmail('/auth/forgot-password');
      setMessage('Αν υπάρχει επιβεβαιωμένος λογαριασμός με αυτό το email, θα λάβεις σύνδεσμο για νέο κωδικό. Έλεγξε και την ανεπιθύμητη αλληλογραφία.');
    } else if (mode === 'pending') {
      await sendEmail('/auth/resend-verification');
      setMessage('Αν χρειάζεται επιβεβαίωση για αυτό το email, θα λάβεις νέο σύνδεσμο.');
    } else if (mode === 'paste') {
      const parsed = parseAccountLink(link, allowedOrigins);
      if (!parsed) throw new Error('Επικόλλησε ολόκληρο τον σύνδεσμο από το email του Vetly.');
      setActiveIntent(parsed); setLink(''); setMode(parsed.action);
    } else if (mode === 'verify-email') {
      await request('/auth/verify-email', null, { token: activeIntent.token, user_type: 'pet_owner' });
      setActiveIntent(null); setMode('login'); setMessage('Το email επιβεβαιώθηκε. Συνδέσου με τον κωδικό σου.');
    } else if (mode === 'reset-password') {
      requirePassword();
      await request('/auth/reset-password', null, { token: activeIntent.token, new_password: password, user_type: 'pet_owner' });
      setActiveIntent(null); setPassword(''); setRepeat(''); setMode('login');
      await onReset();
      setMessage('Ο κωδικός άλλαξε. Συνδέσου ξανά με τον νέο κωδικό σου.');
    }
  });
  const titles = { login: 'Καλώς ήρθες ξανά', register: 'Η παρέα σου ξεκινά εδώ', forgot: 'Ξέχασες τον κωδικό;', pending: 'Επιβεβαίωσε το email σου', paste: 'Σύνδεσμος από το email', 'verify-email': 'Επιβεβαίωση email', 'reset-password': 'Ο νέος σου κωδικός' };
  const actions = { login: 'Σύνδεση', register: 'Δημιουργία λογαριασμού', forgot: 'Αποστολή συνδέσμου', pending: 'Νέο email επιβεβαίωσης', paste: 'Συνέχεια', 'verify-email': 'Επιβεβαίωση email', 'reset-password': 'Αποθήκευση νέου κωδικού' };
  return <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView ref={scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 24, paddingBottom: 40, gap: 22, width: '100%', maxWidth: 540, alignSelf: 'center' }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}><Image source={require('./assets/vetly-logo.png')} accessibilityLabel="Vetly" resizeMode="contain" style={{ width: 110, height: 42 }}/><Text style={{ color: ui.brand, fontSize: 10 }}>ΓΙΑ ΚΗΔΕΜΟΝΕΣ</Text></View>
    {mode === 'login' && <View style={{ gap: 12 }}><Text style={{ ...a.title, fontSize: 36, lineHeight: 42 }}>Η φροντίδα τους,{ '\n' }πιο κοντά σου.</Text><Text style={a.body}>Όλη η παρέα σου, σε ένα μέρος.</Text></View>}
    <Text style={a.title}>{titles[mode]}</Text>
    <Notice text={message}/><Notice text={error} error/>
    {mode === 'register' && <Field label="Ονοματεπώνυμο" value={name} onChangeText={setName} maxLength={255} autoComplete="name" editable={!busy}/>}
    {['login', 'register', 'forgot', 'pending'].includes(mode) && <Field label="Email" value={email} onChangeText={setEmail} editable={!busy} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" maxLength={254}/>}
    {['login', 'register', 'reset-password'].includes(mode) && <Field label={mode === 'reset-password' ? 'Νέος κωδικός' : 'Κωδικός πρόσβασης'} value={password} onChangeText={setPassword} editable={!busy} secureTextEntry autoCapitalize="none" autoCorrect={false} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} maxLength={128} onSubmitEditing={mode === 'login' ? submit : undefined}/>}
    {['register', 'reset-password'].includes(mode) && <><Text style={a.body}>Τουλάχιστον 10 χαρακτήρες, με γράμματα και αριθμούς.</Text><Field label="Επιβεβαίωση κωδικού" value={repeat} onChangeText={setRepeat} editable={!busy} secureTextEntry autoCapitalize="none" autoComplete="new-password" maxLength={128}/></>}
    {mode === 'pending' && <Text style={a.body}>Άνοιξε τον σύνδεσμο που έλαβες και ολοκλήρωσε την επιβεβαίωση. Έπειτα μπορείς να συνδεθείς εδώ.</Text>}
    {mode === 'verify-email' && <Text style={a.body}>Πάτησε επιβεβαίωση για το email του λογαριασμού που δημιούργησες.</Text>}
    {mode === 'paste' && <><Text style={a.body}>Αν το email δεν ανοίγει την εφαρμογή, αντέγραψε τον σύνδεσμό του και επικόλλησέ τον εδώ.</Text><Field label="Σύνδεσμος email" value={link} onChangeText={setLink} editable={!busy} autoCapitalize="none" autoCorrect={false} maxLength={6000}/></>}
    <Button title={busy ? 'Περίμενε…' : actions[mode]} onPress={submit} disabled={busy}/>
    {mode === 'verify-email' && <Button secondary title="Ζήτηση νέου email επιβεβαίωσης" onPress={() => go('pending')} disabled={busy}/>}
    {mode === 'reset-password' && <Button secondary title="Ζήτηση νέου συνδέσμου επαναφοράς" onPress={() => go('forgot')} disabled={busy}/>}
    {mode === 'login' && <><Button secondary title="Ξέχασα τον κωδικό μου" onPress={() => go('forgot')} disabled={busy}/><Button secondary title="Δεν έχω λογαριασμό · Εγγραφή" onPress={() => go('register')} disabled={busy}/></>}
    {['login', 'pending', 'forgot'].includes(mode) && <Button secondary title="Έχω σύνδεσμο από email" onPress={() => go('paste')} disabled={busy}/>}
    {mode !== 'login' && <Button secondary title="Επιστροφή στη σύνδεση" onPress={() => go('login')} disabled={busy}/>}
    {onCloseIntent && <Button secondary title="Κλείσιμο" onPress={onCloseIntent} disabled={busy}/>}
    <Text style={{ ...a.body, textAlign: 'center', fontSize: 12 }}>Με φροντίδα, για την παρέα σου.</Text>
  </ScrollView></KeyboardAvoidingView>;
}
