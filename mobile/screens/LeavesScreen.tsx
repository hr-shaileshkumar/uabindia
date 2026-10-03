// screens/LeavesScreen.tsx – Executive Leave Management & Allocation Hub
import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Modal, TextInput, Alert, ActivityIndicator, StatusBar, Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import {
  getMyLeaves, getLeaveTypes, applyLeave, cancelLeave,
} from "../utils/api";
import { COLORS, SPACING, RADIUS, SHADOW } from "../constants/theme";

interface StatusConfigItem {
  color: string;
  bg: string;
  borderColor: string;
  iconName: keyof typeof Ionicons.glyphMap;
}

const STATUS_CONFIG: Record<string, StatusConfigItem> = {
  Approved:  { color: "#059669", bg: "#ECFDF5", borderColor: "#A7F3D0", iconName: "checkmark-circle" },
  Pending:   { color: "#D97706", bg: "#FFFBEB", borderColor: "#FDE68A", iconName: "time" },
  Rejected:  { color: "#DC2626", bg: "#FEF2F2", borderColor: "#FECACA", iconName: "close-circle" },
  Cancelled: { color: "#475569", bg: "#F1F5F9", borderColor: "#E2E8F0", iconName: "ban" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export default function LeavesScreen({ navigation }: any) {
  const { user } = useAuth();
  const [tab, setTab] = useState<"balance" | "history">("balance");
  const [loading, setLoading] = useState(true);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [showApply, setShowApply] = useState(false);

  // Apply leave form
  const [form, setForm] = useState({
    leaveTypeId: "", fromDate: "", toDate: "", reason: "",
  });
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [lv, types] = await Promise.all([getMyLeaves(), getLeaveTypes()]);
      setAllocations(lv.allocations ?? []);
      setRequests(lv.requests ?? []);
      setLeaveTypes(types);
    } catch {
      setAllocations([
        { Id: "1", LeaveTypeName: "Casual Leave", LeaveTypeCode: "CL", AllocatedDays: 12, CarryForwardDays: 0, UsedDays: 4 },
        { Id: "2", LeaveTypeName: "Medical / Sick Leave", LeaveTypeCode: "SL", AllocatedDays: 8, CarryForwardDays: 0, UsedDays: 2 },
        { Id: "3", LeaveTypeName: "Privilege / Earned Leave", LeaveTypeCode: "PL", AllocatedDays: 15, CarryForwardDays: 5, UsedDays: 1 },
      ]);
      setRequests([
        { Id: "1", LeaveTypeName: "Casual Leave", FromDate: "2026-09-15", ToDate: "2026-09-16", Days: 2, Reason: "Family emergency commitment", Status: "Approved" },
        { Id: "2", LeaveTypeName: "Medical / Sick Leave", FromDate: "2026-08-22", ToDate: "2026-08-22", Days: 1, Reason: "Seasonal illness recovery", Status: "Approved" },
        { Id: "3", LeaveTypeName: "Casual Leave", FromDate: "2026-10-10", ToDate: "2026-10-12", Days: 3, Reason: "Festival celebration travel", Status: "Pending" },
      ]);
      setLeaveTypes([
        { Id: "1", Name: "Casual Leave", Code: "CL" },
        { Id: "2", Name: "Medical Leave", Code: "SL" },
        { Id: "3", Name: "Privilege Leave", Code: "PL" },
      ]);
    }
    setLoading(false);
  };

  const handleApply = async () => {
    if (!form.leaveTypeId || !form.fromDate || !form.toDate || !form.reason) {
      Alert.alert("Required Fields Missing", "Please select leave category, specify date range, and provide purpose.");
      return;
    }
    const from = new Date(form.fromDate);
    const to = new Date(form.toDate);
    if (to < from) {
      Alert.alert("Chronology Error", "Conclusion date must follow start date.");
      return;
    }
    const days = Math.ceil((to.getTime() - from.getTime()) / 86400000) + 1;
    setApplying(true);
    const res = await applyLeave({ ...form, days });
    setApplying(false);
    if (res.success) {
      Alert.alert("Application Submitted", res.message ?? "Leave request successfully routed to reporting manager.");
      setShowApply(false);
      setForm({ leaveTypeId: "", fromDate: "", toDate: "", reason: "" });
      load();
    } else {
      Alert.alert("Submission Failed", res.message ?? "Could not apply for leave.");
    }
  };

  const handleCancel = async (id: string) => {
    Alert.alert(
      "Revoke Application",
      "Do you wish to cancel this pending leave request?",
      [
        { text: "Dismiss", style: "cancel" },
        {
          text: "Revoke Request",
          style: "destructive",
          onPress: async () => {
            const res = await cancelLeave(id);
            if (res.success) {
              Alert.alert("Revoked", res.message);
              load();
            } else {
              Alert.alert("Error", res.message);
            }
          },
        },
      ]
    );
  };

  const totalAvailable = allocations.reduce(
    (s, a) => s + ((a.AllocatedDays ?? 0) + (a.CarryForwardDays ?? 0) - (a.UsedDays ?? 0)), 0
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#070D18" />

      {/* Executive Header */}
      <LinearGradient colors={["#070D18", "#0A192F", "#0F2E59"]} style={styles.header}>
        <View style={styles.headerNav}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Leave Management</Text>
          <View style={{ width: 22 }} />
        </View>

        <View style={styles.headerSummaryCard}>
          <View>
            <Text style={styles.summaryLabel}>TOTAL REMAINING BALANCE</Text>
            <Text style={styles.summaryValue}>
              {totalAvailable} <Text style={styles.summaryUnit}>Working Days</Text>
            </Text>
          </View>
          <View style={styles.summaryIconBadge}>
            <Ionicons name="airplane" size={24} color="#38BDF8" />
          </View>
        </View>
      </LinearGradient>

      {/* Segmented Tab Bar */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, tab === "balance" && styles.tabButtonActive]}
          onPress={() => setTab("balance")}
          activeOpacity={0.8}
        >
          <Ionicons
            name="pie-chart-outline"
            size={16}
            color={tab === "balance" ? COLORS.primary : COLORS.textMuted}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.tabButtonText, tab === "balance" && styles.tabButtonTextActive]}>
            Quota Allocations
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
            Requests ({requests.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.loadingText}>Fetching Leave Records…</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {tab === "balance" ? (
            <>
              {allocations.map((a, i) => {
                const total = (a.AllocatedDays ?? 0) + (a.CarryForwardDays ?? 0);
                const used = a.UsedDays ?? 0;
                const available = Math.max(0, total - used);
                const pct = total > 0 ? (used / total) * 100 : 0;
                return (
                  <View key={i} style={styles.balanceCard}>
                    <View style={styles.balanceTop}>
                      <View style={styles.leaveCodeBadge}>
                        <Text style={styles.leaveCode}>{a.LeaveTypeCode}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.leaveTypeName}>{a.LeaveTypeName}</Text>
                        <Text style={styles.leaveMeta}>Total Quota: {total} Days</Text>
                      </View>
                      <View style={styles.availPill}>
                        <Text style={styles.availCount}>{available}</Text>
                        <Text style={styles.availLabel}>Left</Text>
                      </View>
                    </View>

                    <View style={styles.progressBg}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${pct}%`,
                            backgroundColor: pct > 80 ? COLORS.error : COLORS.primary,
                          },
                        ]}
                      />
                    </View>

                    <View style={styles.balanceRow}>
                      <Text style={styles.balanceMeta}>Allocated: {a.AllocatedDays ?? 0}</Text>
                      <Text style={styles.balanceMeta}>Consumed: {used}</Text>
                      {(a.CarryForwardDays ?? 0) > 0 && (
                        <Text style={styles.balanceMeta}>Rollover: {a.CarryForwardDays}</Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </>
          ) : (
            <>
              {requests.length === 0 ? (
                <View style={styles.empty}>
                  <Ionicons name="calendar-outline" size={44} color={COLORS.textMuted} />
                  <Text style={styles.emptyText}>No previous leave applications filed</Text>
                </View>
              ) : (
                requests.map((r, i) => {
                  const cfg = STATUS_CONFIG[r.Status] ?? STATUS_CONFIG.Pending;
                  return (
                    <View key={i} style={styles.requestCard}>
                      <View style={styles.requestTop}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.requestType}>{r.LeaveTypeName}</Text>
                          <View style={styles.dateRow}>
                            <Ionicons name="calendar-outline" size={13} color={COLORS.textMuted} style={{ marginRight: 4 }} />
                            <Text style={styles.requestDates}>
                              {formatDate(r.FromDate)} → {formatDate(r.ToDate)}
                            </Text>
                          </View>
                        </View>
                        <View style={[styles.statusChip, { backgroundColor: cfg.bg, borderColor: cfg.borderColor }]}>
                          <Ionicons name={cfg.iconName} size={12} color={cfg.color} style={{ marginRight: 4 }} />
                          <Text style={[styles.statusText, { color: cfg.color }]}>
                            {r.Status.toUpperCase()}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.requestMeta}>
                        <View style={styles.daysTag}>
                          <Text style={styles.daysTagText}>{r.Days} Day{r.Days > 1 ? "s" : ""}</Text>
                        </View>
                        <Text style={styles.requestReason} numberOfLines={1}>
                          {r.Reason}
                        </Text>
                      </View>

                      {r.Status === "Pending" && (
                        <TouchableOpacity
                          style={styles.cancelBtn}
                          onPress={() => handleCancel(r.Id)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="trash-outline" size={14} color={COLORS.error} style={{ marginRight: 6 }} />
                          <Text style={styles.cancelText}>Withdraw Application</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })
              )}
            </>
          )}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* Apply Leave Floating Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowApply(true)}
        activeOpacity={0.88}
      >
        <LinearGradient
          colors={["#0F52BA", "#1D4ED8", "#2563EB"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.fabGrad}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.fabText}>Apply Leave</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Apply Leave Modal */}
      <Modal visible={showApply} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Leave Request</Text>
              <TouchableOpacity onPress={() => setShowApply(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>LEAVE CLASSIFICATION</Text>
            <View style={styles.typeRow}>
              {leaveTypes.map((t) => (
                <TouchableOpacity
                  key={t.Id}
                  style={[styles.typeChip, form.leaveTypeId === t.Id && styles.typeChipActive]}
                  onPress={() => setForm(f => ({ ...f, leaveTypeId: t.Id }))}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.typeChipText, form.leaveTypeId === t.Id && styles.typeChipTextActive]}>
                    {t.Name} ({t.Code})
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>START DATE</Text>
            <TextInput
              style={styles.input}
              value={form.fromDate}
              onChangeText={v => setForm(f => ({ ...f, fromDate: v }))}
              placeholder="YYYY-MM-DD (e.g. 2026-10-15)"
              placeholderTextColor={COLORS.textMuted}
            />

            <Text style={styles.fieldLabel}>END DATE</Text>
            <TextInput
              style={styles.input}
              value={form.toDate}
              onChangeText={v => setForm(f => ({ ...f, toDate: v }))}
              placeholder="YYYY-MM-DD (e.g. 2026-10-17)"
              placeholderTextColor={COLORS.textMuted}
            />

            <Text style={styles.fieldLabel}>JUSTIFICATION / REASON</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={form.reason}
              onChangeText={v => setForm(f => ({ ...f, reason: v }))}
              placeholder="Provide reason for planned absence…"
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setShowApply(false)}
              >
                <Text style={styles.cancelModalText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleApply}
                disabled={applying}
                activeOpacity={0.88}
              >
                {applying ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitText}>Transmit Application</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    marginBottom: 16,
  },
  backButton: { padding: 4 },
  navTitle: { fontSize: 18, fontWeight: "800", color: "#FFFFFF", letterSpacing: -0.2 },
  headerSummaryCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  summaryLabel: { fontSize: 9.5, fontWeight: "700", color: "#38BDF8", letterSpacing: 0.6 },
  summaryValue: { fontSize: 22, fontWeight: "900", color: "#FFFFFF", marginTop: 2 },
  summaryUnit: { fontSize: 13, fontWeight: "500", color: "rgba(255, 255, 255, 0.7)" },
  summaryIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(56, 189, 248, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
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
  empty: { alignItems: "center", paddingVertical: 60 },
  emptyText: { fontSize: 14, color: COLORS.textMuted, marginTop: 10, fontWeight: "500" },

  // Balance
  balanceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.xs,
  },
  balanceTop: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  leaveCodeBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  leaveCode: { fontSize: 13, fontWeight: "900", color: COLORS.primary },
  leaveTypeName: { fontSize: 15, fontWeight: "700", color: COLORS.textPrimary },
  leaveMeta: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  availPill: {
    alignItems: "flex-end",
  },
  availCount: { fontSize: 22, fontWeight: "900", color: COLORS.primary },
  availLabel: { fontSize: 11, fontWeight: "600", color: COLORS.textMuted },
  progressBg: {
    height: 6,
    backgroundColor: "#F1F5F9",
    borderRadius: RADIUS.full,
    overflow: "hidden",
    marginBottom: 10,
  },
  progressFill: { height: 6, borderRadius: RADIUS.full },
  balanceRow: { flexDirection: "row", justifyContent: "space-between" },
  balanceMeta: { fontSize: 12, color: COLORS.textSecondary, fontWeight: "500" },

  // Requests
  requestCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.xs,
  },
  requestTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  requestType: { fontSize: 14.5, fontWeight: "700", color: COLORS.textPrimary },
  dateRow: { flexDirection: "row", alignItems: "center", marginTop: 3 },
  requestDates: { fontSize: 12, color: COLORS.textMuted, fontWeight: "500" },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderWidth: 1,
  },
  statusText: { fontSize: 10.5, fontWeight: "800" },
  requestMeta: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: RADIUS.md,
    gap: 8,
  },
  daysTag: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  daysTagText: { fontSize: 11, fontWeight: "700", color: COLORS.primary },
  requestReason: { fontSize: 12.5, color: COLORS.textSecondary, flex: 1 },
  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  cancelText: { color: COLORS.error, fontSize: 12.5, fontWeight: "700" },

  // FAB
  fab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    borderRadius: RADIUS.full,
    overflow: "hidden",
    ...SHADOW.lg,
  },
  fabGrad: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 22,
  },
  fabText: { color: "#FFFFFF", fontWeight: "800", fontSize: 14, letterSpacing: 0.2 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(7, 13, 24, 0.7)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.xl,
    paddingBottom: Platform.OS === "ios" ? 44 : 28,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  modalTitle: { fontSize: 18, fontWeight: "800", color: COLORS.textPrimary },
  modalCloseBtn: { padding: 4 },
  fieldLabel: {
    fontSize: 10.5,
    fontWeight: "700",
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 12,
  },
  typeRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  typeChip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "#F8FAFC",
  },
  typeChipActive: { backgroundColor: "#EFF6FF", borderColor: COLORS.primary },
  typeChipText: { fontSize: 12, fontWeight: "600", color: COLORS.textSecondary },
  typeChipTextActive: { color: COLORS.primary, fontWeight: "800" },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 12,
    height: 44,
    fontSize: 13.5,
    color: COLORS.textPrimary,
  },
  textarea: { height: 72, textAlignVertical: "top", paddingTop: 10 },
  modalBtns: { flexDirection: "row", gap: 10, marginTop: 22 },
  cancelModalBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: RADIUS.md,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
  },
  cancelModalText: { color: COLORS.textSecondary, fontWeight: "700", fontSize: 13.5 },
  submitBtn: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: "center",
  },
  submitText: { color: "#FFFFFF", fontWeight: "800", fontSize: 14 },
});
