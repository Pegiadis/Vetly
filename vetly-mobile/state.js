/**
 * POC state. In-memory only — no persistence, no API. Everything here is the
 * shape the real app would hydrate from the Vetly backend.
 */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

const PetContext = createContext(null);

const INITIAL_JOURNAL = [
  {
    id: 'j3',
    day: 'Χθες',
    mood: 'Παιχνιδιάρης',
    tone: 'sun',
    art: '🌿',
    note: 'Βρήκα μια σαύρα στην αυλή και την κυνήγησα για 20 λεπτά. Δεν την έπιασα. Θα ξαναπροσπαθήσω αύριο.',
  },
  {
    id: 'j2',
    day: 'Τρί',
    mood: 'Ήρεμος',
    tone: 'sky',
    art: '🌊',
    note: 'Πήγαμε στη θάλασσα. Το νερό ήταν κρύο αλλά μου άρεσε η άμμος στα πόδια μου.',
  },
  {
    id: 'j1',
    day: 'Δευ',
    mood: 'Νυσταγμένος',
    tone: 'grape',
    art: '🌙',
    note: 'Κοιμήθηκα 14 ώρες. Δεν μετανιώνω τίποτα.',
  },
];

// Rotating pool so the capture button feels alive on repeat taps (variable reward).
const AI_MOODS = [
  { mood: 'Ενθουσιασμένος', tone: 'coral', art: '☀️', note: 'Με κοίταξες με το κινητό και κατάλαβα ότι θα βγούμε βόλτα. Είχα δίκιο.' },
  { mood: 'Περήφανος', tone: 'mint', art: '🏆', note: 'Σήμερα κάθισα όταν μου το ζήτησες με την πρώτη. Περιμένω αναγνώριση.' },
  { mood: 'Σκεπτικός', tone: 'grape', art: '🫧', note: 'Γιατί η γάτα της γειτόνισσας με κοιτάει έτσι; Ερευνώ το θέμα.' },
  { mood: 'Χαρούμενος', tone: 'sun', art: '🌻', note: 'Μύρισα 14 καινούρια πράγματα σήμερα. Ρεκόρ εβδομάδας.' },
];

export function PetProvider({ children }) {
  const [streak, setStreak] = useState(7);
  const [freezes, setFreezes] = useState(2);
  const [xp, setXp] = useState(340);
  const [healthScore, setHealthScore] = useState(74);
  const [ritualDone, setRitualDone] = useState(false);
  const [journal, setJournal] = useState(INITIAL_JOURNAL);
  const [captureIndex, setCaptureIndex] = useState(0);

  const [steps, setSteps] = useState([
    { id: 1, text: 'Βόλτα 15 λεπτά — ο Μαξ διαλέγει δρόμο', done: true },
    { id: 2, text: 'Έλεγχος για κρότωνες μετά τη βόλτα', done: false },
    { id: 3, text: 'Φωτογραφία ημέρας στο ημερολόγιο', done: false },
  ]);

  const [meds, setMeds] = useState([
    { id: 'm1', name: 'Αντιπαρασιτικό κολάρο', when: 'Λήγει σε 9 ημέρες', done: false, tone: 'sky' },
    { id: 'm2', name: 'Χάπι για αρθρώσεις', when: 'Σήμερα 20:00', done: false, tone: 'coral' },
  ]);

  const bondLevel = Math.floor(xp / 200) + 1;
  const bondProgress = (xp % 200) / 200;
  const ritualProgress = steps.filter((s) => s.done).length / steps.length;
  const allStepsDone = steps.every((s) => s.done);

  const toggleStep = (id) => {
    if (ritualDone) return;
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, done: !s.done } : s)));
  };

  const toggleMed = (id) =>
    setMeds((prev) => prev.map((m) => (m.id === id ? { ...m, done: !m.done } : m)));

  /** Completing the daily ritual is the core loop: streak + XP + health bump. */
  const claimRitual = () => {
    if (ritualDone || !allStepsDone) return;
    setRitualDone(true);
    setStreak((s) => s + 1);
    setXp((x) => x + 60);
    setHealthScore((h) => Math.min(100, h + 8));
  };

  /** Photo-a-day capture — the 3-second ritual that builds the memory archive. */
  const capture = () => {
    const pick = AI_MOODS[captureIndex % AI_MOODS.length];
    setCaptureIndex((i) => i + 1);
    setJournal((prev) => [{ id: `j${Date.now()}`, day: 'Σήμερα', ...pick }, ...prev]);
    setXp((x) => x + 15);
    setSteps((prev) => prev.map((s) => (s.id === 3 ? { ...s, done: true } : s)));
    return pick;
  };

  const reset = () => {
    setStreak(7);
    setXp(340);
    setHealthScore(74);
    setRitualDone(false);
    setJournal(INITIAL_JOURNAL);
    setCaptureIndex(0);
    setSteps((prev) =>
      prev.map((s) => ({ ...s, done: s.id === 1 }))
    );
    setMeds((prev) => prev.map((m) => ({ ...m, done: false })));
  };

  const value = useMemo(
    () => ({
      pet: { name: 'Μαξ', breed: 'Golden Retriever', age: '3 ετών', city: 'Αθήνα' },
      owner: 'Γιάννη',
      streak,
      freezes,
      xp,
      bondLevel,
      bondProgress,
      healthScore,
      steps,
      ritualDone,
      ritualProgress,
      allStepsDone,
      journal,
      meds,
      toggleStep,
      toggleMed,
      claimRitual,
      capture,
      reset,
      setFreezes,
    }),
    [streak, freezes, xp, healthScore, steps, ritualDone, journal, meds]
  );

  return <PetContext.Provider value={value}>{children}</PetContext.Provider>;
}

export function usePet() {
  const ctx = useContext(PetContext);
  if (!ctx) throw new Error('usePet must be used inside <PetProvider>');
  return ctx;
}

/** Respect the OS "reduce motion" setting for looping/decorative animation. */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => alive && setReduced(v))
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      alive = false;
      sub?.remove?.();
    };
  }, []);
  return reduced;
}
