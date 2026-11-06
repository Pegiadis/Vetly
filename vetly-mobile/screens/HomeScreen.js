/**
 * Σήμερα — the digital twin + the daily loop.
 *
 * Retention design notes:
 *  - The aura/ring is driven by a REAL score, never decoration.
 *  - The streak celebrates the owner showing up; the pet is never shown sad or
 *    dying as a guilt lever. Freeze days are surfaced, Duolingo-style.
 *  - One primary CTA per screen (claim the ritual).
 */
import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ClayButton, ClayCard, Pill, SectionTitle, success, tap } from '../components/Clay';
import { Ring, ProgressBar } from '../components/Ring';
import { colors, semantic, radius, space, type, elevation, auraFor } from '../theme';
import { usePet, useReducedMotion } from '../state';

export function HomeScreen({ onNavigate }) {
  const p = usePet();
  const aura = auraFor(p.healthScore);
  const reduced = useReducedMotion();

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      <Header owner={p.owner} streak={p.streak} freezes={p.freezes} />

      <TwinCard pet={p.pet} score={p.healthScore} aura={aura} reduced={reduced} ritualDone={p.ritualDone} />

      <BondCard level={p.bondLevel} progress={p.bondProgress} xp={p.xp} />

      <SectionTitle>Η αποστολή της ημέρας</SectionTitle>
      <RitualCard />

      <SectionTitle>Γρήγορες ενέργειες</SectionTitle>
      <View style={styles.quickRow}>
        <QuickAction
          icon="sparkles"
          tone={colors.grape}
          soft={colors.grapeSoft}
          label="Ρώτα τον AI"
          onPress={() => onNavigate('ask')}
        />
        <QuickAction
          icon="calendar"
          tone={colors.skyDeep}
          soft={colors.skySoft}
          label="Ραντεβού"
          onPress={() => onNavigate('health')}
        />
        <QuickAction
          icon="camera"
          tone={colors.coralDeep}
          soft={colors.coralSoft}
          label="Φωτό ημέρας"
          onPress={() => onNavigate('journal')}
        />
      </View>

      <SeasonAlert />

      <View style={{ height: space.xxl }} />
    </ScrollView>
  );
}

/* ─────────────────────────────── Header ─────────────────────────────── */

function Header({ owner, streak, freezes }) {
  return (
    <View style={styles.header}>
      <View style={{ flex: 1 }}>
        <Text style={[type.caption, { color: semantic.textSecondary }]}>Καλημέρα</Text>
        <Text style={[type.title, { color: semantic.textPrimary }]}>{owner}</Text>
      </View>
      <StreakBadge streak={streak} freezes={freezes} />
    </View>
  );
}

function StreakBadge({ streak, freezes }) {
  return (
    <View style={styles.streak}>
      <View style={styles.streakTop}>
        <Ionicons name="flame" size={17} color={colors.coralDeep} />
        <Text style={[type.subhead, { color: colors.coralDeep }]}>{streak}</Text>
      </View>
      <View style={styles.streakBottom}>
        <Ionicons name="snow-outline" size={11} color={colors.skyDeep} />
        <Text style={[type.caption, { color: colors.skyDeep, fontSize: 11 }]}>
          {freezes} πάγος
        </Text>
      </View>
    </View>
  );
}

/* ────────────────────────────── Digital twin ────────────────────────── */

function TwinCard({ pet, score, aura, reduced, ritualDone }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduced) return; // respect prefers-reduced-motion
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [reduced, pulse]);

  const auraScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.09] });
  const auraOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0.16] });

  return (
    <View style={[styles.twin, elevation.raised]}>
      <LinearGradient
        colors={[colors.coral, '#FF9366', colors.sun]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.twinTop}>
        <Pill
          label={pet.city}
          bg="rgba(255,255,255,0.28)"
          fg="#FFF"
          icon={<Ionicons name="location" size={12} color="#FFF" />}
        />
        <Pill
          label={aura.label}
          bg="rgba(255,255,255,0.95)"
          fg={aura.deep}
          icon={<Ionicons name="pulse" size={12} color={aura.deep} />}
        />
      </View>

      <View style={styles.twinCenter}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.aura,
            {
              backgroundColor: aura.hue,
              opacity: auraOpacity,
              transform: [{ scale: auraScale }],
            },
          ]}
        />
        <Ring size={186} thickness={9} progress={score / 100} color="#FFFFFF" track="rgba(255,255,255,0.3)">
          <View style={styles.avatar}>
            <Text style={styles.avatarArt}>🐕</Text>
          </View>
        </Ring>

        <View style={styles.scoreChip}>
          <Text style={[type.label, { color: aura.deep }]}>{score}</Text>
          <Text style={[type.caption, { color: semantic.textSecondary, fontSize: 11 }]}>/100</Text>
        </View>

        <Text style={[type.hero, styles.petName]}>{pet.name}</Text>
        <Text style={[type.caption, { color: 'rgba(255,255,255,0.92)' }]}>
          {pet.breed} · {pet.age}
        </Text>
      </View>

      {/* "Whisper" — the AI voice of the pet. Cheap to render, high emotional payload. */}
      <View style={styles.whisper}>
        <View style={styles.whisperHead}>
          <Ionicons name="sparkles" size={12} color={colors.grapeDeep} />
          <Text style={[type.overline, { color: colors.grapeDeep }]}>Η ΣΚΕΨΗ ΤΟΥ ΜΑΞ</Text>
        </View>
        <Text style={[type.body, { color: semantic.textPrimary }]}>
          {ritualDone
            ? '«Η βόλτα ήταν τέλεια. Μύρισα ένα κλαρί που μύριζε σαν περιπέτεια. Πάμε πάλι αύριο;»'
            : '«Κοιτάω την πόρτα εδώ και ώρα. Απλώς λέω. Χωρίς πίεση.»'}
        </Text>
      </View>
    </View>
  );
}

