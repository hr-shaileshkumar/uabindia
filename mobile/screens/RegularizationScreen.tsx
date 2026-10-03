// screens/RegularizationScreen.tsx – Executive Attendance Regularization Console
import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Alert, ActivityIndicator, StatusBar, Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { COLORS, SPACING, RADIUS, SHADOW } from "../constants/theme";

const REASONS = [
  "Missed Terminal Punch", "Biometric Sensor Hardware Failure", "Authorized Remote Work",
  "On-Site Client Meeting", "Network & VPN Disruption", "Field Operational Duty",
];

const DEMO_HISTORY = [
  { date: "2026-09-28", type: "Missing Check-Out", reason: "Missed Terminal Punch", status: "Approved" },
  { date: "2026-09-15", type: "Missing Check-In", reason: "Biometric Sensor Hardware Failure", status: "Pending" },
  { date: "2026-09-03", type: "Missing Check-Out", reason: "On-Site Client Meeting", status: "Rejected" },
];

const STATUS_CFG: Record<string, { color: string; bg: string; iconName: keyof typeof Ionicons.glyphMap }> = {
  Approved: { color: "#059669", bg: "#ECFDF5", iconName: "checkmark-circle" },
  Pending:  { color: "#D97706", bg: "#FFFBEB", iconName: "time" },
  Rejected: { color: "#DC2626", bg: "#FEF2F2", iconName: "close-circle" },
};

export default function RegularizationScreen({ navigation }: any) {
  const { user } = useAuth();
  const [tab, setTab] = useState<"apply" | "history">("apply");
  const [date, setDate] = useState("");
  const [punchIn, setPunchIn] = useState("");
  const [punchOut, setPunchOut] = useState("");
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!date || !reason) {
      Alert.alert("Information Required", "Please specify the date of attendance anomaly and select a justification.");
      return;
    }
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 800));
    setSubmitting(false);
    Alert.alert("Request Transmitted", "Regularization petition has been forwarded to supervisory oversight.");
    setDate(""); setPunchIn(""); setPunchOut(""); setReason(""); setCustomReason("");
    setTab("history");
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
          <Text style={styles.headerTitle}>Attendance Regularization</Text>
          <View style={{ width: 22 }} />
        </View>
        <Text style={styles.headerSub}>
          Formal petition for biometric log correction &amp; approval
        </Text>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, tab === "apply" && styles.tabButtonActive]}
          onPress={() => setTab("apply")}
          activeOpacity={0.8}
        >
          <Ionicons
            name="create-outline"
            size={16}
            color={tab === "apply" ? COLORS.primary : COLORS.textMuted}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.tabButtonText, tab === "apply" && styles.tabButtonTextActive]}>
            File Petition
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, tab === "history" && styles.tabButtonActive]}
          onPress={() => setTab("history")}
          activeOpacity={0.8}
        >
          <Ionicons
            name="time-outline"
            size={16}
            color={tab === "history" ? COLORS.primary : COLORS.textMuted}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.tabButtonText, tab === "history" && styles.tabButtonTextActive]}>
            Audit History ({DEMO_HISTORY.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {tab === "apply" ? (
          <>
            {/* Date Input */}
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>INCIDENT DATE *</Text>
              <TextInput
                style={styles.input}
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD (e.g. 2026-10-01)"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>

            {/* Punch Times */}
            <View style={styles.row2}>
              <View style={[styles.fieldWrap, { flex: 1 }]}>
                <Text style={styles.label}>PROPOSED CHECK-IN</Text>
                <TextInput
                  style={styles.input}
                  value={punchIn}
                  onChangeText={setPunchIn}
                  placeholder="09:30 AM"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
              <View style={[styles.fieldWrap, { flex: 1 }]}>
                <Text style={styles.label}>PROPOSED CHECK-OUT</Text>
                <TextInput
                  style={styles.input}
                  value={punchOut}
                  onChangeText={setPunchOut}
                  placeholder="06:30 PM"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
            </View>

            {/* Reason Selector */}
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>JUSTIFICATION REASON *</Text>
              <View style={styles.reasonWrap}>
                {REASONS.map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.reasonChip, reason === r && styles.reasonChipActive]}
                    onPress={() => setReason(r)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.reasonText, reason === r && styles.reasonTextActive]}>
                      {r}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Additional Remarks */}
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>SUPERVISOR EXPLANATION</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                value={customReason}
                onChangeText={setCustomReason}
                placeholder="Detail the circumstances necessitating manual attendance adjustment…"
                placeholderTextColor={COLORS.textMuted}
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.88}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="send" size={17} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.submitBtnText}>Submit for Management Review</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.historyList}>
            {DEMO_HISTORY.map((h, i) => {
              const cfg = STATUS_CFG[h.status] ?? STATUS_CFG.Pending;
              return (
                <View key={i} style={styles.historyCard}>
                  <View style={styles.historyTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.historyType}>{h.type}</Text>
                      <View style={styles.dateRow}>
                        <Ionicons name="calendar-outline" size={12} color={COLORS.textMuted} style={{ marginRight: 4 }} />
                        <Text style={styles.historyDate}>{h.date}</Text>
                      </View>
                    </View>
                    <View style={[styles.statusChip, { backgroundColor: cfg.bg }]}>
                      <Ionicons name={cfg.iconName} size={12} color={cfg.color} style={{ marginRight: 4 }} />
                      <Text style={[styles.statusText, { color: cfg.color }]}>
                        {h.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.reasonBox}>
                    <Text style={styles.historyReason}>{h.reason}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
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
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.md,
  },
  tabButtonActive: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  tabButtonText: { fontSize: 13, fontWeight: "600", color: COLORS.textMuted },
  tabButtonTextActive: { color: COLORS.primary, fontWeight: "800" },
  scroll: { padding: SPACING.lg },
  fieldWrap: { marginBottom: 16 },
  label: { fontSize: 10.5, fontWeight: "700", color: COLORS.textMuted, letterSpacing: 0.6, marginBottom: 7 },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    height: 46,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  textarea: { height: 80, textAlignVertical: "top", paddingTop: 10 },
  row2: { flexDirection: "row", gap: 12 },
  reasonWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  reasonChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "#FFFFFF",
  },
  reasonChipActive: { backgroundColor: "#EFF6FF", borderColor: COLORS.primary },
  reasonText: { fontSize: 12, fontWeight: "600", color: COLORS.textSecondary },
  reasonTextActive: { color: COLORS.primary, fontWeight: "800" },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 15,
    marginTop: 8,
    ...SHADOW.sm,
  },
  submitBtnText: { color: "#FFFFFF", fontSize: 14.5, fontWeight: "800" },
  historyList: { gap: 10 },
  historyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.xs,
  },
  historyTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  historyType: { fontSize: 14, fontWeight: "700", color: COLORS.textPrimary },
  dateRow: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  historyDate: { fontSize: 11.5, color: COLORS.textMuted, fontWeight: "500" },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusText: { fontSize: 10, fontWeight: "800" },
  reasonBox: { backgroundColor: "#F8FAFC", padding: 8, borderRadius: 6 },
  historyReason: { fontSize: 12, color: COLORS.textSecondary },
});
