/**
 * Ημερολόγιο — the 3-second daily ritual.
 *
 * This is the strongest retention mechanic available to a pet app: it costs the
 * user almost nothing per day and compounds into an archive they can't get back
 * anywhere else. The AI "mood read" is the variable reward — different every tap.
 */
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ClayButton, ClayCard, Pill, SectionTitle, success } from '../components/Clay';
import { colors, semantic, radius, space, type, elevation } from '../theme';
import { usePet, useReducedMotion } from '../state';

const TONES = {
  coral: { soft: colors.coralSoft, deep: colors.coralDeep },
  sun: { soft: colors.sunSoft, deep: colors.sunDeep },
  mint: { soft: colors.mintSoft, deep: colors.mintDeep },
  sky: { soft: colors.skySoft, deep: colors.skyDeep },
  grape: { soft: colors.grapeSoft, deep: colors.grapeDeep },
};

// Mon-first week. `state`: done | freeze | today | empty
const WEEK = [
  { d: 'Δ', state: 'done' },
  { d: 'Τ', state: 'done' },
  { d: 'Τ', state: 'done' },
  { d: 'Π', state: 'freeze' },
  { d: 'Π', state: 'done' },
  { d: 'Σ', state: 'done' },
  { d: 'Κ', state: 'today' },
];

export function JournalScreen() {
  const p = usePet();
  const [thinking, setThinking] = useState(false);
  const capturedToday = p.journal.some((j) => j.day === 'Σήμερα');

  const onCapture = () => {
    if (thinking) return;
    setThinking(true);
    // Stand-in for: upload photo → Gemini Vision → mood + caption.
    setTimeout(() => {
      p.capture();
      success();
      setThinking(false);
    }, 900);
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <Text style={[type.title, { color: semantic.textPrimary }]}>Ημερολόγιο</Text>
      <Text style={[type.body, { color: semantic.textSecondary, marginTop: 2 }]}>
        {p.journal.length} αναμνήσεις του Μαξ
      </Text>

      <WeekStrip />

      <CaptureCard
        onPress={onCapture}
        thinking={thinking}
        done={capturedToday}
      />

      <SectionTitle>Πρόσφατα</SectionTitle>
      {p.journal.map((entry, i) => (
        <MemoryCard key={entry.id} entry={entry} index={i} />
      ))}

      <YearWrapTeaser count={p.journal.length} />
      <View style={{ height: space.xxl }} />
    </ScrollView>
  );
}

/* ─────────────────────────── Streak strip ───────────────────────────── */

function WeekStrip() {
  const p = usePet();
  return (
    <ClayCard style={{ marginTop: space.lg }}>
      <View style={styles.weekHead}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <Ionicons name="flame" size={16} color={colors.coralDeep} />
          <Text style={[type.subhead, { color: semantic.textPrimary }]}>
            {p.streak} ημέρες σερί
          </Text>
        </View>
        <Pill
          label={`${p.freezes} πάγοι`}
          bg={colors.skySoft}
          fg={colors.skyDeep}
          icon={<Ionicons name="snow" size={12} color={colors.skyDeep} />}
        />
      </View>

      <View style={styles.week}>
        {WEEK.map((d, i) => (
          <DayDot key={i} day={d} />
        ))}
      </View>

      {/* The humane part: a missed day is absorbed, not punished. */}
      <Text style={[type.caption, { color: semantic.textSecondary, marginTop: space.md }]}>
        Την Πέμπτη χρησιμοποιήθηκε πάγος αυτόματα. Το σερί σου συνεχίζεται.
      </Text>
    </ClayCard>
  );
}

function DayDot({ day }) {
  const map = {
    done: { bg: colors.coralDeep, icon: 'flame', fg: '#FFF' },
    freeze: { bg: colors.skySoft, icon: 'snow', fg: colors.skyDeep },
    today: { bg: colors.sunSoft, icon: 'ellipse-outline', fg: colors.sunDeep },
    empty: { bg: colors.sand, icon: null, fg: colors.inkFaint },
  };
  const m = map[day.state];
  return (
    <View style={{ alignItems: 'center', gap: 5, flex: 1 }}>
      <View
        style={[
          styles.dayDot,
          { backgroundColor: m.bg },
          day.state === 'today' && { borderWidth: 2, borderColor: colors.sun },
        ]}
      >
        {m.icon && <Ionicons name={m.icon} size={15} color={m.fg} />}
      </View>
      <Text style={[type.caption, { color: semantic.textSecondary, fontSize: 11 }]}>{day.d}</Text>
    </View>
  );
}

