/**
 * Ρώτα — AI triage, then a bridge to the owner's real vet.
 *
 * The AI is the reason to install; the booking handoff is the reason it makes
 * money. Triage is shown on a 4-level scale with an icon + text, never colour
 * alone, and red-flag symptoms must always escalate — the model is not allowed
 * to return "it's fine" for those.
 */
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ClayButton, ClayCard, Pill, tap } from '../components/Clay';
import { colors, semantic, radius, space, type, elevation } from '../theme';
import { useReducedMotion } from '../state';

const QUICK = [
  { id: 'q1', text: 'Ξύνεται συνέχεια' },
  { id: 'q2', text: 'Δεν τρώει από χθες' },
  { id: 'q3', text: 'Κουτσαίνει λίγο' },
  { id: 'q4', text: 'Έφαγε σοκολάτα' },
];

/** Canned triage outcomes so the POC shows the full range, incl. the red flag. */
const REPLIES = {
  q1: {
    text: 'Το επίμονο ξύσιμο τον Ιούλιο στην Αττική είναι συχνά ψύλλοι ή αλλεργία. Έλεγξε πίσω από τα αυτιά και στη βάση της ουράς για μαύρους κόκκους.',
    triage: 2,
  },
  q2: {
    text: 'Μία ημέρα ανορεξίας σε ενήλικο σκύλο δικαιολογεί παρακολούθηση. Αν περάσουν 24 ώρες ακόμη ή εμφανιστεί εμετός, χρειάζεται εξέταση.',
    triage: 3,
  },
  q3: {
    text: 'Ήπια χωλότητα μετά από έντονη δραστηριότητα συνήθως υποχωρεί. Περιόρισε τη βόλτα σε 10 λεπτά και δες αν βελτιώνεται σε 48 ώρες.',
    triage: 2,
  },
  q4: {
    // Hard-coded escalation. The model never gets to soften this one.
    text: 'Η σοκολάτα είναι τοξική για τον σκύλο. Ανάλογα με την ποσότητα και τον τύπο μπορεί να προκαλέσει αρρυθμία. Μην περιμένεις συμπτώματα.',
    triage: 4,
    redFlag: true,
  },
};

const TRIAGE = {
  1: { label: 'Εντάξει', icon: 'checkmark-circle', bg: colors.mintSoft, fg: colors.mintDeep },
  2: { label: 'Παρακολούθησε', icon: 'eye', bg: colors.skySoft, fg: colors.skyDeep },
  3: { label: 'Ραντεβού σήμερα', icon: 'time', bg: colors.sunSoft, fg: colors.sunDeep },
  4: { label: 'Επείγον — τώρα', icon: 'warning', bg: colors.dangerSoft, fg: colors.dangerDeep },
};

