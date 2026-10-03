// screens/BiometricLoginScreen.tsx — Executive Biometric Gateway
import React, { useState, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar, Alert, ActivityIndicator, Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as LocalAuthentication from "expo-local-authentication";
import { useAuth } from "../context/AuthContext";
import { loadAuthData } from "../utils/storage.native";
import { COLORS, SPACING, RADIUS, SHADOW } from "../constants/theme";
import BrandLogo from "../components/BrandLogo";

export default function BiometricLoginScreen({ navigation }: any) {
  const { login } = useAuth();
  const [supported, setSupported] = useState(false);
  const [biometricType, setBiometricType] = useState<"fingerprint" | "face" | "iris" | "none">("none");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkBiometric();
  }, []);

  const checkBiometric = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setSupported(compatible && enrolled);
      if (compatible) {
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBiometricType("face");
        } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          setBiometricType("fingerprint");
        } else {
          setBiometricType("iris");
        }
      }
    } catch {
      setSupported(false);
    }
    setChecking(false);
  };

  const handleBiometric = async () => {
    setLoading(true);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate to access Uabindia HRMS",
        cancelLabel: "Use Password",
        disableDeviceFallback: false,
      });

      if (result.success) {
        const saved = await loadAuthData();
        if (saved) {
          await login(saved.user, saved.token);
        } else {
          Alert.alert("Session Required", "Please log in with corporate credentials once to initialize biometric key.");
          navigation.navigate("Login");
        }
      } else {
        const errResult = result as { success: false; error: string; warning?: string };
        if (errResult.error === "UserCancel" || errResult.error === "UserFallback") {
          navigation.navigate("Login");
        } else {
          Alert.alert("Verification Incomplete", "Biometric verification could not be validated. Please use password.");
        }
      }
    } catch {
      Alert.alert("Biometric Service Error", "Biometric authentication is temporarily unavailable.");
    }
    setLoading(false);
  };

  const isFace = biometricType === "face";
  const bioTitle = isFace ? "Face ID" : "Touch ID / Fingerprint";

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#070D18" />
      <LinearGradient colors={["#070D18", "#0A192F", "#0F2E59"]} style={styles.bg}>
        {/* Ambient Top Glow Orbs */}
        <View style={styles.glowOrb1} />
        <View style={styles.glowOrb2} />

        {/* Brand Header */}
        <View style={styles.logoWrap}>
          <BrandLogo size="lg" variant="dark" showWordmark showSubtitle />
        </View>

        {/* Biometric Card */}
        <View style={styles.card}>
          {checking ? (
            <View style={styles.center}>
              <ActivityIndicator color={COLORS.primary} size="large" />
              <Text style={styles.checkingText}>Validating Hardware Security Module…</Text>
            </View>
          ) : supported ? (
            <>
              <View style={styles.badgeTop}>
                <Ionicons name="shield-checkmark" size={16} color={COLORS.emerald} />
                <Text style={styles.badgeTopText}>Hardware-Backed Keystore</Text>
              </View>

              <Text style={styles.cardTitle}>Biometric Verification</Text>
              <Text style={styles.cardSub}>
                Scan your {bioTitle} to instantly authorize your enterprise session.
              </Text>

              {/* Pulsing Biometric Sensor Target */}
              <TouchableOpacity
                style={styles.bioTargetBtn}
                onPress={handleBiometric}
                disabled={loading}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={["#0F52BA", "#1D4ED8", "#2563EB"]}
                  style={styles.bioTargetGrad}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="large" />
                  ) : (
                    <>
                      <View style={styles.sensorIconRing}>
                        <Ionicons
                          name={isFace ? "scan-outline" : "finger-print-outline"}
                          size={54}
                          color="#FFFFFF"
                        />
                      </View>
                      <Text style={styles.bioBtnText}>Authenticate with {bioTitle}</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.dividerRow}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>or switch method</Text>
                <View style={styles.divider} />
              </View>
            </>
          ) : (
            <View style={styles.notSupported}>
              <View style={styles.lockBox}>
                <Ionicons name="lock-closed-outline" size={38} color={COLORS.amber} />
              </View>
              <Text style={styles.noSupportTitle}>Biometrics Not Configured</Text>
              <Text style={styles.noSupportSub}>
                {!checking
                  ? "Enroll your fingerprint or face in device system settings to enable instant enterprise login."
                  : "Checking security status…"}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.pwdBtn}
            onPress={() => navigation.navigate("Login")}
            activeOpacity={0.8}
          >
            <Ionicons name="key-outline" size={18} color={COLORS.textPrimary} style={{ marginRight: 8 }} />
            <Text style={styles.pwdBtnText}>Sign In with Enterprise Credentials</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>End-to-End Encrypted Session · ISO 27001 Compliant</Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  bg: { flex: 1, justifyContent: "center", paddingHorizontal: SPACING.xl },
  glowOrb1: {
    position: "absolute",
    top: -50,
    left: -50,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(37, 99, 235, 0.16)",
  },
  glowOrb2: {
    position: "absolute",
    bottom: -60,
    right: -60,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(2, 132, 199, 0.14)",
  },
  logoWrap: { alignItems: "center", marginBottom: 30 },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
    ...SHADOW.lg,
  },
  center: { alignItems: "center", paddingVertical: 28 },
  checkingText: { marginTop: 14, color: COLORS.textSecondary, fontSize: 13.5, fontWeight: "600" },
  badgeTop: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.emeraldLight,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: "#A7F3D0",
    marginBottom: 12,
  },
  badgeTopText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#059669",
    marginLeft: 5,
  },
  cardTitle: { fontSize: 20, fontWeight: "800", color: COLORS.textPrimary, marginBottom: 6 },
  cardSub: { fontSize: 13, color: COLORS.textSecondary, textAlign: "center", marginBottom: 22, lineHeight: 18 },
  bioTargetBtn: {
    width: "100%",
    borderRadius: RADIUS.lg,
    overflow: "hidden",
    marginBottom: 18,
    ...SHADOW.md,
  },
  bioTargetGrad: {
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  sensorIconRing: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.35)",
    marginBottom: 12,
  },
  bioBtnText: { color: "#FFFFFF", fontSize: 14.5, fontWeight: "800", letterSpacing: 0.2 },
  notSupported: { alignItems: "center", paddingVertical: 20, paddingHorizontal: 10 },
  lockBox: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: "#FFFBEB",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FDE68A",
    marginBottom: 14,
  },
  noSupportTitle: { fontSize: 17, fontWeight: "800", color: COLORS.textPrimary },
  noSupportSub: { fontSize: 13, color: COLORS.textSecondary, textAlign: "center", marginTop: 6, lineHeight: 18 },
  dividerRow: { flexDirection: "row", alignItems: "center", width: "100%", marginBottom: 16 },
  divider: { flex: 1, height: 1, backgroundColor: "#E2E8F0" },
  dividerText: { marginHorizontal: 10, color: COLORS.textMuted, fontSize: 12, fontWeight: "500" },
  pwdBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingVertical: 13,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: "#F8FAFC",
  },
  pwdBtnText: { fontSize: 13.5, fontWeight: "700", color: COLORS.textPrimary },
  footer: { textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: 11.5, marginTop: 22 },
});
