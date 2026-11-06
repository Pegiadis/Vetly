import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Platform, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { API_URL, request, session } from './api';
import { disablePush } from './pushNotifications';
import { parseAccountLink } from './accountForm.mjs';
import AuthScreen from './AuthScreen';
import OwnerShell from './OwnerShell';
import { ui } from './mobileTheme';

const linkOrigins = [new URL(API_URL).origin, process.env.EXPO_PUBLIC_WEB_URL || 'https://vetly.gr'];
if (__DEV__) linkOrigins.push('http://localhost:3000');

export default function App() { return <SafeAreaProvider><StatusBar style="dark"/><SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}><OwnerApp/></SafeAreaView></SafeAreaProvider>; }
function OwnerApp() {
  const [token, setToken] = useState(null), [boot, setBoot] = useState(true);
  const [owner, setOwner] = useState(null), [pets, setPets] = useState([]);
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [intent, setIntent] = useState(null);
  const generation = useRef(0), logoutLock = useRef(false);
  async function endSession(message = '') {
    generation.current += 1;
    setToken(null); setOwner(null); setPets([]); setError(''); setBusy(false); setNotice(message);
    try { await session.clear(); } catch { setNotice('Δεν διαγράφηκε η αποθηκευμένη σύνδεση από τη συσκευή. Κλείσε και άνοιξε ξανά την εφαρμογή.'); }
  }
  async function logout() {
    if (logoutLock.current) return;
    logoutLock.current = true;
    try { await disablePush(token); await endSession(); }
    catch (e) {
      if (e.status === 401) await endSession();
      else setError('Δεν ήταν δυνατή η απενεργοποίηση ειδοποιήσεων. Έλεγξε τη σύνδεσή σου και δοκίμασε αποσύνδεση ξανά.');
    } finally { logoutLock.current = false; }
  }
  async function refresh(auth = token) {
    const current = generation.current;
    setBusy(true); setError('');
    try {
      const user = await request('/auth/pet-owner/me', auth);
      let page = 1, all = [], data;
      do { data = await request(`/owner/pets?page=${page}&page_size=50`, auth); all = all.concat(data.items); page++; } while (all.length < data.total && data.items.length);
      if (current === generation.current) { setOwner(user); setPets(all); }
    } catch (e) {
      if (current !== generation.current) return;
      if (e.status === 401) await endSession('Η σύνδεσή σου έληξε. Συνδέσου ξανά.'); else setError(e.message);
    } finally { if (current === generation.current) setBusy(false); }
  }
  useEffect(() => {
    let active = true;
    session.get().then(saved => { if (active && saved) setToken(saved); }).catch(() => { if (active) setNotice('Δεν ανακτήθηκε η αποθηκευμένη σύνδεση.'); }).finally(() => { if (active) setBoot(false); });
    function receive(url) {
      const parsed = url && parseAccountLink(url, linkOrigins);
      if (active && parsed) { setIntent(parsed); if (Platform.OS === 'web') window.history.replaceState(null, '', '/'); }
    }
    Linking.getInitialURL().then(receive).catch(() => {});
    const subscription = Linking.addEventListener('url', event => receive(event.url));
    return () => { active = false; subscription.remove(); };
  }, []);
  useEffect(() => { if (token) refresh(token); }, [token]);
  async function authenticated(value) {
    await request('/auth/pet-owner/me', value);
    await session.set(value);
    generation.current += 1; setOwner(null); setPets([]); setNotice(''); setIntent(null); setToken(value);
  }
  if (boot) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator color={ui.brand}/></View>;
  if (intent || !token) return <AuthScreen key={intent ? `${intent.action}:${intent.token}` : 'login'} intent={intent} allowedOrigins={linkOrigins} notice={notice} onAuthenticated={authenticated} onReset={() => endSession('Ο κωδικός άλλαξε. Συνδέσου ξανά.')} onCloseIntent={intent ? () => setIntent(null) : undefined}/>;
  return <OwnerShell key={token} token={token} owner={owner} pets={pets} refresh={refresh} busy={busy} error={error} logout={logout} onProfileSaved={setOwner} onSessionEnded={endSession}/>;
}
