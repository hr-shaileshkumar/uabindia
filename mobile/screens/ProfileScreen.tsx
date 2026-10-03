// screens/ProfileScreen.tsx – Executive Employee Profile & Credentials Hub
import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, ActivityIndicator, Alert, Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { getMyProfile } from "../utils/api";
import { COLORS, SPACING, RADIUS, SHADOW } from "../constants/theme";

interface InfoRowProps {
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  label: string;
  value?: string;
  showDivider?: boolean;
}

function InfoRow({
  iconName,
  iconColor,
  iconBg,
  label,
  value,
  showDivider = true,
}: InfoRowProps) {
  return (
    <View style={[styles.infoRow, !showDivider && { borderBottomWidth: 0 }]}>
      <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
        <Ionicons name={iconName} size={18} color={iconColor} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || "—"}</Text>
      </View>
    </View>
  );
}

export default function ProfileScreen({ navigation }: any) {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyProfile()
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, []);

  const emp = profile ?? user;
  const initials = (emp?.FullName ?? emp?.name ?? "U")
    .split(" ")
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to end your current session?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: logout },
    ]);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#070D18" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── Executive Header ────────────────────────────────────────── */}
        <LinearGradient colors={["#070D18", "#0A192F", "#0F2E59"]} style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.onlineDot} />
          </View>

          <Text style={styles.name}>{emp?.FullName ?? emp?.name ?? "Enterprise Employee"}</Text>
          <Text style={styles.code}>{emp?.EmployeeCode ?? emp?.employeeCode ?? "EMP-001"}</Text>

          <View style={styles.badgeRow}>
            <View style={styles.activeBadge}>
              <Ionicons name="shield-checkmark" size={12} color="#10B981" style={{ marginRight: 4 }} />
              <Text style={styles.activeBadgeText}>{emp?.Status ?? "Active"}</Text>
            </View>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>
                {emp?.role?.toUpperCase() ?? "STAFF"}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator color={COLORS.primary} size="large" />
            <Text style={styles.loadingText}>Retrieving Employment Dossier…</Text>
          </View>
        ) : (
          <View style={styles.body}>
            {/* Work Info */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>ORGANISATIONAL POSITIONING</Text>
              <InfoRow
                iconName="business"
                iconColor="#0F52BA"
                iconBg="#EFF6FF"
                label="Active Client / Organization"
                value={emp?.companyName ?? emp?.CompanyName ?? "Reliance Retail Ltd"}
              />
              <InfoRow
                iconName="business-outline"
                iconColor="#2563EB"
                iconBg="#EFF6FF"
                label="Department"
                value={emp?.Department ?? emp?.department ?? "Technology"}
              />
              <InfoRow
                iconName="briefcase-outline"
                iconColor="#0D9488"
                iconBg="#F0FDFA"
                label="Designation"
                value={emp?.Designation ?? emp?.designation ?? "Software Engineer"}
              />
              <InfoRow
                iconName="location-outline"
                iconColor="#7C3AED"
                iconBg="#F5F3FF"
                label="Designated Work Location"
                value={emp?.WorkLocation ?? emp?.workLocation ?? "Corporate Headquarters"}
              />
              <InfoRow
                iconName="calendar-outline"
                iconColor="#D97706"
                iconBg="#FFFBEB"
                label="Date of Joining"
                value={
                  emp?.DateOfJoining
                    ? new Date(emp.DateOfJoining).toLocaleDateString("en-IN", {
                        day: "numeric", month: "long", year: "numeric",
                      })
                    : "01 Jan 2024"
                }
                showDivider={false}
              />
            </View>

            {/* Official Contact */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>OFFICIAL COMMUNICATIONS</Text>
              <InfoRow
                iconName="mail-outline"
                iconColor="#2563EB"
                iconBg="#EFF6FF"
                label="Enterprise Email"
                value={emp?.WorkEmail ?? emp?.email ?? "employee@uabindia.com"}
              />
              <InfoRow
                iconName="call-outline"
                iconColor="#059669"
                iconBg="#ECFDF5"
                label="Primary Phone"
                value={emp?.Phone ?? emp?.phone ?? "+91 98765 43210"}
                showDivider={false}
              />
            </View>

            {/* Quick Actions */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>SECURITY &amp; PREFERENCES</Text>
              <TouchableOpacity
                style={styles.linkRow}
                onPress={() => navigation.navigate("ChangePassword")}
                activeOpacity={0.7}
              >
                <View style={[styles.iconBox, { backgroundColor: "#FFFBEB" }]}>
                  <Ionicons name="key-outline" size={18} color="#D97706" />
                </View>
                <Text style={styles.linkText}>Change Security Password</Text>
                <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.linkRow}
                onPress={() => navigation.navigate("Settings")}
                activeOpacity={0.7}
              >
                <View style={[styles.iconBox, { backgroundColor: "#F1F5F9" }]}>
                  <Ionicons name="settings-outline" size={18} color="#475569" />
                </View>
                <Text style={styles.linkText}>Terminal Settings</Text>
                <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.linkRow, { borderBottomWidth: 0 }]}
                onPress={() => navigation.navigate("Documents")}
                activeOpacity={0.7}
              >
                <View style={[styles.iconBox, { backgroundColor: "#F5F3FF" }]}>
                  <Ionicons name="document-text-outline" size={18} color="#7C3AED" />
                </View>
                <Text style={styles.linkText}>Official Document Vault</Text>
                <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Sign Out Button */}
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
              <Ionicons name="log-out-outline" size={20} color={COLORS.error} style={{ marginRight: 8 }} />
              <Text style={styles.logoutText}>Terminate Active Session</Text>
            </TouchableOpacity>

            <View style={{ height: 32 }} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    paddingTop: Platform.OS === "ios" ? 54 : 44,
    paddingBottom: 32,
    alignItems: "center",
    paddingHorizontal: SPACING.xl,
  },
  backBtn: { alignSelf: "flex-start", marginBottom: 14, padding: 4 },
  avatarWrap: { position: "relative", marginBottom: 12 },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 24,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2.5,
    borderColor: "rgba(255,255,255,0.4)",
    ...SHADOW.md,
  },
  avatarText: { fontSize: 30, fontWeight: "900", color: "#FFFFFF" },
  onlineDot: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#10B981",
    borderWidth: 3,
    borderColor: "#070D18",
  },
  name: { fontSize: 20, fontWeight: "800", color: "#FFFFFF", textAlign: "center", letterSpacing: -0.2 },
  code: { fontSize: 13, color: "rgba(255,255,255,0.65)", marginTop: 3, fontWeight: "600" },
  badgeRow: { flexDirection: "row", gap: 8, marginTop: 14 },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  activeBadgeText: { color: "#059669", fontSize: 11, fontWeight: "800" },
  roleBadge: {
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  roleBadgeText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },
  centerLoading: { padding: 40, alignItems: "center" },
  loadingText: { marginTop: 12, color: COLORS.textSecondary, fontSize: 13.5, fontWeight: "600" },
  body: { padding: SPACING.lg, gap: 14 },
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
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, color: COLORS.textMuted, marginBottom: 2, fontWeight: "500" },
  infoValue: { fontSize: 14, fontWeight: "700", color: COLORS.textPrimary },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  linkText: { flex: 1, fontSize: 14, fontWeight: "600", color: COLORS.textPrimary },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF2F2",
    borderRadius: RADIUS.lg,
    paddingVertical: 15,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  logoutText: { color: COLORS.error, fontSize: 15, fontWeight: "700" },
});
