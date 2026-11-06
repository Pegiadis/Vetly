/**
 * Bottom tab bar. 4 items (guideline max 5), icon + label on every item so the
 * destinations stay discoverable, and an active indicator that is not colour-only.
 */
import { useRef, useEffect } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, semantic, radius, space, type, font } from '../theme';
import { tap } from './Clay';

export const TABS = [
  { key: 'home', label: 'Σήμερα', icon: 'home', iconOff: 'home-outline' },
  { key: 'journal', label: 'Ημερολόγιο', icon: 'images', iconOff: 'images-outline' },
  { key: 'health', label: 'Υγεία', icon: 'heart', iconOff: 'heart-outline' },
  { key: 'ask', label: 'Ρώτα', icon: 'sparkles', iconOff: 'sparkles-outline' },
];

// No safe-area-context in this POC; these match the iOS home indicator / Android nav.
const BOTTOM_INSET = Platform.OS === 'ios' ? 26 : 14;

export function TabBar({ active, onChange, badge }) {
  return (
    <View style={styles.bar}>
      {TABS.map((t) => (
        <TabItem
          key={t.key}
          tab={t}
          active={active === t.key}
          badge={badge?.[t.key]}
          onPress={() => {
            if (active !== t.key) tap('light');
            onChange(t.key);
          }}
        />
      ))}
    </View>
  );
}

function TabItem({ tab, active, onPress, badge }) {
  const lift = useRef(new Animated.Value(active ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(lift, {
      toValue: active ? 1 : 0,
      friction: 7,
      tension: 200,
      useNativeDriver: true,
    }).start();
  }, [active, lift]);

  const translateY = lift.interpolate({ inputRange: [0, 1], outputRange: [0, -3] });
  const scale = lift.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityLabel={tab.label}
      accessibilityState={{ selected: active }}
      style={styles.item}
      hitSlop={6}
    >
      <Animated.View style={{ alignItems: 'center', transform: [{ translateY }, { scale }] }}>
        <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
          <Ionicons
            name={active ? tab.icon : tab.iconOff}
            size={21}
            color={active ? colors.coralDeep : colors.inkFaint}
          />
          {badge > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
            </View>
          )}
        </View>
        <Text
          style={[
            type.caption,
            { color: active ? colors.coralDeep : colors.inkFaint, marginTop: 2 },
            active && { fontFamily: font.bodyBlack },
          ]}
          numberOfLines={1}
        >
          {tab.label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: semantic.surface,
    paddingTop: space.md,
    paddingBottom: BOTTOM_INSET,
    paddingHorizontal: space.sm,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    shadowColor: '#8A4B32',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 16,
  },
  item: {
    flex: 1,
    minHeight: 44, // touch target floor
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: 46,
    height: 30,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: { backgroundColor: colors.coralSoft },
  badge: {
    position: 'absolute',
    top: -2,
    right: 6,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: semantic.surface,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 9,
    fontFamily: font.bodyBlack,
    lineHeight: 12,
  },
});
