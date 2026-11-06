/**
 * Segmented progress ring (no SVG dependency).
 *
 * Built from N absolutely-positioned bars, each rotated to its own angle. This
 * avoids the fragile half-circle masking trick and reads like a fitness ring,
 * which is exactly the "made progress today" signal we want.
 */
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import { colors, motion } from '../theme';

const SEGMENTS = 32;

export function Ring({
  size = 172,
  thickness = 10,
  progress = 0, // 0..1
  color = colors.mint,
  track = colors.sand,
  children,
  animate = true,
}) {
  const target = clamp01(progress);
  const anim = useRef(new Animated.Value(animate ? 0 : target)).current;
  const [filled, setFilled] = useState(() => Math.round((animate ? 0 : target) * SEGMENTS));

  useEffect(() => {
    if (!animate) {
      setFilled(Math.round(target * SEGMENTS));
      return;
    }
    // Listen at segment granularity so we re-render ~32 times, not 60/sec.
    const id = anim.addListener(({ value }) => {
      setFilled((prev) => {
        const next = Math.round(clamp01(value) * SEGMENTS);
        return next === prev ? prev : next;
      });
    });
    const run = Animated.timing(anim, {
      toValue: target,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // we read the value in JS
    });
    run.start();
    return () => {
      run.stop();
      anim.removeListener(id);
    };
  }, [target, animate, anim]);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {Array.from({ length: SEGMENTS }).map((_, i) => {
        const on = i < filled;
        return (
          <View
            key={i}
            pointerEvents="none"
            style={{
              position: 'absolute',
              width: size,
              height: size,
              alignItems: 'center',
              transform: [{ rotate: `${(i / SEGMENTS) * 360}deg` }],
            }}
          >
            <View
              style={{
                width: thickness * 0.62,
                height: thickness * 1.5,
                borderRadius: thickness,
                backgroundColor: on ? color : track,
              }}
            />
          </View>
        );
      })}
      {children}
    </View>
  );
}

/** Horizontal progress bar with the same clay language. */
export function ProgressBar({
  progress,
  color = colors.coral,
  track = colors.sand,
  height = 12,
}) {
  const w = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const run = Animated.timing(w, {
      toValue: clamp01(progress),
      duration: motion.enter,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // animating width
    });
    run.start();
    return () => run.stop();
  }, [progress, w]);

  return (
    <View style={{ height, borderRadius: height, backgroundColor: track, overflow: 'hidden' }}>
      <Animated.View
        style={{
          height: '100%',
          borderRadius: height,
          backgroundColor: color,
          width: w.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
        }}
      />
    </View>
  );
}

function clamp01(n) {
  if (!Number.isFinite(n)) return 0;
  return Math.min(Math.max(n, 0), 1);
}
