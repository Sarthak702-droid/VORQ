import { forwardRef, useEffect, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Defs, Ellipse, LinearGradient, Path, RadialGradient, Rect, Stop, type PathProps } from "react-native-svg";
import { Brand } from "./Brand";

// Animated adds a native-only prop which react-native-svg forwards to web DOM.
const OutlinePath = forwardRef<Path, PathProps & { collapsable?: boolean }>(
  ({ collapsable, ...props }, ref) => {
    void collapsable;
    return <Path ref={ref} {...props} />;
  },
);
OutlinePath.displayName = "OutlinePath";
const AnimatedPath = Animated.createAnimatedComponent(OutlinePath);
const native = Platform.OS !== "web";
const silhouette = "M105 109H235C264 109 279 119 294 145L360 258L466 79C478 59 499 52 528 52H663C679 52 683 58 674 74L478 421C467 443 453 452 427 452H287C267 452 257 446 246 427L92 131C84 116 89 109 105 109Z";

/** One cold-start reveal. Session restoration runs concurrently underneath. */
export function LaunchScreen({ ready, onComplete }: {
  ready: boolean;
  onComplete: () => void;
}) {
  const [draw] = useState(() => new Animated.Value(0));
  const [reveal] = useState(() => new Animated.Value(0));
  const [word] = useState(() => new Animated.Value(0));
  const [exit] = useState(() => new Animated.Value(1));
  const [breathe] = useState(() => new Animated.Value(0));
  const [introDone, setIntroDone] = useState(false);
  const [reducedMotion, setReducedMotion] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then(
      (value) => { if (active) setReducedMotion(value); },
      () => { if (active) setReducedMotion(false); },
    );
    const listener = AccessibilityInfo.addEventListener("reduceMotionChanged", setReducedMotion);
    return () => { active = false; listener.remove(); };
  }, []);

  useEffect(() => {
    if (reducedMotion === null) return;
    if (reducedMotion) {
      draw.setValue(1);
      reveal.setValue(1);
      word.setValue(1);
      const immediate = Animated.timing(word, { toValue: 1, duration: 0, useNativeDriver: native });
      immediate.start(({ finished }) => { if (finished) setIntroDone(true); });
      return () => immediate.stop();
    }
    const intro = Animated.sequence([
      Animated.timing(draw, { toValue: 1, duration: 1050, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }),
      Animated.parallel([
        Animated.timing(reveal, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: native }),
        Animated.sequence([
          Animated.delay(180),
          Animated.timing(word, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: native }),
        ]),
      ]),
      Animated.delay(550),
    ]);
    const pulse = Animated.loop(Animated.sequence([
      Animated.timing(breathe, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: native }),
      Animated.timing(breathe, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: native }),
    ]));
    pulse.start();
    intro.start(({ finished }) => { if (finished) setIntroDone(true); });
    return () => { intro.stop(); pulse.stop(); };
  }, [reducedMotion, draw, reveal, word, breathe]);

  useEffect(() => {
    if (!ready || !introDone) return;
    const fade = Animated.timing(exit, {
      toValue: 0, duration: reducedMotion ? 0 : 480,
      easing: Easing.inOut(Easing.cubic), useNativeDriver: native,
    });
    fade.start(({ finished }) => { if (finished) onComplete(); });
    return () => fade.stop();
  }, [ready, introDone, reducedMotion, exit, onComplete]);

  return (
    <Animated.View
      testID="launch-screen"
      accessibilityRole="progressbar"
      accessibilityLabel="VORQ is starting"
      accessibilityState={{ busy: true }}
      style={[styles.screen, { opacity: exit }]}
    >
      <View style={styles.backdrop} pointerEvents="none" accessible={false}>
        <Svg width="100%" height="100%" preserveAspectRatio="xMidYMid slice" viewBox="0 0 480 900">
          <Defs>
            <RadialGradient id="launch-aura" cx="50%" cy="44%" rx="62%" ry="40%">
              <Stop offset="0" stopColor="#122D48" stopOpacity=".7" />
              <Stop offset=".5" stopColor="#191232" stopOpacity=".35" />
              <Stop offset="1" stopColor="#080C16" stopOpacity="0" />
            </RadialGradient>
            <LinearGradient id="launch-orbit" x1="0" y1="0" x2="1" y2="1">
              <Stop stopColor="#8877FF" stopOpacity=".2" />
              <Stop offset=".5" stopColor="#00E5E6" stopOpacity=".08" />
              <Stop offset="1" stopColor="#00E5E6" stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Rect width="480" height="900" fill="url(#launch-aura)" />
          <Ellipse cx="240" cy="407" rx="190" ry="190" fill="none" stroke="url(#launch-orbit)" strokeWidth=".7" />
          <Ellipse cx="240" cy="407" rx="246" ry="246" fill="none" stroke="url(#launch-orbit)" strokeWidth=".5" />
        </Svg>
      </View>

      <View style={styles.center}>
        <Animated.View style={[styles.logoStage, {
          transform: [{ scale: reveal.interpolate({ inputRange: [0, 1], outputRange: [.94, 1] }) }],
        }]}>
          <Animated.View style={[StyleSheet.absoluteFill, {
            opacity: reveal.interpolate({ inputRange: [0, .7, 1], outputRange: [1, 1, 0] }),
          }]}>
            <Svg width="244" height="176" viewBox="75 40 620 430" fill="none">
              <Defs>
                <LinearGradient id="launch-edge" x1="90" y1="110" x2="670" y2="400" gradientUnits="userSpaceOnUse">
                  <Stop stopColor="#8877FF" /><Stop offset=".4" stopColor="#AC65FF" />
                  <Stop offset=".65" stopColor="#00EAFF" /><Stop offset="1" stopColor="#00DFBF" />
                </LinearGradient>
              </Defs>
              <Path d={silhouette} stroke="#62718F" strokeOpacity=".14" strokeWidth="2" />
              <AnimatedPath d={silhouette} stroke="url(#launch-edge)" strokeWidth="18" strokeOpacity=".12" strokeLinecap="round"
                strokeDasharray="2000 2000" strokeDashoffset={draw.interpolate({ inputRange: [0, 1], outputRange: [2000, 0] })} />
              <AnimatedPath d={silhouette} stroke="url(#launch-edge)" strokeWidth="3.5" strokeLinecap="round"
                strokeDasharray="2000 2000" strokeDashoffset={draw.interpolate({ inputRange: [0, 1], outputRange: [2000, 0] })} />
            </Svg>
          </Animated.View>
          <Animated.View style={{ opacity: reveal }}><Brand size={244} /></Animated.View>
        </Animated.View>

        <Animated.View style={[styles.identity, {
          opacity: word,
          transform: [{ translateY: word.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
        }]}>
          <Text style={styles.wordmark}>VORQ</Text>
          <Text style={styles.tagline}>VISION. STRUCTURE. CONTROL.</Text>
        </Animated.View>
      </View>

      <Animated.View style={[styles.footer, { opacity: word }]}>
        <View style={styles.loadingRow}>
          <Animated.View style={[styles.dot, { opacity: reducedMotion ? 1 : breathe.interpolate({ inputRange: [0, 1], outputRange: [.35, 1] }) }]} />
          <Text style={styles.loadingText}>{ready ? "Your workspace awaits" : "Preparing your workspace"}</Text>
        </View>
        <View style={styles.signature}><View style={[styles.dash, { backgroundColor: "#8877FF" }]} /><View style={[styles.dash, { backgroundColor: "#008DFF" }]} /><View style={[styles.dash, { backgroundColor: "#00DFBF" }]} /></View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, zIndex: 100, backgroundColor: "#080C16", alignItems: "center", justifyContent: "center" },
  backdrop: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
  center: { alignItems: "center", marginTop: -35 },
  logoStage: { width: 244, height: 176 },
  identity: { alignItems: "center", marginTop: 34 },
  wordmark: { fontSize: 35, fontWeight: "500", letterSpacing: 12, paddingLeft: 12, color: "#F3F5FF" },
  tagline: { marginTop: 15, fontSize: 8, letterSpacing: 2.5, color: "#838EA8" },
  footer: { position: "absolute", bottom: "9%", alignItems: "center" },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: "#00DFBF" },
  loadingText: { fontSize: 10, letterSpacing: 1, color: "#8B96AF" },
  signature: { flexDirection: "row", gap: 4, marginTop: 24 },
  dash: { width: 17, height: 2, borderRadius: 1 },
});
