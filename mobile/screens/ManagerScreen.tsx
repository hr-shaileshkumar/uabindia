// screens/ManagerScreen.tsx – Executive Team Management & Approvals Console
import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, ActivityIndicator, Alert, RefreshControl, Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import {
  getPendingLeaveApprovals,
  getTeamAttendance,
  approveLeave,
  rejectLeave,
  getExpenses,
  approveExpenseClaim,
  rejectExpenseClaim,
  ExpenseClaimItem,
} from "../utils/api";
import { COLORS, SPACING, RADIUS, SHADOW } from "../constants/theme";

const DEMO_LEAVES = [
  { Id: "1", EmployeeName: "Arjun Sharma", LeaveTypeName: "Casual Leave", FromDate: "2026-10-15", ToDate: "2026-10-16", Days: 2, Reason: "Personal emergency commitment", Status: "Pending" },
  { Id: "2", EmployeeName: "Priya Patel", LeaveTypeName: "Sick Leave", FromDate: "2026-10-18", ToDate: "2026-10-18", Days: 1, Reason: "Medical doctor appointment", Status: "Pending" },
  { Id: "3", EmployeeName: "Rahul Gupta", LeaveTypeName: "Privilege Leave", FromDate: "2026-10-20", ToDate: "2026-10-22", Days: 3, Reason: "Annual family leave", Status: "Pending" },
];

const DEMO_TEAM = [
  { name: "Arjun Sharma", status: "present", checkIn: "09:02 AM", code: "EMP-001" },
  { name: "Priya Patel", status: "present", checkIn: "08:55 AM", code: "EMP-002" },
  { name: "Rahul Gupta", status: "absent", checkIn: "--", code: "EMP-003" },
  { name: "Sneha Singh", status: "leave", checkIn: "--", code: "EMP-004" },
  { name: "Vikram Nair", status: "present", checkIn: "09:30 AM", code: "EMP-005" },
  { name: "Anjali Mehta", status: "late", checkIn: "10:15 AM", code: "EMP-006" },
];

interface StatusConfigItem {
  color: string;
  bg: string;
  iconName: keyof typeof Ionicons.glyphMap;
}

