import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { request } from './api';
import { ui } from './mobileTheme';
import { a, AccountButton as Button, Notice } from './AccountUI';
import { plainText } from './assistantText.mjs';

const SUGGESTIONS = ['Πότε είναι το επόμενο εμβόλιο;', 'Τι να προσέξω μετά τη στείρωση;', 'Είναι φυσιολογικό να μην τρώει σήμερα;'];
// The assistant can take longer than ordinary requests.
const REPLY_TIMEOUT = 60000;

/** Chat with the Vetly assistant. It knows the owner's pets and visits; it does not replace the vet. */
export default function AssistantChat({ token, onClose }) {
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]), [text, setText] = useState('');
  const [loading, setLoading] = useState(true), [sending, setSending] = useState(false), [error, setError] = useState('');
  const scroll = useRef(null), lock = useRef(false);

  useEffect(() => {
    // Continue the latest conversation, so a closed screen does not lose the thread.
    let active = true;
    (async () => {
      const list = await request('/owner/chat/conversations?page=1&page_size=1', token);
      const latest = list.items[0];
      if (latest) {
        const detail = await request(`/owner/chat/conversations/${latest.id}`, token);
        if (active) { setConversationId(latest.id); setMessages(detail.messages); }
      }
    })().catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);

  useEffect(() => { setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 50); }, [messages, sending]);

  async function send(value = text) {
    const message = value.trim();
    if (!message || lock.current) return;
    lock.current = true; setSending(true); setError(''); setText('');
    const pending = { id: `pending-${Date.now()}`, role: 'user', content: message };
    setMessages(current => [...current, pending]);
    try {
      const result = await request('/owner/chat/send', token, { message, conversation_id: conversationId }, 'POST', REPLY_TIMEOUT);
      setConversationId(result.conversation_id);
      setMessages(current => [...current.filter(item => item.id !== pending.id), result.user_message, result.assistant_message]);
    } catch (e) {
      setMessages(current => current.filter(item => item.id !== pending.id));
      setText(message); setError(e.message);
    } finally { lock.current = false; setSending(false); }
  }

  function startOver() { if (!sending) { setConversationId(null); setMessages([]); setError(''); } }

  return <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}><SafeAreaView style={{ flex: 1, backgroundColor: ui.background }}>
    <View style={ui.header}>
      <Text numberOfLines={1} style={{ ...ui.title, fontSize: 20, flex: 1 }}>Βοηθός</Text>
      {messages.length > 0 && <Button secondary title="Νέα συζήτηση" disabled={sending} onPress={startOver}/>}
      <Button secondary title="Κλείσιμο" onPress={onClose}/>
    </View>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, gap: 12, maxWidth: 680, width: '100%', alignSelf: 'center' }}>
        <Notice text="Ο βοηθός δίνει γενικές πληροφορίες και δεν αντικαθιστά τον κτηνίατρο. Σε επείγον, κάλεσε το ιατρείο σου ή δες τους εφημερεύοντες."/>
        {loading ? <ActivityIndicator color={ui.brand}/> : !messages.length && <View style={{ gap: 8 }}>
          <Text style={a.label}>Δοκίμασε να ρωτήσεις:</Text>
          {SUGGESTIONS.map(item => <Pressable key={item} accessibilityRole="button" disabled={sending} onPress={() => send(item)} style={{ backgroundColor: 'white', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: ui.line }}><Text style={{ color: ui.ink }}>{item}</Text></Pressable>)}
        </View>}
        {messages.map(message => {
          const mine = message.role === 'user';
          return <View key={message.id} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '88%', backgroundColor: mine ? ui.brand : 'white', borderRadius: 18, borderBottomRightRadius: mine ? 6 : 18, borderBottomLeftRadius: mine ? 18 : 6, paddingVertical: 10, paddingHorizontal: 14 }}>
            <Text selectable style={{ color: mine ? 'white' : ui.ink, fontSize: 15, lineHeight: 22 }}>{mine ? message.content : plainText(message.content)}</Text>
          </View>;
        })}
        {sending && <View style={{ alignSelf: 'flex-start', flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: 'white', borderRadius: 18, paddingVertical: 10, paddingHorizontal: 14 }}><ActivityIndicator size="small" color={ui.brand}/><Text style={a.body}>Ο βοηθός γράφει…</Text></View>}
        <Notice text={error} error/>
      </ScrollView>
      <View style={{ flexDirection: 'row', gap: 8, padding: 12, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: ui.line, alignItems: 'flex-end' }}>
        <TextInput accessibilityLabel="Μήνυμα στον βοηθό" value={text} onChangeText={setText} editable={!sending} multiline maxLength={5000} placeholder="Γράψε την ερώτησή σου…" placeholderTextColor={ui.muted} style={[ui.input, { flex: 1, minHeight: 46, maxHeight: 140, paddingVertical: 11 }]}/>
        <Pressable accessibilityRole="button" accessibilityLabel="Αποστολή" disabled={sending || !text.trim()} onPress={() => send()} style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: ui.brand, alignItems: 'center', justifyContent: 'center', opacity: sending || !text.trim() ? .4 : 1 }}>
          <Ionicons name="arrow-up" size={22} color="white"/>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  </SafeAreaView></Modal>;
}
