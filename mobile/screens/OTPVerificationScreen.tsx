// screens/OTPVerificationScreen.tsx – Premium OTP Verification
import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  StatusBar, KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../context/AuthContext";
import { verifyOtp, requestOtp } from "../utils/api";
import { COLORS, SPACING, RADIUS, SHADOW } from "../constants/theme";

const OTP_LENGTH = 6;

export default function OTPVerificationScreen({ route, navigation }: any) {
  const { mobile } = route.params ?? {};
  const { login } = useAuth();
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const refs = useRef<Array<TextInput | null>>(Array(OTP_LENGTH).fill(null));

  useEffect(() => {
    if (resendTimer === 0) return;
    const t = setInterval(() => setResendTimer(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendTimer]);

  const handleInput = (val: string, index: number) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[index] = val;
    setOtp(next);
    if (val && index < OTP_LENGTH - 1) refs.current[index + 1]?.focus();
    if (!val && index > 0) refs.current[index - 1]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length < OTP_LENGTH) { Alert.alert("Required", "Enter the 6-digit OTP"); return; }
    setLoading(true);
    try {
      const { token, user } = await verifyOtp(mobile, code);
      await login(user, token);
    } catch (e: any) {
      Alert.alert("Invalid OTP", e?.message ?? "Please check and try again");
    }
    setLoading(false);
  };

  const handleResend = async () => {
    setResendTimer(30);
    setOtp(Array(OTP_LENGTH).fill(""));
    refs.current[0]?.focus();
    try { await requestOtp(mobile); } catch {}
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0A1628" />
      <LinearGradient colors={["#0A1628", "#0D2137", "#0A3153"]} style={styles.bg}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.kav}>

          {/* Back */}
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          {/* Heading */}
          <View style={styles.heroSection}>
            <View style={styles.iconWrap}>
              <LinearGradient colors={["#1976D2", "#0D47A1"]} style={styles.iconCircle}>
                <Text style={{ fontSize: 32 }}>📱</Text>
              </LinearGradient>
            </View>
            <Text style={styles.title}>Verify OTP</Text>
            <Text style={styles.sub}>
              We sent a 6-digit code to{"\n"}
              <Text style={{ color: "#fff", fontWeight: "800" }}>+91 {mobile}</Text>
            </Text>
          </View>

          {/* OTP Boxes */}
          <View style={styles.card}>
            <Text style={styles.otpLabel}>Enter Verification Code</Text>
            <View style={styles.otpRow}>
              {otp.map((digit, i) => (
                <TextInput
                  key={i}
                  ref={r => { refs.current[i] = r; }}
                  style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                  value={digit}
                  onChangeText={v => handleInput(v, i)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                  textAlign="center"
                />
              ))}
            </View>

            {/* Resend */}
            <View style={styles.resendRow}>
              {resendTimer > 0 ? (
                <Text style={styles.resendTimer}>Resend OTP in <Text style={{ fontWeight: "800" }}>{resendTimer}s</Text></Text>
              ) : (
                <TouchableOpacity onPress={handleResend}>
                  <Text style={styles.resendBtn}>Resend OTP</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Verify Button */}
            <TouchableOpacity
              style={styles.verifyBtn}
              onPress={handleVerify}
              disabled={loading}
              activeOpacity={0.87}
            >
              <LinearGradient colors={["#1976D2", "#0D47A1"]} style={styles.verifyBtnGrad}>
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.verifyBtnText}>Verify &amp; Sign In →</Text>
                }
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>Didn't receive the OTP? Check your SMS inbox.</Text>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  bg: { flex: 1 },
  kav: { flex: 1, paddingHorizontal: SPACING.xl, paddingTop: 60 },
  backBtn: { marginBottom: 24 },
  backText: { color: "rgba(255,255,255,0.7)", fontSize: 15, fontWeight: "600" },
  heroSection: { alignItems: "center", marginBottom: 36 },
  iconWrap: { marginBottom: 20 },
  iconCircle: { width: 80, height: 80, borderRadius: 24, justifyContent: "center", alignItems: "center", ...SHADOW.lg },
  title: { fontSize: 28, fontWeight: "900", color: "#fff", marginBottom: 8 },
  sub: { fontSize: 14, color: "rgba(255,255,255,0.6)", textAlign: "center", lineHeight: 22 },
  card: { backgroundColor: "rgba(255,255,255,0.97)", borderRadius: 28, padding: SPACING.xl, ...SHADOW.lg },
  otpLabel: { fontSize: 13, fontWeight: "700", color: COLORS.textMuted, textAlign: "center", marginBottom: SPACING.lg, textTransform: "uppercase", letterSpacing: 0.5 },
  otpRow: { flexDirection: "row", justifyContent: "space-between", gap: 8, marginBottom: SPACING.lg },
  otpBox: {
    flex: 1, height: 56, borderRadius: RADIUS.md, borderWidth: 2, borderColor: COLORS.border,
    backgroundColor: COLORS.background, fontSize: 24, fontWeight: "800", color: COLORS.textPrimary,
  },
  otpBoxFilled: { borderColor: COLORS.primary, backgroundColor: "#EFF6FF" },
  resendRow: { alignItems: "center", marginBottom: SPACING.lg },
  resendTimer: { fontSize: 13, color: COLORS.textMuted },
  resendBtn: { fontSize: 14, color: COLORS.primary, fontWeight: "700" },
  verifyBtn: { borderRadius: RADIUS.lg, overflow: "hidden", ...SHADOW.md },
  verifyBtnGrad: { paddingVertical: 16, alignItems: "center" },
  verifyBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  footer: { textAlign: "center", color: "rgba(255,255,255,0.35)", fontSize: 12, marginTop: 24 },
});
