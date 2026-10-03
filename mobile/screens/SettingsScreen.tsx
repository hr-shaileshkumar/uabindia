// screens/SettingsScreen.tsx – Executive Settings Hub with Vector Icons & Multi-Tenant Context
import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Switch, StatusBar, Alert, Platform, ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTenant } from "../context/TenantContext";
import { useAuth } from "../context/AuthContext";
import { getPendingOfflineCount, syncOfflineQueue } from "../utils/offlineSync";
import { COLORS, SPACING, RADIUS, SHADOW } from "../constants/theme";

interface SettingRowProps {
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  showDivider?: boolean;
}

function SettingRow({
  iconName,
  iconColor,
  iconBg,
  title,
  subtitle,
  onPress,
  right,
  showDivider = true,
}: SettingRowProps) {
  return (
    <TouchableOpacity
      style={[styles.row, !showDivider && { borderBottomWidth: 0 }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress && !right}
    >
      <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
        <Ionicons name={iconName} size={20} color={iconColor} />
      </View>
      <View style={styles.rowContent}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
      </View>
      {right ? (
        right
      ) : onPress ? (
        <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
      ) : null}
    </TouchableOpacity>
  );
}

export default function SettingsScreen({ navigation }: any) {
  const { user, logout } = useAuth();
  const { company, project, tenant } = useTenant();
  const [notifications, setNotifications] = useState(true);
  const [biometric, setBiometric] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [offlineCounts, setOfflineCounts] = useState({ punches: 0, timesheets: 0, claims: 0, total: 0 });
  const [syncingOffline, setSyncingOffline] = useState(false);

  useEffect(() => {
    getPendingOfflineCount().then(setOfflineCounts).catch(() => {});
  }, []);

  const handleManualSync = async () => {
    setSyncingOffline(true);
    try {
      const res = await syncOfflineQueue();
      const updated = await getPendingOfflineCount();
      setOfflineCounts(updated);
      if (res.syncedCount > 0) {
        Alert.alert("Sync Successful", `${res.syncedCount} offline record(s) uploaded to ERP cloud.`);
      } else {
        Alert.alert("Up to Date", "All local records are synchronized with the cloud.");
      }
    } catch {
      Alert.alert("Offline", "Device is currently unreachable. Records remain saved in local SQLite storage.");
    } finally {
      setSyncingOffline(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "End Session",
      "Are you sure you want to log out from this corporate device?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Log Out", style: "destructive", onPress: logout },
      ]
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#070D18" />

      {/* Executive Header */}
      <LinearGradient colors={["#070D18", "#0A192F", "#0F2E59"]} style={styles.header}>
        <View style={styles.headerNav}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Settings</Text>
          <View style={{ width: 22 }} />
        </View>

        <View style={styles.userCard}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>
              {(user?.name ?? "U")[0].toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.userName}>{user?.name ?? "Employee"}</Text>
            <Text style={styles.userEmail}>{user?.email ?? "employee@uabindia.com"}</Text>
          </View>
          <View style={styles.roleChip}>
            <Text style={styles.roleChipText}>{user?.role?.toUpperCase() ?? "STAFF"}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Enterprise & Organization */}
        <Text style={styles.sectionHeader}>ORGANISATION & WORKSPACE</Text>
        <View style={styles.card}>
          <SettingRow
            iconName="business-outline"
            iconColor="#2563EB"
            iconBg="#EFF6FF"
            title={company?.companyName ?? "Primary Enterprise"}
            subtitle={tenant ? `Tenant: ${tenant.tenantName}` : "Global Workspace"}
            onPress={() => navigation.navigate("CompanySwitcher")}
          />
          <SettingRow
            iconName="folder-outline"
            iconColor="#0D9488"
            iconBg="#F0FDFA"
            title={project?.projectName ?? "Default Operating Project"}
            subtitle="Switch active cost-center / project"
            onPress={() => navigation.navigate("CompanySwitcher")}
            showDivider={false}
          />
        </View>

        {/* Account & Profile */}
        <Text style={styles.sectionHeader}>ACCOUNT & CREDENTIALS</Text>
        <View style={styles.card}>
          <SettingRow
            iconName="person-outline"
            iconColor="#6366F1"
            iconBg="#EEF2FF"
            title="Professional Profile"
            subtitle="Review employment and personal details"
            onPress={() => navigation.navigate("Profile")}
          />
          <SettingRow
            iconName="key-outline"
            iconColor="#D97706"
            iconBg="#FFFBEB"
            title="Change Security Password"
            subtitle="Update authentication credentials"
            onPress={() => navigation.navigate("ChangePassword")}
          />
          <SettingRow
            iconName="document-text-outline"
            iconColor="#7C3AED"
            iconBg="#F5F3FF"
            title="Official Documents"
            subtitle="Contracts, letters, and identity cards"
            onPress={() => navigation.navigate("Documents")}
            showDivider={false}
          />
        </View>

        {/* Device & Preferences */}
        <Text style={styles.sectionHeader}>DEVICE & PREFERENCES</Text>
        <View style={styles.card}>
          <SettingRow
            iconName="notifications-outline"
            iconColor="#F59E0B"
            iconBg="#FFFBEB"
            title="Real-Time Notifications"
            subtitle="Leave approvals, shifts, and broadcasts"
            right={
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: "#E2E8F0", true: COLORS.primary }}
                thumbColor="#FFFFFF"
              />
            }
          />
          <SettingRow
            iconName="finger-print-outline"
            iconColor="#10B981"
            iconBg="#ECFDF5"
            title="Biometric Authentication"
            subtitle="Enable Face ID / Fingerprint fast login"
            right={
              <Switch
                value={biometric}
                onValueChange={setBiometric}
                trackColor={{ false: "#E2E8F0", true: COLORS.primary }}
                thumbColor="#FFFFFF"
              />
            }
          />
          <SettingRow
            iconName="moon-outline"
            iconColor="#64748B"
            iconBg="#F1F5F9"
            title="Dark Mode Appearance"
            subtitle="System dynamic theme (Coming Soon)"
            showDivider={false}
            right={
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                disabled
                trackColor={{ false: "#E2E8F0", true: COLORS.primary }}
                thumbColor="#FFFFFF"
              />
            }
          />
        </View>

        {/* Offline Sync & Outbox */}
        <Text style={styles.sectionHeader}>OFFLINE DATA & OUTBOX</Text>
        <View style={styles.card}>
          <SettingRow
            iconName="cloud-offline-outline"
            iconColor="#D97706"
            iconBg="#FFFBEB"
            title="Local SQLite Outbox"
            subtitle={`${offlineCounts.total} pending record(s) queued locally`}
            right={
              <View style={[styles.badgePill, { backgroundColor: offlineCounts.total > 0 ? "#FEF3C7" : "#F1F5F9" }]}>
                <Text style={[styles.badgeText, { color: offlineCounts.total > 0 ? "#B45309" : "#64748B" }]}>
                  {offlineCounts.total} unsynced
                </Text>
              </View>
            }
          />
          <SettingRow
            iconName="cloud-upload-outline"
            iconColor="#2563EB"
            iconBg="#EFF6FF"
            title="Sync Outbox to Cloud"
            subtitle="Upload queued punches, timesheets & claims"
            onPress={handleManualSync}
            right={syncingOffline ? <ActivityIndicator size="small" color={COLORS.primary} /> : undefined}
          />
          <SettingRow
            iconName="server-outline"
            iconColor="#059669"
            iconBg="#ECFDF5"
            title="Database Engine"
            subtitle={Platform.OS === "web" ? "Web LocalStorage Provider" : "SQLite WAL Engine (uab_offline_erp.db)"}
            showDivider={false}
          />
        </View>

        {/* Legal & Security */}
        <Text style={styles.sectionHeader}>COMPLIANCE & SUPPORT</Text>
        <View style={styles.card}>
          <SettingRow
            iconName="shield-checkmark-outline"
            iconColor="#059669"
            iconBg="#ECFDF5"
            title="Data Privacy & Security"
            subtitle="Enterprise 256-bit encryption policy"
            onPress={() => Alert.alert("Privacy Assurance", "Uabindia Enterprise HRMS strictly adheres to ISO/IEC 27001 data protection protocols.")}
          />
          <SettingRow
            iconName="newspaper-outline"
            iconColor="#475569"
            iconBg="#F1F5F9"
            title="Terms of Employment Service"
            onPress={() => Alert.alert("Terms", "Enterprise terms governed by Uabindia Cloud Master Agreement.")}
          />
          <SettingRow
            iconName="help-circle-outline"
            iconColor="#0284C7"
            iconBg="#F0F9FF"
            title="Enterprise Help Desk"
            subtitle="Contact: support@uabindia.com"
            onPress={() => Alert.alert("Help Desk", "Priority enterprise support: support@uabindia.com\nToll-Free: 1800-UAB-HELP")}
            showDivider={false}
          />
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.error} style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Terminate Active Session</Text>
        </TouchableOpacity>

        {/* Version Information */}
        <View style={styles.versionWrap}>
          <Text style={styles.versionText}>Uabindia HRMS Enterprise · Build v2.4.0 (57)</Text>
          <Text style={styles.tenantTag}>Tenant Isolated · Encrypted Local Cache</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 54 : 44,
    paddingBottom: 22,
    paddingHorizontal: SPACING.xl,
  },
  headerNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  backButton: {
    padding: 4,
  },
  navTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  userAvatar: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  userAvatarText: {
    fontSize: 20,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  userName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  userEmail: {
    fontSize: 12.5,
    color: "rgba(255, 255, 255, 0.65)",
    marginTop: 2,
  },
  roleChip: {
    backgroundColor: "rgba(56, 189, 248, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.35)",
  },
  roleChipText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#38BDF8",
    letterSpacing: 0.5,
  },
  scroll: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginTop: 20,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 13,
  },
  rowContent: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 14.5,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  rowSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  badgePill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF2F2",
    borderRadius: RADIUS.lg,
    paddingVertical: 15,
    marginTop: 26,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  logoutText: {
    color: COLORS.error,
    fontSize: 15,
    fontWeight: "700",
  },
  versionWrap: {
    alignItems: "center",
    marginTop: 24,
  },
  versionText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textMuted,
  },
  tenantTag: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 3,
  },
});
