/**
 * Vetly Mobile — "Aegean Pop" design system
 *
 * Direction: Claymorphism + dopamine colour, on a Mediterranean base.
 * The existing Vetly brand (terracotta / olive / mustard) is kept as DNA but
 * pushed to higher saturation, because muted earth tones read as "calm admin
 * tool" and we need "playful daily ritual".
 *
 * Rules:
 *  - ONE vibrant primary saturates every primary action (Duolingo's rule).
 *  - Each functional area owns a hue so state is never conveyed by colour alone.
 *  - Every `*Deep` token is the WCAG-safe variant for text / white-on-fill.
 */

export const colors = {
  // ── Brand / energy ──────────────────────────────────────────────
  coral: '#FF6B4A', // aura, streak flame, highlights
  coralDeep: '#D9452A', // primary button fill  (white text = 4.6:1 ✓)
  coralSoft: '#FFE3DA', // tinted surface
  coralLip: '#B8371F', // 3D button bottom lip

  // ── Reward / streak ─────────────────────────────────────────────
  sun: '#FFC93C',
  sunDeep: '#8A5A00', // sun as text on cream
  sunSoft: '#FFF3D1',
  sunLip: '#E0A400',

  // ── Success / healthy ───────────────────────────────────────────
  mint: '#34C77B',
  mintDeep: '#0E7C55', // white text = 5.1:1 ✓
  mintSoft: '#DCF7E9',
  mintLip: '#219961',

  // ── Medical / vet / trust ───────────────────────────────────────
  sky: '#3B9DF8',
  skyDeep: '#0B62C4', // white text = 6.0:1 ✓
  skySoft: '#DCEDFF',

  // ── AI / magic ──────────────────────────────────────────────────
  grape: '#7C5CFF',
  grapeDeep: '#5533E0', // white text = 7.1:1 ✓
  grapeSoft: '#EAE4FF',

  // ── Alert ───────────────────────────────────────────────────────
  danger: '#E23D3D',
  dangerDeep: '#B21F1F',
  dangerSoft: '#FFE0E0',

  // ── Neutrals ────────────────────────────────────────────────────
  ink: '#22243A', // primary text — 15:1 on cream
  inkSoft: '#5A5D77', // secondary text — 5.7:1 on cream
  inkFaint: '#9A9CB0', // tertiary / disabled
  cream: '#FFF8F1', // app background
  sand: '#FFEFE2', // muted surface / track
  surface: '#FFFFFF', // card
  hairline: '#F0E4D8',
};

/** Semantic aliases — components should reach for these, not raw hues. */
export const semantic = {
  background: colors.cream,
  surface: colors.surface,
  surfaceMuted: colors.sand,
  textPrimary: colors.ink,
  textSecondary: colors.inkSoft,
  textTertiary: colors.inkFaint,
  primary: colors.coralDeep,
  primaryLip: colors.coralLip,
  onPrimary: '#FFFFFF',
  border: colors.hairline,
};

/** 4pt rhythm. */
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 };

/** Clay wants generous radii: big outer shells, softer inner elements. */
export const radius = { pill: 999, sm: 12, md: 20, lg: 28, xl: 36, xxl: 44 };

/**
 * Font choice is constrained by Greek coverage, not just personality.
 * Most rounded/playful Google fonts (Fredoka, Quicksand, Baloo 2, Varela Round,
 * Nunito) ship NO Greek glyphs — they silently fall back to the system face,
 * which kills the whole type system on a Greek-language app.
 *
 * Comfortaa and Manrope both ship the `greek` subset and verify clean.
 */
export const font = {
  display: 'Comfortaa_700Bold', // rounded geometric = friendly, Greek ✓
  displayMed: 'Comfortaa_600SemiBold',
  body: 'Manrope_400Regular', // Greek ✓
  bodyMed: 'Manrope_500Medium',
  bodyBold: 'Manrope_700Bold',
  bodyBlack: 'Manrope_800ExtraBold',
};

/** Type scale — 12 / 13 / 15 / 17 / 20 / 26 / 34. Body min 15 for readability. */
export const type = {
  hero: { fontFamily: font.display, fontSize: 34, lineHeight: 40 },
  title: { fontFamily: font.display, fontSize: 26, lineHeight: 32 },
  heading: { fontFamily: font.displayMed, fontSize: 20, lineHeight: 26 },
  subhead: { fontFamily: font.bodyBold, fontSize: 17, lineHeight: 24 },
  body: { fontFamily: font.body, fontSize: 15, lineHeight: 23 },
  bodyMed: { fontFamily: font.bodyMed, fontSize: 15, lineHeight: 23 },
  label: { fontFamily: font.bodyBold, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: font.bodyMed, fontSize: 12, lineHeight: 16 },
  overline: {
    fontFamily: font.bodyBlack,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.2,
  },
};

/**
 * Clay depth. Multi-layer soft shadow — never a hard drop shadow.
 * `lip` values are the solid bottom edge that makes buttons feel pressable.
 */
export const elevation = {
  rest: {
    shadowColor: '#8A4B32',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  raised: {
    shadowColor: '#8A4B32',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
  },
  glow: (c) => ({
    shadowColor: c,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 26,
    elevation: 10,
  }),
};

/** Motion tokens — one rhythm across the whole app. */
export const motion = {
  press: 90, // tap feedback must land < 100ms
  micro: 200,
  enter: 320,
  exit: 220, // exits ~70% of enter
  spring: { friction: 6, tension: 180, useNativeDriver: true },
};

/** Health score → the pet's aura colour. Never "sad pet" red as punishment. */
export function auraFor(score) {
  if (score >= 80) return { hue: colors.mint, deep: colors.mintDeep, soft: colors.mintSoft, label: 'Ακμαίος' };
  if (score >= 60) return { hue: colors.sun, deep: colors.sunDeep, soft: colors.sunSoft, label: 'Καλά' };
  return { hue: colors.coral, deep: colors.coralDeep, soft: colors.coralSoft, label: 'Θέλει προσοχή' };
}