/* ─────────────────────────────── Bond ───────────────────────────────── */

function BondCard({ level, progress, xp }) {
  return (
    <ClayCard style={{ marginTop: space.lg }}>
      <View style={styles.bondRow}>
        <View style={styles.bondBadge}>
          <Ionicons name="heart" size={15} color="#FFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[type.subhead, { color: semantic.textPrimary }]}>
            Δεσμός · Επίπεδο {level}
          </Text>
          <Text style={[type.caption, { color: semantic.textSecondary }]}>
            {xp} πόντοι · {Math.round((1 - progress) * 200)} ακόμη για το επόμενο
          </Text>
        </View>
      </View>
      <View style={{ marginTop: space.md }}>
        <ProgressBar progress={progress} color={colors.coral} />
      </View>
    </ClayCard>
  );
}

/* ────────────────────────────── Daily ritual ────────────────────────── */

function RitualCard() {
  const p = usePet();
  const burst = useRef(new Animated.Value(0)).current;
  const reduced = useReducedMotion();

  const claim = () => {
    p.claimRitual();
    success();
    if (reduced) return;
    burst.setValue(0);
    Animated.timing(burst, {
      toValue: 1,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  return (
    <ClayCard style={p.ritualDone && styles.ritualDone}>
      <View style={styles.ritualHead}>
        <View style={{ flex: 1 }}>
          <Text style={[type.subhead, { color: semantic.textPrimary }]}>
            Το Σαφάρι Μυρωδιών
          </Text>
          <Text style={[type.caption, { color: semantic.textSecondary, marginTop: 2 }]}>
            15 λεπτά · +60 πόντοι δεσμού
          </Text>
        </View>
        <Pill
          label={p.ritualDone ? 'Ολοκληρώθηκε' : `${Math.round(p.ritualProgress * 100)}%`}
          bg={p.ritualDone ? colors.mintSoft : colors.sunSoft}
          fg={p.ritualDone ? colors.mintDeep : colors.sunDeep}
          icon={
            <Ionicons
              name={p.ritualDone ? 'checkmark-circle' : 'time-outline'}
              size={13}
              color={p.ritualDone ? colors.mintDeep : colors.sunDeep}
            />
          }
        />
      </View>

      <View style={{ marginVertical: space.md }}>
        <ProgressBar
          progress={p.ritualProgress}
          color={p.ritualDone ? colors.mint : colors.sun}
          height={10}
        />
      </View>

      {p.steps.map((s) => (
        <StepRow key={s.id} step={s} locked={p.ritualDone} onToggle={() => p.toggleStep(s.id)} />
      ))}

      <View style={{ marginTop: space.md }}>
        <ClayButton
          full
          size="lg"
          label={
            p.ritualDone
              ? 'Τα κατάφερες σήμερα!'
              : p.allStepsDone
              ? 'Πάρε την ανταμοιβή'
              : 'Ολοκλήρωσε τα βήματα'
          }
          tone={p.ritualDone ? 'mint' : 'coral'}
          disabled={!p.allStepsDone || p.ritualDone}
          onPress={claim}
          accessibilityHint="Καταχωρεί την αποστολή και ανεβάζει το σερί σου"
          icon={
            <Ionicons
              name={p.ritualDone ? 'checkmark-circle' : 'gift'}
              size={18}
              color={p.allStepsDone || p.ritualDone ? '#FFF' : colors.inkFaint}
            />
          }
        />
      </View>

      {/* Reward burst — motion carries meaning (reward landed), then gets out of the way. */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.burst,
          {
            opacity: burst.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 0] }),
            transform: [
              { scale: burst.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.5] }) },
            ],
          },
        ]}
      >
        <Text style={styles.burstText}>+60</Text>
      </Animated.View>
    </ClayCard>
  );
}

