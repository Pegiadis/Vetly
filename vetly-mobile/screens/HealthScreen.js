/**
 * Υγεία — the honest score.
 *
 * The aura on the home screen is only trustworthy if this screen exists: every
 * point is attributable to a real input, and the user can tap through to see
 * why. A decorative score would be noise.
 *
 * The "auto-filled by your vet" card is the moat — the owner types nothing.
 */
import { useRef } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ClayCard, ClayButton, Pill, SectionTitle, tap } from '../components/Clay';
import { Ring, ProgressBar } from '../components/Ring';
import { colors, semantic, radius, space, type, elevation, auraFor } from '../theme';
import { usePet } from '../state';

const WEIGHTS = [
  { m: 'Φεβ', kg: 29.4 },
  { m: 'Μαρ', kg: 29.9 },
  { m: 'Απρ', kg: 30.6 },
  { m: 'Μαϊ', kg: 31.2 },
  { m: 'Ιουν', kg: 31.0 },
  { m: 'Ιουλ', kg: 30.7 },
];

export function HealthScreen() {
  const p = usePet();
  const aura = auraFor(p.healthScore);

  const factors = [
    {
      key: 'w',
      icon: 'trending-up',
      label: 'Βάρος',
      detail: 'Σταθερό εντός ιδανικού εύρους',
      value: 0.92,
      tone: colors.mintDeep,
    },
    {
      key: 'm',
      icon: 'medkit',
      label: 'Φαρμακευτική αγωγή',
      detail: `${p.meds.filter((m) => m.done).length}/${p.meds.length} ολοκληρωμένα σήμερα`,
      value: p.meds.filter((m) => m.done).length / p.meds.length,
      tone: colors.coralDeep,
    },
    {
      key: 'v',
      icon: 'shield-checkmark',
      label: 'Εμβολιασμοί',
      detail: 'Λύσσα: ανανέωση σε 42 ημέρες',
      value: 0.78,
      tone: colors.skyDeep,
    },
    {
      key: 'c',
      icon: 'calendar',
      label: 'Τελευταία επίσκεψη',
      detail: 'Πριν 4 μήνες · συνιστάται εξάμηνο',
      value: 0.55,
      tone: colors.sunDeep,
    },
  ];

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <Text style={[type.title, { color: semantic.textPrimary }]}>Υγεία</Text>
      <Text style={[type.body, { color: semantic.textSecondary, marginTop: 2 }]}>
        Μαξ · Golden Retriever
      </Text>

      {/* Score + why */}
      <ClayCard style={{ marginTop: space.lg, alignItems: 'center' }}>
        <Ring size={148} thickness={11} progress={p.healthScore / 100} color={aura.hue}>
          <View style={{ alignItems: 'center' }}>
            <Text style={[type.hero, { color: aura.deep }]}>{p.healthScore}</Text>
            <Text style={[type.caption, { color: semantic.textSecondary }]}>στα 100</Text>
          </View>
        </Ring>
        <Pill
          label={aura.label}
          bg={aura.soft}
          fg={aura.deep}
          style={{ marginTop: space.md }}
          icon={<Ionicons name="pulse" size={13} color={aura.deep} />}
        />
        <Text
          style={[
            type.caption,
            { color: semantic.textSecondary, textAlign: 'center', marginTop: space.md },
          ]}
        >
          Ο βαθμός υπολογίζεται από πραγματικά δεδομένα — δεν είναι διακοσμητικός.
        </Text>
      </ClayCard>

      <SectionTitle>Από τι προκύπτει</SectionTitle>
      <ClayCard>
        {factors.map((f, i) => (
          <FactorRow key={f.key} factor={f} last={i === factors.length - 1} />
        ))}
      </ClayCard>

      <SectionTitle>Βάρος</SectionTitle>
      <WeightCard />

      <SectionTitle>Σήμερα</SectionTitle>
      {p.meds.map((m) => (
        <MedRow key={m.id} med={m} onToggle={() => p.toggleMed(m.id)} />
      ))}

      <VetSyncCard />
      <View style={{ height: space.xxl }} />
    </ScrollView>
  );
}

function FactorRow({ factor, last }) {
  return (
    <View style={[styles.factor, !last && styles.factorBorder]}>
      <View style={[styles.factorIcon, { backgroundColor: colors.cream }]}>
        <Ionicons name={factor.icon} size={17} color={factor.tone} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.factorHead}>
          <Text style={[type.bodyMed, { color: semantic.textPrimary }]}>{factor.label}</Text>
          <Text style={[type.caption, { color: factor.tone }]}>
            {Math.round(factor.value * 100)}%
          </Text>
        </View>
        <Text style={[type.caption, { color: semantic.textSecondary, marginVertical: 4 }]}>
          {factor.detail}
        </Text>
        <ProgressBar progress={factor.value} color={factor.tone} height={6} />
      </View>
    </View>
  );
}

