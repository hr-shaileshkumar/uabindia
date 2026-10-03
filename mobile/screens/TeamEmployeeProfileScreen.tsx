// screens/TeamEmployeeProfileScreen.tsx – Manager View of Individual Subordinate Profile
import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, Image, ActivityIndicator,
  StatusBar, TouchableOpacity, Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING, RADIUS, SHADOW } from "../constants/theme";
import { API_BASE } from "../utils/api";
import { useAuth } from "../context/AuthContext";

export default function TeamEmployeeProfileScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { token } = useAuth();
  const { employeeId } = route.params || {};
  const [profile, setProfile] = useState<any>(null);
  const [attSummary, setAttSummary] = useState<any>(null);
  const [leaveBalance, setLeaveBalance] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const headers = { Authorization: `Bearer ${token}` };
      const [p, a, l] = await Promise.all([
        fetch(`${API_BASE}/employees/${employeeId}`, { headers }).then(r => r.json()).catch(() => null),
        fetch(`${API_BASE}/employees/${employeeId}/attendance/summary`, { headers }).then(r => r.json()).catch(() => null),
        fetch(`${API_BASE}/employees/${employeeId}/leave-balance`, { headers }).then(r => r.json()).catch(() => null),
      ]);
      setProfile(p); setAttSummary(a); setLeaveBalance(l);
      setLoading(false);
    })();
  }, [employeeId, token]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Fetching Subordinate Employment Record…</Text>
      </View>
    );
  }

  const p = profile || {};
  const a = attSummary || {};
  const lb = leaveBalance || { casual: { remaining: 8, total: 12, used: 4 }, medical: { remaining: 6, total: 8, used: 2 } };

  return (
    <View style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      <StatusBar barStyle="light-content" backgroundColor="#070D18" />

      {/* Header */}
      <LinearGradient colors={["#070D18", "#0A192F", "#0F2E59"]} style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.back}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.avatarWrap}>
          {p.photoUrl ? (
            <Image source={{ uri: p.photoUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarLetter}>{(p.name || "E")[0].toUpperCase()}</Text>
            </View>
          )}
        </View>

        <Text style={styles.name}>{p.name || "Team Member"}</Text>
        <Text style={styles.designation}>{p.designation || "Enterprise Associate"}</Text>

        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{p.department || "Technology"}</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{p.employeeId || employeeId || "EMP-001"}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: SPACING.lg, gap: 14 }}>
        {/* Attendance Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>MONTHLY ATTENDANCE AUDIT</Text>
          <View style={styles.statsRow}>
            {[
              { label: "Present", value: a.presentDays ?? 19, color: "#059669", bg: "#ECFDF5" },
              { label: "Absent",  value: a.absentDays  ?? 1,  color: "#DC2626", bg: "#FEF2F2" },
              { label: "Leaves",  value: a.leaveDays   ?? 2,  color: "#D97706", bg: "#FFFBEB" },
              { label: "Late",    value: a.lateDays    ?? 0,  color: "#EA580C", bg: "#FFF7ED" },
            ].map(s => (
              <View key={s.label} style={[styles.statBox, { backgroundColor: s.bg }]}>
                <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Leave Balance */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>REMAINING LEAVE ALLOCATIONS</Text>
          {Object.entries(lb).map(([type, bal]: [string, any]) => (
            <View key={type} style={styles.leaveRow}>
              <View style={styles.leaveHeaderRow}>
                <Text style={styles.leaveType}>{type.charAt(0).toUpperCase() + type.slice(1)} Leave</Text>
                <Text style={styles.leaveRem}>
                  {bal.remaining} <Text style={styles.leaveTotal}>/ {bal.total} Days</Text>
                </Text>
              </View>
              <View style={styles.progressBg}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min((bal.used / (bal.total || 1)) * 100, 100)}%` as any,
                      backgroundColor: bal.remaining <= 1 ? COLORS.error : COLORS.primary,
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>

        {/* Contact Information */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>COMMUNICATIONS &amp; HIERARCHY</Text>
          {[
            { icon: "mail-outline" as const, label: "Work Email", val: p.email ?? "employee@uabindia.com" },
            { icon: "call-outline" as const, label: "Mobile Phone", val: p.phone ?? "+91 98765 43210" },
            { icon: "business-outline" as const, label: "Operating Entity", val: p.companyName ?? "Uabindia Technologies" },
            { icon: "shield-checkmark-outline" as const, label: "Security Role", val: p.role?.toUpperCase() ?? "STAFF" },
          ].map((item, i) => (
            <View key={i} style={styles.infoRow}>
              <View style={styles.iconBox}>
                <Ionicons name={item.icon} size={16} color={COLORS.primary} />
              </View>
              <Text style={styles.infoLabel}>{item.label}</Text>
              <Text style={styles.infoValue}>{item.val}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8FAFC" },
  loadingText: { marginTop: 14, color: COLORS.textSecondary, fontSize: 13.5, fontWeight: "600" },
  header: {
    paddingTop: Platform.OS === "ios" ? 54 : 44,
    paddingBottom: 28,
    paddingHorizontal: SPACING.xl,
    alignItems: "center",
  },
  back: { alignSelf: "flex-start", marginBottom: 12, padding: 4 },
  avatarWrap: { marginBottom: 12 },
  avatar: { width: 80, height: 80, borderRadius: 24, borderWidth: 2.5, borderColor: "#FFFFFF" },
  avatarFallback: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2.5,
    borderColor: "#FFFFFF",
  },
  avatarLetter: { fontSize: 30, fontWeight: "900", color: "#FFFFFF" },
  name: { fontSize: 20, fontWeight: "800", color: "#FFFFFF" },
  designation: { fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 3 },
  badgeRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  badge: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  badgeText: { color: "#FFFFFF", fontSize: 11, fontWeight: "700" },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.xs,
  },
  cardTitle: {
    fontSize: 10.5,
    fontWeight: "800",
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  statsRow: { flexDirection: "row", gap: 8 },
  statBox: {
    flex: 1,
    alignItems: "center",
    borderRadius: RADIUS.md,
    paddingVertical: 10,
  },
  statValue: { fontSize: 18, fontWeight: "900" },
  statLabel: { fontSize: 10.5, color: COLORS.textMuted, marginTop: 2, fontWeight: "700" },
  leaveRow: { marginBottom: 12 },
  leaveHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 5 },
  leaveType: { fontSize: 13, fontWeight: "600", color: COLORS.textPrimary },
  leaveRem: { fontSize: 13, fontWeight: "800", color: COLORS.primary },
  leaveTotal: { fontSize: 11.5, color: COLORS.textMuted, fontWeight: "500" },
  progressBg: { height: 6, backgroundColor: "#F1F5F9", borderRadius: 3, overflow: "hidden" },
  progressFill: { height: 6, borderRadius: 3 },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  iconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  infoLabel: { flex: 1, fontSize: 13, color: COLORS.textSecondary, fontWeight: "500" },
  infoValue: { fontSize: 13, fontWeight: "700", color: COLORS.textPrimary },
});
