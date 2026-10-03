// screens/SplashScreen.tsx – Executive Animated Splash Screen
import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, StatusBar, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import BrandLogo from "../components/BrandLogo";
import { COLORS } from "../constants/theme";

export default function SplashScreen() {
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    const isNative = Platform.OS !== "web";
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, tension: 45, friction: 8, useNativeDriver: isNative }),
      Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: isNative }),
      Animated.spring(translateY, { toValue: 0, tension: 45, friction: 8, useNativeDriver: isNative }),
    ]).start();
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#070D18" />
      <LinearGradient colors={["#070D18", "#0A192F", "#0F2E59"]} style={styles.bg}>
        {/* Ambient Top Glow Orbs */}
        <View style={styles.glowOrb1} />
        <View style={styles.glowOrb2} />

        <Animated.View style={[styles.centerWrap, { transform: [{ scale }, { translateY }], opacity }]}>
          <BrandLogo size="hero" variant="dark" showWordmark showSubtitle />
        </Animated.View>

        <Animated.View style={[styles.footer, { opacity }]}>
          <View style={styles.badgeRow}>
            <Ionicons name="shield-checkmark" size={14} color="#38BDF8" style={{ marginRight: 6 }} />
            <Text style={styles.badgeText}>Enterprise Cloud Infrastructure</Text>
          </View>
          <Text style={styles.version}>Version 2.4.0 · Multi-Tenant Architecture</Text>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  bg: { flex: 1, justifyContent: "center", alignItems: "center" },
  glowOrb1: {
    position: "absolute",
    top: "15%",
    left: "10%",
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "rgba(37, 99, 235, 0.16)",
  },
  glowOrb2: {
    position: "absolute",
    bottom: "20%",
    right: "10%",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(2, 132, 199, 0.12)",
  },
  centerWrap: {
    alignItems: "center",
  },
  footer: {
    position: "absolute",
    bottom: 44,
    alignItems: "center",
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    marginBottom: 8,
  },
  badgeText: {
    color: "#E2E8F0",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  version: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 11,
    fontWeight: "500",
  },
});