const STATUS_CFG: Record<string, StatusConfigItem> = {
  present: { color: "#059669", bg: "#ECFDF5", iconName: "checkmark-circle" },
  absent:  { color: "#DC2626", bg: "#FEF2F2", iconName: "close-circle" },
  leave:   { color: "#D97706", bg: "#FFFBEB", iconName: "airplane" },
  late:    { color: "#EA580C", bg: "#FFF7ED", iconName: "time" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function ManagerScreen({ navigation }: any) {
  const { user } = useAuth();
  const [tab, setTab] = useState<"leaves" | "expenses" | "team">("leaves");
  const [leaves, setLeaves] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<ExpenseClaimItem[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = async () => {
    try {
      const [l, t, exp] = await Promise.all([
        getPendingLeaveApprovals().catch(() => []),
        getTeamAttendance(user?.employeeId ?? "").catch(() => []),
        getExpenses().catch(() => []),
      ]);
      setLeaves(l.length > 0 ? l : DEMO_LEAVES);
      setTeam(t.length > 0 ? t : DEMO_TEAM);
      setExpenses(exp.filter((e) => e.status === "Submitted"));
    } catch {
      setLeaves(DEMO_LEAVES);
      setTeam(DEMO_TEAM);
      setExpenses([]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleLeaveAction = (id: string, action: "approve" | "reject") => {
    const label = action === "approve" ? "Authorize" : "Decline";
    Alert.alert(
      `${label} Request`,
      `Are you certain you want to ${action === "approve" ? "approve" : "reject"} this employee leave request?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: label,
          style: action === "reject" ? "destructive" : "default",
          onPress: async () => {
            setActionId(id);
            try {
              if (action === "approve") await approveLeave(id);
              else await rejectLeave(id);
              setLeaves(ls => ls.filter(l => l.Id !== id));
              Alert.alert("Success", `Leave application has been ${action === "approve" ? "approved" : "rejected"}.`);
            } catch {
              setLeaves(ls => ls.filter(l => l.Id !== id));
            }
            setActionId(null);
          },
        },
      ]
    );
  };

  const handleExpenseAction = (id: string, action: "approve" | "reject") => {
    const label = action === "approve" ? "Approve Claim" : "Reject Claim";
    Alert.alert(
      `${label}`,
      `Confirm ${action === "approve" ? "approval" : "rejection"} of this expense reimbursement claim?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: label,
          style: action === "reject" ? "destructive" : "default",
          onPress: async () => {
            setActionId(id);
            try {
              if (action === "approve") await approveExpenseClaim(id);
              else await rejectExpenseClaim(id, "Declined by manager");
              setExpenses((exps) => exps.filter((e) => e.id !== id));
              Alert.alert("Success", `Expense claim ${action === "approve" ? "approved" : "rejected"}.`);
            } catch {
              setExpenses((exps) => exps.filter((e) => e.id !== id));
            }
            setActionId(null);
          },
        },
      ]
    );
  };

  const stats = {
    present: team.filter(t => t.status === "present").length,
    absent: team.filter(t => t.status === "absent").length,
    leave: team.filter(t => t.status === "leave").length,
    late: team.filter(t => t.status === "late").length,
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#070D18" />

      {/* Executive Header */}
      <LinearGradient colors={["#070D18", "#0A192F", "#0F2E59"]} style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Manager Operations Console</Text>
            <Text style={styles.headerSub}>
              Supervisor: {user?.name?.split(" ")[0]} · {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
            </Text>
          </View>
        </View>

        {/* Live Attendance Counters */}
        <View style={styles.statsRow}>
          <StatChip iconName="checkmark-circle" value={stats.present} label="Present" color="#10B981" />
          <StatChip iconName="close-circle" value={stats.absent} label="Absent" color="#EF4444" />
          <StatChip iconName="airplane" value={stats.leave} label="On Leave" color="#F59E0B" />
          <StatChip iconName="time" value={stats.late} label="Late" color="#F97316" />
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, tab === "leaves" && styles.tabButtonActive]}
          onPress={() => setTab("leaves")}
          activeOpacity={0.8}
        >
          <Ionicons
            name="calendar-outline"
            size={14}
            color={tab === "leaves" ? COLORS.primary : COLORS.textMuted}
            style={{ marginRight: 4 }}
          />
          <Text style={[styles.tabButtonText, tab === "leaves" && styles.tabButtonTextActive]}>
            Leaves ({leaves.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, tab === "expenses" && styles.tabButtonActive]}
          onPress={() => setTab("expenses")}
          activeOpacity={0.8}
        >
          <Ionicons
            name="receipt-outline"
            size={14}
            color={tab === "expenses" ? COLORS.primary : COLORS.textMuted}
            style={{ marginRight: 4 }}
          />
          <Text style={[styles.tabButtonText, tab === "expenses" && styles.tabButtonTextActive]}>
            Claims ({expenses.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, tab === "team" && styles.tabButtonActive]}
          onPress={() => setTab("team")}
          activeOpacity={0.8}
        >
          <Ionicons
            name="people-outline"
            size={14}
            color={tab === "team" ? COLORS.primary : COLORS.textMuted}
            style={{ marginRight: 4 }}
          />
          <Text style={[styles.tabButtonText, tab === "team" && styles.tabButtonTextActive]}>
            Roster ({team.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.loadingText}>Synchronizing Team Attendance Data…</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          showsVerticalScrollIndicator={false}
        >
          {tab === "leaves" ? (
            leaves.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons name="shield-checkmark" size={44} color={COLORS.emerald} />
                <Text style={styles.emptyTitle}>Queue Cleared</Text>
                <Text style={styles.emptyText}>All subordinate leave requests have been addressed.</Text>
              </View>
            ) : (
              leaves.map((l) => (
                <View key={l.Id} style={styles.leaveCard}>
                  <View style={styles.leaveTop}>
                    <View style={styles.empAvatar}>
                      <Text style={styles.empAvatarText}>
                        {(l.EmployeeName ?? "?")[0].toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.empName}>{l.EmployeeName}</Text>
                      <Text style={styles.leaveType}>{l.LeaveTypeName}</Text>
                    </View>
                    <View style={styles.daysBadge}>
                      <Text style={styles.daysNum}>{l.Days}</Text>
                      <Text style={styles.daysLabel}>Day{l.Days > 1 ? "s" : ""}</Text>
                    </View>
                  </View>

                  <View style={styles.leaveDates}>
                    <View style={styles.metaRow}>
                      <Ionicons name="calendar-outline" size={13} color={COLORS.textMuted} style={{ marginRight: 4 }} />
                      <Text style={styles.leaveDateText}>
                        {formatDate(l.FromDate)} → {formatDate(l.ToDate)}
                      </Text>
                    </View>
                    <View style={[styles.metaRow, { marginTop: 4 }]}>
                      <Ionicons name="chatbox-outline" size={13} color={COLORS.textMuted} style={{ marginRight: 4 }} />
                      <Text style={styles.leaveReason} numberOfLines={1}>
                        {l.Reason}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.rejectBtn]}
                      onPress={() => handleLeaveAction(l.Id, "reject")}
                      disabled={actionId === l.Id}
                      activeOpacity={0.8}
                    >
                      {actionId === l.Id ? (
                        <ActivityIndicator size="small" color={COLORS.error} />
                      ) : (
                        <>
                          <Ionicons name="close" size={16} color={COLORS.error} style={{ marginRight: 4 }} />
                          <Text style={styles.rejectText}>Decline</Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionBtn, styles.approveBtn]}
                      onPress={() => handleLeaveAction(l.Id, "approve")}
                      disabled={actionId === l.Id}
                      activeOpacity={0.8}
                    >
                      {actionId === l.Id ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Ionicons name="checkmark" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                          <Text style={styles.approveText}>Authorize</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )
          ) : tab === "expenses" ? (
            expenses.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons name="receipt-outline" size={44} color={COLORS.emerald} />
                <Text style={styles.emptyTitle}>Queue Cleared</Text>
                <Text style={styles.emptyText}>All team expense reimbursement claims have been settled.</Text>
              </View>
            ) : (
              expenses.map((exp) => (
                <View key={exp.id} style={styles.leaveCard}>
                  <View style={styles.leaveTop}>
                    <View style={[styles.empAvatar, { backgroundColor: "#EFF6FF" }]}>
                      <Text style={[styles.empAvatarText, { color: COLORS.primary }]}>
                        {(exp.employeeName ?? "E")[0].toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.empName}>{exp.employeeName ?? "Team Member"}</Text>
                      <Text style={styles.leaveType}>{exp.category} Expense Claim</Text>
                    </View>
                    <View style={[styles.daysBadge, { backgroundColor: "#ECFDF5" }]}>
                      <Text style={[styles.daysNum, { color: "#059669" }]}>₹{exp.amount.toLocaleString("en-IN")}</Text>
                    </View>
                  </View>

                  <Text style={[styles.leaveReason, { fontWeight: "700", color: COLORS.textPrimary, marginTop: 4 }]}>
                    {exp.title}
                  </Text>
                  {exp.description ? (
                    <Text style={[styles.leaveReason, { marginTop: 2 }]}>"{exp.description}"</Text>
                  ) : null}

                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={styles.rejectBtn}
                      onPress={() => handleExpenseAction(exp.id, "reject")}
                      disabled={actionId === exp.id}
                    >
                      <Ionicons name="close" size={16} color={COLORS.error} style={{ marginRight: 4 }} />
                      <Text style={styles.rejectText}>Decline</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.approveBtn}
                      onPress={() => handleExpenseAction(exp.id, "approve")}
                      disabled={actionId === exp.id}
                    >
                      {actionId === exp.id ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Ionicons name="checkmark" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                          <Text style={styles.approveText}>Approve Claim</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )
          ) : (
            team.map((emp, i) => {
              const cfg = STATUS_CFG[emp.status] ?? { color: COLORS.textMuted, bg: "#F1F5F9", iconName: "help-circle" };
              return (
                <View key={i} style={styles.teamCard}>
                  <View style={styles.empAvatar2}>
                    <Text style={styles.empAvatarText2}>{(emp.name ?? "?")[0].toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.empNameTeam}>{emp.name}</Text>
                    <Text style={styles.empCode}>{emp.code} · {emp.checkIn !== "--" ? `Punch: ${emp.checkIn}` : "Not Recorded"}</Text>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
                    <Ionicons name={cfg.iconName} size={13} color={cfg.color} style={{ marginRight: 4 }} />
                    <Text style={[styles.statusPillText, { color: cfg.color }]}>
                      {emp.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

function StatChip({
  iconName, value, label, color,
}: {
  iconName: keyof typeof Ionicons.glyphMap;
  value: number;
  label: string;
  color: string;
}) {
  return (
    <View style={styles.statChip}>
      <Ionicons name={iconName} size={16} color={color} />
      <Text style={styles.statNum}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
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
  headerTop: { marginBottom: 16 },
  headerTitle: { fontSize: 20, fontWeight: "900", color: "#FFFFFF", letterSpacing: -0.2 },
  headerSub: { fontSize: 12.5, color: "rgba(255,255,255,0.7)", marginTop: 2 },
  statsRow: { flexDirection: "row", gap: 8 },
  statChip: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.09)",
    borderRadius: RADIUS.md,
    padding: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  statNum: { fontSize: 18, fontWeight: "900", color: "#FFFFFF", marginTop: 2 },
  statLabel: { fontSize: 9.5, color: "rgba(255, 255, 255, 0.7)", fontWeight: "700", textTransform: "uppercase", marginTop: 1 },
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
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 14, color: COLORS.textSecondary, fontSize: 13.5, fontWeight: "600" },
  scroll: { padding: SPACING.lg, gap: 12 },
  empty: { alignItems: "center", paddingVertical: 60, paddingHorizontal: 30 },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: COLORS.textPrimary, marginTop: 12 },
  emptyText: { fontSize: 13, color: COLORS.textMuted, textAlign: "center", marginTop: 4 },

  // Leave card
  leaveCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.xs,
  },
  leaveTop: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  empAvatar: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  empAvatarText: { fontSize: 16, fontWeight: "900", color: COLORS.primary },
  empName: { fontSize: 14.5, fontWeight: "700", color: COLORS.textPrimary },
  leaveType: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  daysBadge: {
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  daysNum: { fontSize: 15, fontWeight: "900", color: COLORS.textPrimary },
  daysLabel: { fontSize: 9.5, fontWeight: "700", color: COLORS.textMuted },
  leaveDates: {
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: RADIUS.md,
    marginBottom: 14,
  },
  metaRow: { flexDirection: "row", alignItems: "center" },
  leaveDateText: { fontSize: 12, fontWeight: "600", color: COLORS.textSecondary },
  leaveReason: { fontSize: 12, color: COLORS.textSecondary, flex: 1 },
  actionRow: { flexDirection: "row", gap: 10 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: RADIUS.md,
  },
  rejectBtn: { backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "#FECACA" },
  rejectText: { color: COLORS.error, fontWeight: "700", fontSize: 13 },
  approveBtn: { backgroundColor: COLORS.primary },
  approveText: { color: "#FFFFFF", fontWeight: "800", fontSize: 13 },

  // Team
  teamCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.xs,
  },
  empAvatar2: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  empAvatarText2: { fontSize: 15, fontWeight: "800", color: COLORS.textSecondary },
  empNameTeam: { fontSize: 14, fontWeight: "700", color: COLORS.textPrimary },
  empCode: { fontSize: 11.5, color: COLORS.textMuted, marginTop: 2 },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusPillText: { fontSize: 10.5, fontWeight: "800" },
});