/* ───────────────────────────── Capture ──────────────────────────────── */

function CaptureCard({ onPress, thinking, done }) {
  const reduced = useReducedMotion();
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!thinking || reduced) return;
    const loop = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    shimmer.setValue(0);
    loop.start();
    return () => loop.stop();
  }, [thinking, reduced, shimmer]);

  const spin = shimmer.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={[styles.capture, elevation.raised]}>
      <LinearGradient
        colors={[colors.grape, '#9B7BFF', colors.sky]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.captureBody}>
        <Animated.View
          style={[styles.captureIcon, thinking && { transform: [{ rotate: spin }] }]}
        >
          <Ionicons name={thinking ? 'sync' : 'camera'} size={26} color={colors.grapeDeep} />
        </Animated.View>

        <Text style={[type.heading, { color: '#FFF', textAlign: 'center' }]}>
          {thinking ? 'Ο AI διαβάζει τη διάθεση…' : 'Η φωτογραφία της ημέρας'}
        </Text>
        <Text
          style={[
            type.caption,
            { color: 'rgba(255,255,255,0.92)', textAlign: 'center', marginTop: 4 },
          ]}
        >
          Μία φωτό. Ο Μαξ σου λέει τι σκέφτεται.
        </Text>

        <View style={{ marginTop: space.lg, alignSelf: 'stretch' }}>
          <ClayButton
            full
            size="lg"
            tone="ghost"
            disabled={thinking}
            label={done ? 'Πρόσθεσε άλλη μία' : 'Τράβα φωτογραφία'}
            onPress={onPress}
            accessibilityHint="Ανοίγει την κάμερα και δημιουργεί καταχώρηση ημερολογίου"
            icon={
              <Ionicons
                name={done ? 'add-circle' : 'camera'}
                size={18}
                color={thinking ? colors.inkFaint : colors.grapeDeep}
              />
            }
          />
        </View>
      </View>
    </View>
  );
}

/* ─────────────────────────── Memory cards ───────────────────────────── */

function MemoryCard({ entry, index }) {
  const reduced = useReducedMotion();
  const enter = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  const tone = TONES[entry.tone] ?? TONES.coral;

  useEffect(() => {
    if (reduced) return;
    Animated.timing(enter, {
      toValue: 1,
      duration: 320,
      delay: Math.min(index, 4) * 45, // staggered entrance, capped
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [reduced, enter, index]);

  return (
    <Animated.View
      style={{
        opacity: enter,
        transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
      }}
    >
      <ClayCard style={{ marginBottom: space.md }}>
        <View style={styles.memRow}>
          <View style={[styles.memArt, { backgroundColor: tone.soft }]}>
            <Text style={{ fontSize: 26 }}>{entry.art}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.memHead}>
              <Text style={[type.label, { color: semantic.textPrimary }]}>{entry.day}</Text>
              <Pill label={entry.mood} bg={tone.soft} fg={tone.deep} />
            </View>
            <Text style={[type.body, { color: semantic.textSecondary, marginTop: 6 }]}>
              «{entry.note}»
            </Text>
          </View>
        </View>
      </ClayCard>
    </Animated.View>
  );
}

/** The share loop: a yearly recap is free acquisition. */
function YearWrapTeaser({ count }) {
  return (
    <ClayCard style={{ marginTop: space.sm, backgroundColor: colors.ink }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <View style={[styles.memArt, { backgroundColor: colors.grapeDeep, width: 44, height: 44 }]}>
          <Ionicons name="gift" size={20} color="#FFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[type.subhead, { color: '#FFF' }]}>Η χρονιά του Μαξ</Text>
          <Text style={[type.caption, { color: 'rgba(255,255,255,0.75)', marginTop: 2 }]}>
            {count} αναμνήσεις μέχρι τώρα · ξεκλειδώνει στις 31 Δεκεμβρίου
          </Text>
        </View>
      </View>
    </ClayCard>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: space.lg, paddingTop: space.sm },

  weekHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.lg,
  },
  week: { flexDirection: 'row', gap: space.xs },
  dayDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },

  capture: {
    marginTop: space.lg,
    marginBottom: space.xl,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  captureBody: { padding: space.xl, alignItems: 'center' },
  captureIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.96)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.md,
  },

  memRow: { flexDirection: 'row', gap: space.md },
  memArt: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
  },
});
