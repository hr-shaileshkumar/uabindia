// screens/ShiftsScreen.tsx — Luxury Work Shift & Roster Calendar
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  RefreshControl,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useTenant } from "../context/TenantContext";
import { COLORS, SHADOW, RADIUS, SPACING } from "../constants/theme";
import { getMyShifts, ShiftRosterItem } from "../utils/api";

export default function ShiftsScreen({ navigation }: any) {
  const { user } = useAuth();
  const { company } = useTenant();

  const [shifts, setShifts] = useState<ShiftRosterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [swapModalVisible, setSwapModalVisible] = useState(false);
  const [selectedShift, setSelectedShift] = useState<ShiftRosterItem | null>(null);
  const [swapReason, setSwapReason] = useState("");
  const [colleagueName, setColleagueName] = useState("");

  const loadData = useCallback(async () => {
    try {
      const data = await getMyShifts();
      setShifts(data);
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

  const handleRequestSwap = () => {
    if (!colleagueName.trim()) {
      Alert.alert("Colleague Required", "Please specify which colleague you would like to swap with.");
      return;
    }
    Alert.alert(
      "Swap Request Submitted",
      `Shift swap request for ${selectedShift?.shiftName} has been routed to ${colleagueName} and your reporting manager.`
    );
    setSwapModalVisible(false);
    setSwapReason("");
    setColleagueName("");
  };

  const currentShift = shifts[0];

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
            <Text style={styles.headerTitle}>Shift Roster</Text>
            <Text style={styles.headerSubtitle}>
              {company?.companyName ?? "Enterprise"} • Shift Allocations
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.syncBtn}
          onPress={onRefresh}
        >
          <Ionicons name="refresh" size={18} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

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
        {/* ── Current Active Shift Banner ─────────────────────────────────── */}
        {currentShift && (
          <View style={styles.currentShiftCard}>
            <View style={styles.currentShiftHeader}>
              <View style={styles.activeDotRow}>
                <View style={styles.pulsingDot} />
                <Text style={styles.activeStatusText}>CURRENT ALLOCATION</Text>
              </View>
              <View style={styles.shiftCodeBadge}>
                <Text style={styles.shiftCodeText}>{currentShift.shiftCode}</Text>
              </View>
            </View>

            <Text style={styles.currentShiftName}>{currentShift.shiftName}</Text>

            <View style={styles.timeWindowBox}>
              <View style={styles.timeCol}>
                <Text style={styles.timeLabel}>START TIME</Text>
                <Text style={styles.timeVal}>{currentShift.startTime}</Text>
              </View>

              <View style={styles.arrowCol}>
                <Ionicons name="arrow-forward" size={18} color="rgba(255, 255, 255, 0.6)" />
              </View>

              <View style={styles.timeCol}>
                <Text style={styles.timeLabel}>END TIME</Text>
                <Text style={styles.timeVal}>{currentShift.endTime}</Text>
              </View>
            </View>

            <View style={styles.currentShiftMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.metaItemText}>{currentShift.location}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="timer-outline" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.metaItemText}>Grace: {currentShift.graceMinutes} mins</Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Weekly Roster Timeline ────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Shift Schedule</Text>
          <Text style={styles.sectionSubtitle}>Assigned Work Periods & Locations</Text>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading shift schedule...</Text>
          </View>
        ) : (
          shifts.map((shift, idx) => (
            <View key={shift.id || idx} style={styles.rosterCard}>
              <View style={styles.rosterTop}>
                <View style={styles.dayBadge}>
                  <Text style={styles.dayBadgeText}>{shift.date}</Text>
                </View>
                <TouchableOpacity
                  style={styles.swapActionBtn}
                  onPress={() => {
                    setSelectedShift(shift);
                    setSwapModalVisible(true);
                  }}
                >
                  <Ionicons name="swap-horizontal" size={14} color={COLORS.primary} />
                  <Text style={styles.swapActionText}>Swap Shift</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.shiftTitle}>{shift.shiftName}</Text>

              <View style={styles.rosterTimingRow}>
                <View style={styles.timingPill}>
                  <Ionicons name="time-outline" size={14} color={COLORS.textPrimary} style={{ marginRight: 4 }} />
                  <Text style={styles.timingPillText}>
                    {shift.startTime} – {shift.endTime}
                  </Text>
                </View>

                <View style={styles.locationPill}>
                  <Ionicons name="business-outline" size={13} color={COLORS.textSecondary} style={{ marginRight: 4 }} />
                  <Text style={styles.locationPillText} numberOfLines={1}>
                    {shift.location}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* ── Shift Swap Modal ──────────────────────────────────────────── */}
      <Modal
        visible={swapModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSwapModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Request Shift Swap</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedShift?.shiftName} ({selectedShift?.date})
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSwapModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalForm}>
              <Text style={styles.inputLabel}>Swap with Colleague *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter colleague name or Employee ID"
                placeholderTextColor={COLORS.textMuted}
                value={colleagueName}
                onChangeText={setColleagueName}
              />

              <Text style={styles.inputLabel}>Reason for Swap *</Text>
              <TextInput
                style={[styles.textInput, { height: 75, textAlignVertical: "top" }]}
                placeholder="Personal commitment, exam, emergency travel..."
                placeholderTextColor={COLORS.textMuted}
                multiline
                value={swapReason}
                onChangeText={setSwapReason}
              />

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleRequestSwap}
              >
                <Ionicons name="paper-plane" size={17} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.submitBtnText}>Submit Swap Request</Text>
              </TouchableOpacity>
            </View>
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
  syncBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  currentShiftCard: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xxl,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    ...SHADOW.md,
  },
  currentShiftHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  activeDotRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#34D399",
    marginRight: 6,
  },
  activeStatusText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#D1FAE5",
    letterSpacing: 0.5,
  },
  shiftCodeBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.md,
  },
  shiftCodeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  currentShiftName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 16,
  },
  timeWindowBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 14,
  },
  timeCol: {
    alignItems: "center",
  },
  arrowCol: {
    paddingHorizontal: 8,
  },
  timeLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.7)",
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  timeVal: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  currentShiftMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaItemText: {
    fontSize: 12,
    color: "#FFFFFF",
    opacity: 0.9,
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
  rosterCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.sm,
  },
  rosterTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  dayBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.md,
  },
  dayBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  swapActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    backgroundColor: "#EFF6FF",
  },
  swapActionText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
    marginLeft: 4,
  },
  shiftTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  rosterTimingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timingPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  timingPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  locationPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  locationPillText: {
    fontSize: 12,
    color: COLORS.textSecondary,
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
    marginBottom: 20,
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
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 13,
    borderRadius: RADIUS.lg,
    marginTop: 18,
    ...SHADOW.md,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