function WeightCard() {
  const max = Math.max(...WEIGHTS.map((w) => w.kg));
  const min = Math.min(...WEIGHTS.map((w) => w.kg));
  const span = max - min || 1;

  return (
    <ClayCard>
      <View style={styles.weightHead}>
        <View>
          <Text style={[type.hero, { color: semantic.textPrimary, fontSize: 30 }]}>30,7 kg</Text>
          <Text style={[type.caption, { color: colors.mintDeep }]}>
            −0,5 kg τον τελευταίο μήνα · ιδανικό εύρος
          </Text>
        </View>
        <Pill
          label="Ιδανικό"
          bg={colors.mintSoft}
          fg={colors.mintDeep}
          icon={<Ionicons name="checkmark-circle" size={13} color={colors.mintDeep} />}
        />
      </View>

      <View style={styles.chart} accessibilityLabel="Γράφημα βάρους τελευταίων 6 μηνών">
        {WEIGHTS.map((w, i) => {
          const h = 24 + ((w.kg - min) / span) * 68;
          const isLast = i === WEIGHTS.length - 1;
          return (
            <View key={w.m} style={styles.barCol}>
              <Text style={[type.caption, { fontSize: 10, color: semantic.textSecondary }]}>
                {w.kg.toFixed(1)}
              </Text>
              <View
                style={[
                  styles.bar,
                  { height: h, backgroundColor: isLast ? colors.coralDeep : colors.coralSoft },
                ]}
              />
              <Text style={[type.caption, { fontSize: 11, color: semantic.textSecondary }]}>
                {w.m}
              </Text>
            </View>
          );
        })}
      </View>
    </ClayCard>
  );
}

function MedRow({ med, onToggle }) {
  const scale = useRef(new Animated.Value(1)).current;
  const tones = {
    sky: { soft: colors.skySoft, deep: colors.skyDeep },
    coral: { soft: colors.coralSoft, deep: colors.coralDeep },
  };
  const t = tones[med.tone] ?? tones.coral;

  const press = () => {
    tap('medium');
    onToggle();
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.97, duration: 90, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 5, tension: 200, useNativeDriver: true }),
    ]).start();
  };

  return (
    <Pressable
      onPress={press}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: med.done }}
      accessibilityLabel={`${med.name}. ${med.when}`}
    >
      <Animated.View
        style={[
          styles.med,
          med.done && { backgroundColor: colors.mintSoft },
          { transform: [{ scale }] },
        ]}
      >
        <View style={[styles.factorIcon, { backgroundColor: med.done ? '#FFF' : t.soft }]}>
          <Ionicons
            name={med.done ? 'checkmark' : 'medkit'}
            size={17}
            color={med.done ? colors.mintDeep : t.deep}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={[
              type.bodyMed,
              { color: med.done ? colors.mintDeep : semantic.textPrimary },
            ]}
          >
            {med.name}
          </Text>
          <Text style={[type.caption, { color: semantic.textSecondary }]}>{med.when}</Text>
        </View>
        <View style={[styles.check, med.done && styles.checkOn]}>
          {med.done && <Ionicons name="checkmark" size={14} color="#FFF" />}
        </View>
      </Animated.View>
    </Pressable>
  );
}

/** The differentiator: records the owner never had to type. */
function VetSyncCard() {
  return (
    <ClayCard style={{ marginTop: space.lg, backgroundColor: colors.skySoft }}>
      <View style={{ flexDirection: 'row', gap: space.md, alignItems: 'flex-start' }}>
        <View style={[styles.factorIcon, { backgroundColor: '#FFF' }]}>
          <Ionicons name="cloud-done" size={18} color={colors.skyDeep} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[type.label, { color: colors.skyDeep }]}>
            Ενημερώθηκε από τον κτηνίατρό σου
          </Text>
          <Text style={[type.caption, { color: semantic.textSecondary, marginTop: 3 }]}>
            Δρ. Παπαδόπουλος πρόσθεσε τα αποτελέσματα αίματος του Μαξ πριν 2 ημέρες.
            Δεν χρειάστηκε να πληκτρολογήσεις τίποτα.
          </Text>
          <View style={{ marginTop: space.md, flexDirection: 'row', gap: space.sm }}>
            <ClayButton
              label="Δες τα αποτελέσματα"
              tone="sky"
              onPress={() => {}}
              icon={<Ionicons name="document-text" size={16} color="#FFF" />}
            />
          </View>
        </View>
      </View>
    </ClayCard>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: space.lg, paddingTop: space.sm },

  factor: { flexDirection: 'row', gap: space.md, paddingVertical: space.md },
  factorBorder: { borderBottomWidth: 1, borderBottomColor: colors.hairline },
  factorHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  factorIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },

  weightHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: space.lg,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: space.xs,
  },
  barCol: { flex: 1, alignItems: 'center', gap: 5 },
  bar: { width: '72%', borderRadius: radius.sm, minHeight: 20 },

  med: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: semantic.surface,
    borderRadius: radius.lg,
    padding: space.md,
    marginBottom: space.md,
    minHeight: 64,
    ...elevation.rest,
  },
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
});
