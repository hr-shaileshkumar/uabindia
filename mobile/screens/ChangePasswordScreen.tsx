// screens/ChangePasswordScreen.tsx – Executive Password & Security Credentials
import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  StatusBar, ScrollView, Alert, ActivityIndicator, Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { COLORS, SPACING, RADIUS, SHADOW } from "../constants/theme";

function getStrength(pwd: string): { score: number; label: string; color: string } {
  let s = 0;
  if (pwd.length >= 8) s++;
  if (/[A-Z]/.test(pwd)) s++;
  if (/[a-z]/.test(pwd)) s++;
  if (/\d/.test(pwd)) s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  const labels = ["", "Inadequate", "Weak", "Moderate", "Secure", "Enterprise Grade"];
  const colors = ["", "#EF4444", "#F97316", "#F59E0B", "#3B82F6", "#10B981"];
  return { score: s, label: labels[s] || "Inadequate", color: colors[s] || "#EF4444" };
}

export default function ChangePasswordScreen({ navigation }: any) {
  const { user } = useAuth();
  const [current, setCurrent] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const strength = newPwd.length > 0 ? getStrength(newPwd) : null;

  const rules = [
    { text: "At least 8 alphanumeric characters", pass: newPwd.length >= 8 },
    { text: "Both uppercase & lowercase letters", pass: /[A-Z]/.test(newPwd) && /[a-z]/.test(newPwd) },
    { text: "Numerical digits included (0-9)", pass: /\d/.test(newPwd) },
    { text: "Special punctuation symbol (@, #, $, %)", pass: /[^A-Za-z0-9]/.test(newPwd) },
  ];

  const handleChange = async () => {
    if (!current) { Alert.alert("Input Required", "Please enter your active enterprise password."); return; }
    if (newPwd.length < 8) { Alert.alert("Security Standard", "New password must contain at least 8 characters."); return; }
    if (newPwd !== confirm) { Alert.alert("Verification Mismatch", "New password and confirmation do not match."); return; }
    if ((strength?.score ?? 0) < 3) { Alert.alert("Password Too Weak", "Please fulfill corporate complexity requirements."); return; }
    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 800));
      Alert.alert("Password Updated", "Your enterprise credentials have been securely updated.", [
        { text: "Continue", onPress: () => navigation.goBack() },
      ]);
      setCurrent(""); setNewPwd(""); setConfirm("");
    } catch {
      Alert.alert("Update Error", "Unable to update credentials at this time.");
    }
    setLoading(false);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#070D18" />

      {/* Header */}
      <LinearGradient colors={["#070D18", "#0A192F", "#0F2E59"]} style={styles.header}>
        <View style={styles.headerNav}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Update Credentials</Text>
          <View style={{ width: 22 }} />
        </View>
        <Text style={styles.headerSub}>{user?.name} · {user?.email}</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {/* Current Password */}
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>EXISTING CORPORATE PASSWORD</Text>
            <View style={styles.inputBox}>
              <Ionicons name="lock-closed-outline" size={18} color={COLORS.textSecondary} style={{ marginRight: 10 }} />
              <TextInput
                style={styles.textInput}
                secureTextEntry={!showCurrent}
                placeholder="Enter current password"
                placeholderTextColor={COLORS.textMuted}
                value={current}
                onChangeText={setCurrent}
              />
              <TouchableOpacity onPress={() => setShowCurrent(v => !v)} style={styles.eyeBtn}>
                <Feather name={showCurrent ? "eye" : "eye-off"} size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* New Password */}
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>NEW SECURITY PASSWORD</Text>
            <View style={styles.inputBox}>
              <Ionicons name="key-outline" size={18} color={COLORS.textSecondary} style={{ marginRight: 10 }} />
              <TextInput
                style={styles.textInput}
                secureTextEntry={!showNew}
                placeholder="Enter new 8+ character password"
                placeholderTextColor={COLORS.textMuted}
                value={newPwd}
                onChangeText={setNewPwd}
              />
              <TouchableOpacity onPress={() => setShowNew(v => !v)} style={styles.eyeBtn}>
                <Feather name={showNew ? "eye" : "eye-off"} size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Password Strength Meter */}
          {strength && (
            <View style={styles.strengthBox}>
              <View style={styles.strengthRow}>
                <Text style={styles.strengthLabel}>Complexity:</Text>
                <Text style={[styles.strengthValue, { color: strength.color }]}>{strength.label}</Text>
              </View>
              <View style={styles.strengthBarBg}>
                <View
                  style={[
                    styles.strengthBarFill,
                    { width: `${(strength.score / 5) * 100}%`, backgroundColor: strength.color },
                  ]}
                />
              </View>
            </View>
          )}

          {/* Confirm New Password */}
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>CONFIRM NEW PASSWORD</Text>
            <View style={styles.inputBox}>
              <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.textSecondary} style={{ marginRight: 10 }} />
              <TextInput
                style={styles.textInput}
                secureTextEntry={!showConfirm}
                placeholder="Re-type new password"
                placeholderTextColor={COLORS.textMuted}
                value={confirm}
                onChangeText={setConfirm}
              />
              <TouchableOpacity onPress={() => setShowConfirm(v => !v)} style={styles.eyeBtn}>
                <Feather name={showConfirm ? "eye" : "eye-off"} size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Complexity Rules */}
          <View style={styles.rulesBox}>
            <Text style={styles.rulesTitle}>PASSWORD POLICIES</Text>
            {rules.map((r, i) => (
              <View key={i} style={styles.ruleItem}>
                <Ionicons
                  name={r.pass ? "checkmark-circle" : "ellipse-outline"}
                  size={14}
                  color={r.pass ? COLORS.emerald : COLORS.textMuted}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.ruleText, r.pass && styles.ruleTextPass]}>{r.text}</Text>
              </View>
            ))}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleChange}
            disabled={loading}
            activeOpacity={0.88}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="lock-closed" size={17} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.submitBtnText}>Update Enterprise Password</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    paddingTop: Platform.OS === "ios" ? 54 : 44,
    paddingBottom: 22,
    paddingHorizontal: SPACING.xl,
  },
  headerNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#FFFFFF", letterSpacing: -0.2 },
  headerSub: { fontSize: 12.5, color: "rgba(255,255,255,0.7)", fontWeight: "500" },
  scroll: { padding: SPACING.lg },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.xs,
  },
  fieldWrap: { marginBottom: 16 },
  label: { fontSize: 10.5, fontWeight: "700", color: COLORS.textMuted, letterSpacing: 0.6, marginBottom: 7 },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 12,
  },
  textInput: {
    flex: 1,
    height: 46,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  eyeBtn: { padding: 6 },
  strengthBox: {
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: RADIUS.md,
    marginBottom: 16,
  },
  strengthRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  strengthLabel: { fontSize: 11.5, color: COLORS.textMuted, fontWeight: "600" },
  strengthValue: { fontSize: 11.5, fontWeight: "800" },
  strengthBarBg: { height: 5, backgroundColor: "#E2E8F0", borderRadius: RADIUS.full, overflow: "hidden" },
  strengthBarFill: { height: 5, borderRadius: RADIUS.full },
  rulesBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  rulesTitle: { fontSize: 10.5, fontWeight: "800", color: COLORS.textMuted, letterSpacing: 0.6, marginBottom: 8 },
  ruleItem: { flexDirection: "row", alignItems: "center", marginBottom: 5 },
  ruleText: { fontSize: 12, color: COLORS.textMuted, fontWeight: "500" },
  ruleTextPass: { color: COLORS.textPrimary, fontWeight: "600" },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    ...SHADOW.sm,
  },
  submitBtnText: { color: "#FFFFFF", fontSize: 14.5, fontWeight: "800" },
});
