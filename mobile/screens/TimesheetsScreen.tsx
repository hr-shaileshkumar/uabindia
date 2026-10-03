// screens/TimesheetsScreen.tsx — Luxury Enterprise Timesheet & Project Tracker
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useTenant } from "../context/TenantContext";
import { COLORS, SHADOW, RADIUS, SPACING } from "../constants/theme";
import {
  getTimesheets,
  createTimesheet,
  TimesheetItem,
} from "../utils/api";
import { queueOfflineTimesheet } from "../utils/offlineSync";
import OfflineSyncBadge from "../components/OfflineSyncBadge";

export default function TimesheetsScreen({ navigation }: any) {
  const { user } = useAuth();
  const { company } = useTenant();

  const [entries, setEntries] = useState<TimesheetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [projectTitle, setProjectTitle] = useState("HRMS Multi-Tenant Cloud Migration");
  const [taskName, setTaskName] = useState("");
  const [hours, setHours] = useState("8");
  const [notes, setNotes] = useState("");
  const [isBillable, setIsBillable] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const data = await getTimesheets();
      setEntries(data);
    } catch {
      // fallback handled in api.ts
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleCreateTimesheet = async () => {
    const numHours = parseFloat(hours);
    if (!taskName.trim()) {
      Alert.alert("Task Required", "Please enter what task or feature you worked on.");
      return;
    }
    if (isNaN(numHours) || numHours <= 0 || numHours > 24) {
      Alert.alert("Invalid Hours", "Hours must be between 0.5 and 24.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await createTimesheet({
        projectId: "proj-hrms-01",
        workDate: new Date().toISOString().split("T")[0],
        hours: numHours,
        notes: `${taskName}: ${notes.trim()}`,
      });

      Alert.alert("Success", res.message || "Timesheet logged successfully.");
      setTaskName("");
      setNotes("");
      setModalVisible(false);
      loadData();
    } catch (e: any) {
      try {
        await queueOfflineTimesheet({
          projectId: "proj-hrms-01",
          workDate: new Date().toISOString().split("T")[0],
          hours: numHours,
          notes: `${taskName}: ${notes.trim()}`,
        });
        const localEntry: TimesheetItem = {
          id: `offline-${Date.now()}`,
          projectName: "Current Project (Offline)",
          taskTitle: taskName.trim(),
          hours: numHours,
          workDate: new Date().toISOString().split("T")[0],
          status: "Submitted",
          isBillable: true,
          notes: notes.trim(),
        };
        setEntries((prev) => [localEntry, ...prev]);
        setTaskName("");
        setNotes("");
        setModalVisible(false);
        Alert.alert(
          "Saved Offline",
          "Enterprise server unreachable. Your timesheet entry has been saved locally in the SQLite outbox queue and will sync automatically once network returns."
        );
      } catch {
        Alert.alert("Error", e?.message || "Failed to log timesheet.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const totalHoursLogged = entries.reduce((acc, t) => acc + t.hours, 0);
  const weeklyTarget = 40;
  const progressPercent = Math.min(100, Math.round((totalHoursLogged / weeklyTarget) * 100));

  const getStatusBadge = (status: string) => {
    let bg = "#F1F5F9";
    let text = COLORS.textSecondary;
    if (status === "Approved") {
      bg = "#ECFDF5";
      text = "#059669";
    } else if (status === "Submitted") {
      bg = "#FFFBEB";
      text = "#D97706";
    }
    return (
      <View style={[styles.statusBadge, { backgroundColor: bg }]}>
        <Text style={[styles.statusBadgeText, { color: text }]}>{status}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* ── Executive Header ────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation?.goBack?.()}
          >
            <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Timesheet Tracker</Text>
            <Text style={styles.headerSubtitle}>
              {company?.companyName ?? "Enterprise"} • Project Hours
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.newEntryBtn}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="time" size={17} color="#FFFFFF" />
          <Text style={styles.newEntryBtnText}>Log Time</Text>
        </TouchableOpacity>
      </View>

      <OfflineSyncBadge />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* ── Weekly Hours Progress Widget ──────────────────────────────── */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={styles.progressLabel}>This Week's Productive Hours</Text>
              <Text style={styles.progressHours}>
                {totalHoursLogged} <Text style={styles.targetHours}>/ {weeklyTarget} hrs</Text>
              </Text>
            </View>
            <View style={styles.progressPill}>
              <Text style={styles.progressPillText}>{progressPercent}% Target</Text>
            </View>
          </View>

          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${progressPercent}%`, backgroundColor: COLORS.primary },
              ]}
            />
          </View>

          <View style={styles.progressFooter}>
            <Text style={styles.progressFooterText}>
              Standard work week target: 40 hours (Mon - Fri)
            </Text>
            <Text style={[styles.progressFooterText, { fontWeight: "700", color: COLORS.primary }]}>
              {Math.max(0, weeklyTarget - totalHoursLogged)} hrs remaining
            </Text>
          </View>
        </View>

        {/* ── Timesheet Entries Feed ────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Logged Time</Text>
          <Text style={styles.sectionSubtitle}>Project Timesheet Entries</Text>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Syncing project timesheet logs...</Text>
          </View>
        ) : entries.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="hourglass-outline" size={32} color={COLORS.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No timesheet entries found</Text>
            <Text style={styles.emptyDesc}>
              Tap "Log Time" to record your project hours and tasks.
            </Text>
          </View>
        ) : (
          entries.map((entry) => (
            <View key={entry.id} style={styles.timesheetCard}>
              <View style={styles.timesheetTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.projectName}>{entry.projectName}</Text>
                  <Text style={styles.taskTitle}>{entry.taskTitle}</Text>
                </View>
                <View style={styles.hoursBadge}>
                  <Text style={styles.hoursBadgeValue}>{entry.hours}</Text>
                  <Text style={styles.hoursBadgeUnit}>hrs</Text>
                </View>
              </View>

              {entry.notes ? (
                <Text style={styles.timesheetNotes}>{entry.notes}</Text>
              ) : null}

              <View style={styles.timesheetDivider} />

              <View style={styles.timesheetBottom}>
                <View style={styles.metaRow}>
                  <Ionicons name="calendar-outline" size={13} color={COLORS.textMuted} />
                  <Text style={styles.metaText}>
                    {new Date(entry.workDate).toLocaleDateString("en-IN", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                  </Text>
                  <View style={styles.bullet} />
                  <Text style={[styles.metaText, { color: COLORS.primary }]}>
                    {entry.isBillable ? "Billable" : "Internal"}
                  </Text>
                </View>
                {getStatusBadge(entry.status)}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* ── Log Time Modal ────────────────────────────────────────────── */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Log Project Timesheet</Text>
                <Text style={styles.modalSubtitle}>Record hours worked on project deliverables</Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              {/* Project selector */}
              <Text style={styles.inputLabel}>Enterprise Project</Text>
              <View style={styles.projectPillsRow}>
                {[
                  "HRMS Multi-Tenant Cloud Migration",
                  "Banking & Payroll Ledger",
                  "Internal AI Copilot & Automation",
                ].map((proj) => {
                  const sel = projectTitle === proj;
                  return (
                    <TouchableOpacity
                      key={proj}
                      style={[styles.projPill, sel && styles.projPillActive]}
                      onPress={() => setProjectTitle(proj)}
                    >
                      <Ionicons
                        name="briefcase-outline"
                        size={14}
                        color={sel ? "#FFFFFF" : COLORS.textSecondary}
                        style={{ marginRight: 6 }}
                      />
                      <Text style={[styles.projPillText, sel && styles.projPillTextActive]}>
                        {proj}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Task name */}
              <Text style={styles.inputLabel}>Task / Deliverable Name *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Map View GPS geofencing & UI review"
                placeholderTextColor={COLORS.textMuted}
                value={taskName}
                onChangeText={setTaskName}
              />

              {/* Hours */}
              <Text style={styles.inputLabel}>Hours Worked *</Text>
              <View style={styles.hoursInputRow}>
                {[4, 6, 7.5, 8, 9].map((h) => (
                  <TouchableOpacity
                    key={h}
                    style={[styles.quickHourBtn, hours === String(h) && styles.quickHourBtnActive]}
                    onPress={() => setHours(String(h))}
                  >
                    <Text style={[styles.quickHourText, hours === String(h) && styles.quickHourTextActive]}>
                      {h}h
                    </Text>
                  </TouchableOpacity>
                ))}
                <TextInput
                  style={[styles.textInput, { flex: 1, marginLeft: 8 }]}
                  placeholder="Custom"
                  keyboardType="numeric"
                  value={hours}
                  onChangeText={setHours}
                />
              </View>

              {/* Detailed work notes */}
              <Text style={styles.inputLabel}>Activity Notes / Details</Text>
              <TextInput
                style={[styles.textInput, { height: 75, textAlignVertical: "top" }]}
                placeholder="Provide details on features completed or meetings attended"
                placeholderTextColor={COLORS.textMuted}
                multiline
                value={notes}
                onChangeText={setNotes}
              />

              <TouchableOpacity
                style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
                onPress={handleCreateTimesheet}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-done" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.submitBtnText}>Submit Timesheet Log</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingTop: Platform.OS === "ios" ? 54 : 44,
    paddingBottom: SPACING.md,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...SHADOW.sm,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.textMuted,
    marginTop: 2,
  },
  newEntryBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    ...SHADOW.sm,
  },
  newEntryBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 4,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  progressCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
    ...SHADOW.sm,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  progressHours: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  targetHours: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textMuted,
  },
  progressPill: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  progressPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
  },
  progressBarTrack: {
    height: 10,
    backgroundColor: "#F1F5F9",
    borderRadius: RADIUS.full,
    overflow: "hidden",
    marginVertical: 10,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: RADIUS.full,
  },
  progressFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  progressFooterText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 10,
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    padding: 32,
    borderRadius: RADIUS.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 10,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 19,
  },
  timesheetCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.sm,
  },
  timesheetTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  projectName: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.2,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  hoursBadge: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: "center",
    marginLeft: 10,
  },
  hoursBadgeValue: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  hoursBadgeUnit: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: "600",
    marginTop: -2,
  },
  timesheetNotes: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginTop: 8,
  },
  timesheetDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 10,
  },
  timesheetBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginLeft: 4,
  },
  bullet: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: COLORS.textMuted,
    marginHorizontal: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    maxHeight: "85%",
    padding: SPACING.lg,
    ...SHADOW.lg,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  modalSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  modalForm: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 6,
    marginTop: 10,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  projectPillsRow: {
    gap: 8,
    marginBottom: 6,
  },
  projPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "#F8FAFC",
  },
  projPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  projPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  projPillTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.textPrimary,
    backgroundColor: "#F8FAFC",
  },
  hoursInputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  quickHourBtn: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "#F8FAFC",
    marginRight: 6,
  },
  quickHourBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  quickHourText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  quickHourTextActive: {
    color: "#FFFFFF",
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 13,
    borderRadius: RADIUS.lg,
    marginTop: 18,
    marginBottom: 24,
    ...SHADOW.md,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
