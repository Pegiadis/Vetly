/**
 * Claymorphic primitives.
 *
 * The signature detail is the "lip": a solid darker edge under the button that
 * collapses on press, so the control physically sinks under the thumb. That
 * tactility (plus haptics) is what makes a gamified UI feel good to poke.
 */
import { useRef } from 'react';
import { Animated, Pressable, Text, View, StyleSheet, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, semantic, radius, space, type, elevation, motion } from '../theme';

/** Shared press-squish. Returns animated style + handlers. */
function useSquish(scaleTo = 0.96) {
  const scale = useRef(new Animated.Value(1)).current;
  const to = (v) =>
    Animated.spring(scale, { toValue: v, ...motion.spring }).start();
  return {
    scale,
    onPressIn: () => to(scaleTo),
    onPressOut: () => to(1),
  };
}

function tap(style = 'light') {
  if (Platform.OS === 'web') return;
  const map = {
    light: Haptics.ImpactFeedbackStyle.Light,
    medium: Haptics.ImpactFeedbackStyle.Medium,
  };
  Haptics.impactAsync(map[style] ?? map.light).catch(() => {});
}

export function success() {
  if (Platform.OS === 'web') return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

/**
 * 3D pressable button with a solid bottom lip.
 * @param tone one of coral | mint | sun | sky | grape | ghost
 */
export function ClayButton({
  label,
  onPress,
  tone = 'coral',
  disabled,
  icon,
  full,
  size = 'md',
  accessibilityHint,
}) {
  const press = useRef(new Animated.Value(0)).current;
  const LIP = size === 'lg' ? 6 : 5;

  const tones = {
    coral: { fill: colors.coralDeep, lip: colors.coralLip, fg: '#FFF' },
    mint: { fill: colors.mintDeep, lip: colors.mintLip, fg: '#FFF' },
    sun: { fill: colors.sun, lip: colors.sunLip, fg: colors.ink },
    sky: { fill: colors.skyDeep, lip: '#08498F', fg: '#FFF' },
    grape: { fill: colors.grapeDeep, lip: '#3F23AC', fg: '#FFF' },
    ghost: { fill: colors.surface, lip: colors.hairline, fg: colors.ink },
  };
  const t = disabled
    ? { fill: colors.sand, lip: colors.hairline, fg: colors.inkFaint }
    : tones[tone];

  const run = (v) =>
    Animated.timing(press, {
      toValue: v,
      duration: motion.press,
      useNativeDriver: true,
    }).start();

  const translateY = press.interpolate({ inputRange: [0, 1], outputRange: [0, LIP] });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPressIn={() => {
        if (disabled) return;
        run(1);
        tap('light');
      }}
      onPressOut={() => run(0)}
      onPress={disabled ? undefined : onPress}
      // Hit area stays >= 44pt even when the visual is smaller.
      hitSlop={8}
      style={[full && { alignSelf: 'stretch' }]}
    >
      {/* The lip: a slab behind the face, revealed as depth. */}
      <View
        style={{
          backgroundColor: t.lip,
          borderRadius: radius.md,
          paddingBottom: LIP,
        }}
      >
        <Animated.View
          style={[
            styles.btnFace,
            size === 'lg' && styles.btnFaceLg,
            { backgroundColor: t.fill, transform: [{ translateY }] },
          ]}
        >
          {icon}
          <Text
            style={[
              size === 'lg' ? type.subhead : type.label,
              { color: t.fg, letterSpacing: 0.3 },
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
        </Animated.View>
      </View>
    </Pressable>
  );
}

/** Soft clay surface. Becomes pressable (with squish) when `onPress` is given. */
export function ClayCard({ children, style, onPress, tone, accessibilityLabel }) {
  const { scale, onPressIn, onPressOut } = useSquish(0.985);
  const body = (
    <Animated.View
      style={[
        styles.card,
        tone && { backgroundColor: tone },
        onPress && { transform: [{ scale }] },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );

  if (!onPress) return body;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      onPressIn={() => {
        onPressIn();
        tap('light');
      }}
      onPressOut={onPressOut}
    >
      {body}
    </Pressable>
  );
}

/** Small status pill. Always pairs colour with a label/icon (never colour alone). */
export function Pill({ label, icon, bg = colors.sand, fg = colors.ink, style }) {
  return (
    <View style={[styles.pill, { backgroundColor: bg }, style]}>
      {icon}
      <Text style={[type.caption, { color: fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/** Section header used across screens. */
export function SectionTitle({ children, action }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={[type.heading, { color: semantic.textPrimary }]}>{children}</Text>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  btnFace: {
    minHeight: 44, // touch target floor
    paddingHorizontal: space.xl,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: space.sm,
  },
  btnFaceLg: { minHeight: 56, paddingHorizontal: space.xxl },
  card: {
    backgroundColor: semantic.surface,
    borderRadius: radius.lg,
    padding: space.lg,
    ...elevation.rest,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: space.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.md,
  },
});

export { tap };