export function AskScreen() {
  const [messages, setMessages] = useState([
    {
      id: 'm0',
      from: 'ai',
      text: 'Γεια σου! Είμαι ο AI βοηθός του Vetly. Πες μου τι παρατήρησες στον Μαξ — ή στείλε μου φωτογραφία.',
    },
  ]);
  const [typing, setTyping] = useState(false);
  const scroller = useRef(null);

  const ask = (q) => {
    if (typing) return;
    tap('light');
    const reply = REPLIES[q.id];
    setMessages((m) => [...m, { id: `u${Date.now()}`, from: 'me', text: q.text }]);
    setTyping(true);
    setTimeout(() => {
      setMessages((m) => [...m, { id: `a${Date.now()}`, from: 'ai', ...reply }]);
      setTyping(false);
    }, 1100);
  };

  useEffect(() => {
    const t = setTimeout(() => scroller.current?.scrollToEnd({ animated: true }), 120);
    return () => clearTimeout(t);
  }, [messages, typing]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.head}>
        <View style={styles.aiAvatar}>
          <LinearGradient
            colors={[colors.grape, colors.sky]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Ionicons name="sparkles" size={19} color="#FFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[type.subhead, { color: semantic.textPrimary }]}>AI Κτηνίατρος</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={styles.onlineDot} />
            <Text style={[type.caption, { color: colors.mintDeep }]}>
              Διαθέσιμος 24/7
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        ref={scroller}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((m) => (
          <Bubble key={m.id} msg={m} />
        ))}
        {typing && <Typing />}
      </ScrollView>

      <View style={styles.dock}>
        <Text style={[type.overline, { color: semantic.textSecondary, marginBottom: space.sm }]}>
          ΓΡΗΓΟΡΕΣ ΕΡΩΤΗΣΕΙΣ
        </Text>
        <View style={styles.chips}>
          {QUICK.map((q) => (
            <Pressable
              key={q.id}
              onPress={() => ask(q)}
              accessibilityRole="button"
              accessibilityLabel={q.text}
              style={styles.chip}
              hitSlop={4}
            >
              <Text style={[type.caption, { color: semantic.textPrimary }]}>{q.text}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function Bubble({ msg }) {
  const reduced = useReducedMotion();
  const enter = useRef(new Animated.Value(reduced ? 1 : 0)).current;

  useEffect(() => {
    if (reduced) return;
    Animated.timing(enter, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [reduced, enter]);

  const mine = msg.from === 'me';
  const t = msg.triage ? TRIAGE[msg.triage] : null;

  return (
    <Animated.View
      style={{
        opacity: enter,
        transform: [
          { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
        ],
        alignSelf: mine ? 'flex-end' : 'flex-start',
        maxWidth: '88%',
        marginBottom: space.md,
      }}
    >
      <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
        <Text style={[type.body, { color: mine ? '#FFF' : semantic.textPrimary }]}>
          {msg.text}
        </Text>
      </View>

      {t && (
        <ClayCard style={{ marginTop: space.sm, backgroundColor: t.bg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
            <Ionicons name={t.icon} size={19} color={t.fg} />
            <Text style={[type.subhead, { color: t.fg, flex: 1 }]}>{t.label}</Text>
          </View>

          {/* 4-level scale, labelled — position carries the meaning, not just hue. */}
          <View style={styles.scale}>
            {[1, 2, 3, 4].map((lvl) => (
              <View
                key={lvl}
                style={[
                  styles.scaleSeg,
                  { backgroundColor: lvl <= msg.triage ? t.fg : 'rgba(0,0,0,0.08)' },
                ]}
              />
            ))}
          </View>

          <View style={{ marginTop: space.md, gap: space.sm }}>
            {msg.triage >= 3 && (
              <ClayButton
                full
                label={msg.redFlag ? 'Κάλεσε εφημερεύοντα τώρα' : 'Κλείσε ραντεβού με τον Δρ. Παπαδόπουλο'}
                tone={msg.redFlag ? 'coral' : 'sky'}
                onPress={() => {}}
                icon={
                  <Ionicons name={msg.redFlag ? 'call' : 'calendar'} size={17} color="#FFF" />
                }
              />
            )}
            <Text style={[type.caption, { color: semantic.textSecondary }]}>
              Ο AI δεν αντικαθιστά κτηνιατρική εξέταση.
            </Text>
          </View>
        </ClayCard>
      )}
    </Animated.View>
  );
}

function Typing() {
  const reduced = useReducedMotion();
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

  useEffect(() => {
    if (reduced) return;
    const loops = dots.map((d, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 140),
          Animated.timing(d, { toValue: 1, duration: 320, useNativeDriver: true }),
          Animated.timing(d, { toValue: 0, duration: 320, useNativeDriver: true }),
          Animated.delay(280 - i * 140),
        ])
      )
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [reduced]);

  return (
    <View
      style={[styles.bubble, styles.theirs, { flexDirection: 'row', gap: 5, alignSelf: 'flex-start' }]}
      accessibilityLabel="Ο AI γράφει"
    >
      {dots.map((d, i) => (
        <Animated.View
          key={i}
          style={[
            styles.dot,
            {
              opacity: d.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
              transform: [
                { translateY: d.interpolate({ inputRange: [0, 1], outputRange: [0, -3] }) },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingBottom: space.md,
  },
  aiAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation.rest,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.mint,
  },

  scroll: { paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: space.lg },
  bubble: {
    borderRadius: radius.lg,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  mine: { backgroundColor: colors.grapeDeep, borderBottomRightRadius: radius.sm },
  theirs: {
    backgroundColor: semantic.surface,
    borderBottomLeftRadius: radius.sm,
    ...elevation.rest,
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.inkFaint },

  scale: { flexDirection: 'row', gap: 5, marginTop: space.md },
  scaleSeg: { flex: 1, height: 7, borderRadius: 4 },

  dock: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.md,
    backgroundColor: colors.cream,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: {
    backgroundColor: semantic.surface,
    borderRadius: radius.pill,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    minHeight: 44, // touch floor
    justifyContent: 'center',
    ...elevation.rest,
  },
});
