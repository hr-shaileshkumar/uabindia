// screens/PerformanceScreen.tsx — Luxury Performance Appraisal & KPI Tracker
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
import {
  getPerformanceAppraisals,
  AppraisalCycle,
} from "../utils/api";

export default function PerformanceScreen({ navigation }: any) {
  const { user } = useAuth();
  const { company } = useTenant();

  const [cycles, setCycles] = useState<AppraisalCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<AppraisalCycle | null>(null);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [activeKpiIndex, setActiveKpiIndex] = useState<number>(0);
  const [selfScore, setSelfScore] = useState<number>(4.5);
  const [selfComments, setSelfComments] = useState<string>("");

  const loadData = useCallback(async () => {
    try {
      const data = await getPerformanceAppraisals();
      setCycles(data);
      if (data.length > 0 && !selectedCycle) {
        setSelectedCycle(data[0]);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCycle]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleOpenRating = (idx: number) => {
    setActiveKpiIndex(idx);
    const kpi = selectedCycle?.kpis[idx];
    setSelfScore(kpi?.selfRating ?? 4.5);
    setSelfComments(kpi?.comments ?? "");
    setRatingModalVisible(true);
  };

  const handleSaveRating = () => {
    if (!selectedCycle) return;
    const updated = { ...selectedCycle };
    updated.kpis[activeKpiIndex].selfRating = selfScore;
    updated.kpis[activeKpiIndex].comments = selfComments;
    setSelectedCycle(updated);
    setRatingModalVisible(false);
    Alert.alert("Assessment Saved", "Your self-rating and commentary have been recorded for final calibration.");
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
            <Text style={styles.headerTitle}>Performance & Goals</Text>
            <Text style={styles.headerSubtitle}>
              {company?.companyName ?? "Enterprise"} • Annual Appraisal Review
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.syncBtn} onPress={onRefresh}>
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
        {/* ── Cycle Selector Tabs ───────────────────────────────────────── */}
        <View style={styles.cycleTabsRow}>
          {cycles.map((c) => {
            const active = selectedCycle?.id === c.id;
            return (
              <TouchableOpacity
                key={c.id}
                style={[styles.cycleTab, active && styles.cycleTabActive]}
                onPress={() => setSelectedCycle(c)}
              >
                <Text style={[styles.cycleTabText, active && styles.cycleTabTextActive]}>
                  {c.period}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Score Summary Card ────────────────────────────────────────── */}
        {selectedCycle && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <View>
                <Text style={styles.cycleTitle}>{selectedCycle.cycleName}</Text>
                <Text style={styles.cyclePeriod}>{selectedCycle.period}</Text>
              </View>
              <View style={styles.cycleStatusPill}>
                <Text style={styles.cycleStatusText}>{selectedCycle.status}</Text>
              </View>
            </View>

            <View style={styles.scoreRow}>
              <View style={styles.scoreCircle}>
                <Text style={styles.scoreBig}>{selectedCycle.overallScore ?? "4.6"}</Text>
                <Text style={styles.scoreMax}>/ {selectedCycle.maxScore.toFixed(1)}</Text>
              </View>

              <View style={styles.scoreDetails}>
                <Text style={styles.ratingTierTitle}>Exceeds Expectations (Level 4)</Text>
                <Text style={styles.ratingTierDesc}>
                  Strong architectural ownership, high velocity delivery, and consistent leadership impact.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* ── KPI Goals Breakdown ───────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Key Performance Indicators (KPIs)</Text>
          <Text style={styles.sectionSubtitle}>
            Weightage & Review Calibration Metrics
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Fetching performance metrics...</Text>
          </View>
        ) : (
          selectedCycle?.kpis.map((kpi, idx) => (
            <View key={idx} style={styles.kpiCard}>
              <View style={styles.kpiHeader}>
                <View style={styles.weightBadge}>
                  <Text style={styles.weightBadgeText}>{kpi.weightage}% WEIGHT</Text>
                </View>
                <TouchableOpacity
                  style={styles.rateBtn}
                  onPress={() => handleOpenRating(idx)}
                >
                  <Ionicons name="create-outline" size={14} color={COLORS.primary} />
                  <Text style={styles.rateBtnText}>Rate Goal</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.kpiTitle}>{kpi.title}</Text>

              {kpi.comments && (
                <Text style={styles.kpiComments}>{kpi.comments}</Text>
              )}

              <View style={styles.kpiDivider} />

              <View style={styles.kpiRatingsRow}>
                <View style={styles.ratingCol}>
                  <Text style={styles.ratingLabel}>SELF RATING</Text>
                  <View style={styles.starRow}>
                    <Ionicons name="star" size={14} color="#F59E0B" />
                    <Text style={styles.ratingVal}>
                      {kpi.selfRating ? kpi.selfRating.toFixed(1) : "Pending"}
                    </Text>
                  </View>
                </View>

                <View style={styles.ratingCol}>
                  <Text style={styles.ratingLabel}>MANAGER RATING</Text>
                  <View style={styles.starRow}>
                    <Ionicons name="star" size={14} color="#3B82F6" />
                    <Text style={[styles.ratingVal, { color: "#2563EB" }]}>
                      {kpi.managerRating ? kpi.managerRating.toFixed(1) : "In Review"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* ── Self Rating Modal ─────────────────────────────────────────── */}
      <Modal
        visible={ratingModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setRatingModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Self Assessment</Text>
                <Text style={styles.modalSubtitle} numberOfLines={1}>
                  {selectedCycle?.kpis[activeKpiIndex]?.title}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setRatingModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalForm}>
              <Text style={styles.inputLabel}>Select Your Rating (1.0 to 5.0)</Text>
              <View style={styles.scoreSelectorRow}>
                {[3.0, 3.5, 4.0, 4.5, 5.0].map((s) => {
                  const sel = selfScore === s;
                  return (
                    <TouchableOpacity
                      key={s}
                      style={[styles.scoreChoiceBtn, sel && styles.scoreChoiceBtnActive]}
                      onPress={() => setSelfScore(s)}
                    >
                      <Ionicons
                        name="star"
                        size={14}
                        color={sel ? "#FFFFFF" : "#F59E0B"}
                        style={{ marginBottom: 3 }}
                      />
                      <Text style={[styles.scoreChoiceText, sel && styles.scoreChoiceTextActive]}>
                        {s.toFixed(1)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.inputLabel}>Self Accomplishments & Achievements</Text>
              <TextInput
                style={[styles.textInput, { height: 90, textAlignVertical: "top" }]}
                placeholder="Detail key milestones, production deliverables, and business value generated..."
                placeholderTextColor={COLORS.textMuted}
                multiline
                value={selfComments}
                onChangeText={setSelfComments}
              />

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSaveRating}
              >
                <Ionicons name="shield-checkmark" size={17} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.submitBtnText}>Submit Self Evaluation</Text>
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
  cycleTabsRow: {
    flexDirection: "row",
    backgroundColor: "#EEF2F6",
    borderRadius: RADIUS.lg,
    padding: 4,
    marginBottom: SPACING.lg,
  },
  cycleTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: RADIUS.md,
  },
  cycleTabActive: {
    backgroundColor: "#FFFFFF",
    ...SHADOW.sm,
  },
  cycleTabText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  cycleTabTextActive: {
    color: COLORS.primary,
    fontWeight: "700",
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: RADIUS.xxl,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.md,
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  cycleTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  cyclePeriod: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  cycleStatusPill: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  cycleStatusText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.primary,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 14,
    borderRadius: RADIUS.xl,
  },
  scoreCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
    ...SHADOW.sm,
  },
  scoreBig: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  scoreMax: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: -2,
  },
  scoreDetails: {
    flex: 1,
  },
  ratingTierTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginBottom: 3,
  },
  ratingTierDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 17,
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
  kpiCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.sm,
  },
  kpiHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  weightBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  weightBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  rateBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  rateBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
    marginLeft: 4,
  },
  kpiTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  kpiComments: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 10,
  },
  kpiDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: 10,
  },
  kpiRatingsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  ratingCol: {
    flex: 1,
  },
  ratingLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  starRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingVal: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginLeft: 4,
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
    marginBottom: 8,
    marginTop: 10,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  scoreSelectorRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  scoreChoiceBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "#F8FAFC",
  },
  scoreChoiceBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  scoreChoiceText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  scoreChoiceTextActive: {
    color: "#FFFFFF",
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