function StepRow({ step, locked, onToggle }) {
  const scale = useRef(new Animated.Value(1)).current;

  const press = () => {
    if (locked) return;
    tap('medium');
    onToggle();
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.94, duration: 90, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 5, tension: 200, useNativeDriver: true }),
    ]).start();
  };

  return (
    <Pressable
      onPress={press}
      disabled={locked}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: step.done, disabled: locked }}
      accessibilityLabel={step.text}
    >
      <Animated.View
        style={[styles.step, step.done && styles.stepDone, { transform: [{ scale }] }]}
      >
        <View style={[styles.check, step.done && styles.checkOn]}>
          {step.done && <Ionicons name="checkmark" size={14} color="#FFF" />}
        </View>
        <Text
          style={[
            type.bodyMed,
            { flex: 1, color: step.done ? colors.mintDeep : semantic.textPrimary },
          ]}
        >
          {step.text}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

/* ───────────────────────── Quick actions + local alert ──────────────── */

function QuickAction({ icon, label, tone, soft, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      style={{ flex: 1 }}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPressIn={() => {
        tap('light');
        Animated.spring(scale, { toValue: 0.95, friction: 6, tension: 200, useNativeDriver: true }).start();
      }}
      onPressOut={() =>
        Animated.spring(scale, { toValue: 1, friction: 6, tension: 200, useNativeDriver: true }).start()
      }
      onPress={onPress}
    >
      <Animated.View style={[styles.quick, { transform: [{ scale }] }]}>
        <View style={[styles.quickIcon, { backgroundColor: soft }]}>
          <Ionicons name={icon} size={21} color={tone} />
        </View>
        <Text style={[type.caption, { color: semantic.textPrimary, textAlign: 'center' }]}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

/**
 * Seasonal, geo-relevant health alert. This is the kind of locally-grounded
 * value a global pet app can't replicate — and it earns the push notification.
 */
function SeasonAlert() {
  return (
    <ClayCard style={{ marginTop: space.lg, backgroundColor: colors.sunSoft }}>
      <View style={styles.alertRow}>
        <View style={styles.alertIcon}>
          <Ionicons name="bug" size={17} color={colors.sunDeep} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[type.label, { color: colors.sunDeep }]}>
            Ξεκίνησε η περίοδος σκνίπας στην Αττική
          </Text>
          <Text style={[type.caption, { color: semantic.textSecondary, marginTop: 3 }]}>
            Η λεϊσμανίαση μεταδίδεται Μάιο–Οκτώβριο. Έλεγξε αν το κολάρο του Μαξ
            είναι ακόμη ενεργό.
          </Text>
        </View>
      </View>
    </ClayCard>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: space.lg, paddingTop: space.sm },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: space.lg,
  },
  streak: {
    backgroundColor: semantic.surface,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    alignItems: 'center',
    ...elevation.rest,
  },
  streakTop: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  streakBottom: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 1 },

  twin: {
    borderRadius: radius.xxl,
    overflow: 'hidden',
    padding: space.lg,
  },
  twinTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  twinCenter: { alignItems: 'center', marginTop: space.lg },
  aura: { position: 'absolute', top: -6, width: 200, height: 200, borderRadius: 100 },
  avatar: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: 'rgba(255,255,255,0.96)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarArt: { fontSize: 62 },
  scoreChip: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    backgroundColor: '#FFF',
    paddingHorizontal: space.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
    marginTop: -14,
    ...elevation.rest,
  },
  petName: { color: '#FFF', marginTop: space.sm },

  whisper: {
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: radius.lg,
    padding: space.lg,
    marginTop: space.lg,
  },
  whisperHead: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 },

  bondRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  bondBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.coralDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },

  ritualDone: { backgroundColor: colors.mintSoft },
  ritualHead: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.cream,
    borderRadius: radius.md,
    padding: space.md,
    marginBottom: space.sm,
    minHeight: 52,
  },
  stepDone: { backgroundColor: colors.mintSoft },
  check: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: { backgroundColor: colors.mintDeep, borderColor: colors.mintDeep },

  burst: {
    position: 'absolute',
    alignSelf: 'center',
    top: '42%',
  },
  burstText: {
    fontFamily: font.display,
    fontSize: 44,
    color: colors.sunDeep,
  },

  quickRow: { flexDirection: 'row', gap: space.md },
  quick: {
    backgroundColor: semantic.surface,
    borderRadius: radius.lg,
    paddingVertical: space.lg,
    paddingHorizontal: space.sm,
    alignItems: 'center',
    gap: space.sm,
    minHeight: 96,
    justifyContent: 'center',
    ...elevation.rest,
  },
  quickIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },

  alertRow: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  alertIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
