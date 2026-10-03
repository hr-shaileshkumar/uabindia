// screens/ExpensesScreen.tsx — Luxury Enterprise Expense Claims & Reimbursements
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
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useTenant } from "../context/TenantContext";
import { COLORS, SHADOW, RADIUS, SPACING } from "../constants/theme";
import {
  getExpenses,
  createExpenseClaim,
  ExpenseClaimItem,
} from "../utils/api";
import { queueOfflineClaim } from "../utils/offlineSync";
import OfflineSyncBadge from "../components/OfflineSyncBadge";

type FilterStatus = "ALL" | "Submitted" | "Approved" | "Paid";

export default function ExpensesScreen({ navigation }: any) {
  const { user } = useAuth();
  const { company } = useTenant();

  const [claims, setClaims] = useState<ExpenseClaimItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("ALL");
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseClaimItem["category"]>("Travel");
  const [description, setDescription] = useState("");

  const loadData = useCallback(async () => {
    try {
      const data = await getExpenses();
      setClaims(data);
    } catch {
      // demo fallback inside getExpenses
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

  const handleCreateClaim = async () => {
    const numAmount = parseFloat(amount);
    if (!title.trim()) {
      Alert.alert("Required Field", "Please specify what this expense was for.");
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid expense amount.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await createExpenseClaim({
        title: title.trim(),
        category,
        amount: numAmount,
        date: new Date().toISOString().split("T")[0],
        description: description.trim() || undefined,
      });

      Alert.alert("Success", res.message || "Expense claim submitted for approval.");
      setTitle("");
      setAmount("");
      setDescription("");
      setModalVisible(false);
      loadData();
    } catch (e: any) {
      try {
        await queueOfflineClaim({
          title: title.trim(),
          category,
          amount: numAmount,
          date: new Date().toISOString().split("T")[0],
          description: description.trim() || undefined,
        });
        const localClaim: ExpenseClaimItem = {
          id: `offline-exp-${Date.now()}`,
          claimNumber: `EXP-OFF-${Date.now().toString().slice(-4)}`,
          title: title.trim(),
          category,
          amount: numAmount,
          currency: "INR",
          date: new Date().toISOString().split("T")[0],
          status: "Submitted",
          description: description.trim() || undefined,
        };
        setClaims((prev) => [localClaim, ...prev]);
        setTitle("");
        setAmount("");
        setDescription("");
        setModalVisible(false);
        Alert.alert(
          "Claim Saved Offline",
          "Enterprise server unreachable. Your expense reimbursement has been safely queued in SQLite storage and will auto-upload when you reconnect."
        );
      } catch {
        Alert.alert("Error", e?.message || "Failed to submit claim.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const filteredClaims = claims.filter((c) => {
    if (activeFilter === "ALL") return true;
    return c.status === activeFilter;
  });

  const totalClaimed = claims.reduce((acc, c) => acc + c.amount, 0);
  const totalApproved = claims
    .filter((c) => c.status === "Approved" || c.status === "Paid")
    .reduce((acc, c) => acc + c.amount, 0);
  const totalPending = claims
    .filter((c) => c.status === "Submitted")
    .reduce((acc, c) => acc + c.amount, 0);

  const getCategoryIcon = (cat: string): keyof typeof Ionicons.glyphMap => {
    switch (cat) {
      case "Travel":
        return "airplane-outline";
      case "Food":
        return "restaurant-outline";
      case "Software":
        return "laptop-outline";
      case "Office Supplies":
        return "file-tray-stacked-outline";
      default:
        return "receipt-outline";
    }
  };

  const getStatusBadge = (status: string) => {
    let bg = "#F1F5F9";
    let text = COLORS.textSecondary;
    let icon: keyof typeof Ionicons.glyphMap = "time-outline";

    if (status === "Approved") {
      bg = "#ECFDF5";
      text = "#059669";
      icon = "checkmark-circle-outline";
    } else if (status === "Paid") {
      bg = "#EFF6FF";
      text = "#2563EB";
      icon = "wallet-outline";
    } else if (status === "Submitted") {
      bg = "#FFFBEB";
      text = "#D97706";
      icon = "hourglass-outline";
    } else if (status === "Rejected") {
      bg = "#FEF2F2";
      text = "#DC2626";
      icon = "close-circle-outline";
    }

    return (
      <View style={[styles.statusBadge, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={13} color={text} style={{ marginRight: 4 }} />
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
            <Text style={styles.headerTitle}>Expense Claims</Text>
            <Text style={styles.headerSubtitle}>
              {company?.companyName ?? "Enterprise Finance"} • Reimbursable
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.newClaimBtn}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.newClaimBtnText}>New Claim</Text>
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
        {/* ── KPI Summary Cards ─────────────────────────────────────────── */}
        <View style={styles.metricsRow}>
          <View style={[styles.metricCard, { borderLeftColor: COLORS.primary }]}>
            <Text style={styles.metricLabel}>Total Claims</Text>
            <Text style={styles.metricValue}>₹{totalClaimed.toLocaleString("en-IN")}</Text>
            <Text style={styles.metricSub}>{claims.length} registered</Text>
          </View>

          <View style={[styles.metricCard, { borderLeftColor: "#10B981" }]}>
            <Text style={styles.metricLabel}>Approved</Text>
            <Text style={[styles.metricValue, { color: "#059669" }]}>
              ₹{totalApproved.toLocaleString("en-IN")}
            </Text>
            <Text style={styles.metricSub}>Ready for payout</Text>
          </View>

          <View style={[styles.metricCard, { borderLeftColor: "#F59E0B" }]}>
            <Text style={styles.metricLabel}>In Review</Text>
            <Text style={[styles.metricValue, { color: "#D97706" }]}>
              ₹{totalPending.toLocaleString("en-IN")}
            </Text>
            <Text style={styles.metricSub}>Under manager review</Text>
          </View>
        </View>

        {/* ── Segment Filter Tabs ───────────────────────────────────────── */}
        <View style={styles.filterBar}>
          {(["ALL", "Submitted", "Approved", "Paid"] as FilterStatus[]).map((tab) => {
            const active = activeFilter === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setActiveFilter(tab)}
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                  {tab === "ALL" ? "All Claims" : tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Claims List ───────────────────────────────────────────────── */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Fetching expense ledgers...</Text>
          </View>
        ) : filteredClaims.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="receipt-outline" size={32} color={COLORS.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No expense records found</Text>
            <Text style={styles.emptyDesc}>
              Tap "New Claim" above to submit official travel, food, or peripheral reimbursement.
            </Text>
          </View>
        ) : (
          filteredClaims.map((item) => (
            <View key={item.id} style={styles.claimCard}>
              <View style={styles.claimHeader}>
                <View style={styles.categoryBadge}>
                  <Ionicons
                    name={getCategoryIcon(item.category)}
                    size={16}
                    color={COLORS.primary}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.categoryBadgeText}>{item.category}</Text>
                </View>
                {getStatusBadge(item.status)}
              </View>

              <Text style={styles.claimTitle}>{item.title}</Text>
              {item.description ? (
                <Text style={styles.claimDescription}>{item.description}</Text>
              ) : null}

              <View style={styles.claimDivider} />

              <View style={styles.claimFooter}>
                <View>
                  <Text style={styles.claimCode}>{item.claimNumber}</Text>
                  <Text style={styles.claimDate}>
                    {new Date(item.date).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </Text>
                </View>

                <View style={styles.amountWrap}>
                  <Text style={styles.amountCurrency}>₹</Text>
                  <Text style={styles.amountValue}>
                    {item.amount.toLocaleString("en-IN")}
                  </Text>
                </View>
              </View>

              {item.approvedBy && (
                <View style={styles.approverBox}>
                  <Ionicons name="shield-checkmark" size={14} color="#059669" />
                  <Text style={styles.approverText}>
                    Approved by {item.approvedBy}
                  </Text>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* ── New Expense Claim Modal ────────────────────────────────────── */}
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
                <Text style={styles.modalTitle}>File Reimbursement Claim</Text>
                <Text style={styles.modalSubtitle}>Corporate Expense Reimbursement Form</Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              {/* Expense Category */}
              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.categorySelectRow}>
                {(["Travel", "Food", "Software", "Office Supplies", "General"] as const).map(
                  (cat) => {
                    const sel = category === cat;
                    return (
                      <TouchableOpacity
                        key={cat}
                        style={[styles.catOption, sel && styles.catOptionActive]}
                        onPress={() => setCategory(cat)}
                      >
                        <Ionicons
                          name={getCategoryIcon(cat)}
                          size={14}
                          color={sel ? "#FFFFFF" : COLORS.textSecondary}
                          style={{ marginRight: 4 }}
                        />
                        <Text style={[styles.catOptionText, sel && styles.catOptionTextActive]}>
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    );
                  }
                )}
              </View>

              {/* Title */}
              <Text style={styles.inputLabel}>Expense Title / Purpose *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Flight ticket to Bangalore client site"
                placeholderTextColor={COLORS.textMuted}
                value={title}
                onChangeText={setTitle}
              />

              {/* Amount */}
              <Text style={styles.inputLabel}>Amount (INR ₹) *</Text>
              <View style={styles.amountInputWrap}>
                <Text style={styles.currencyPrefix}>₹</Text>
                <TextInput
                  style={[styles.textInput, { flex: 1, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }]}
                  placeholder="0.00"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                />
              </View>

              {/* Description */}
              <Text style={styles.inputLabel}>Notes / Purpose Details (Optional)</Text>
              <TextInput
                style={[styles.textInput, { height: 75, textAlignVertical: "top" }]}
                placeholder="Details of client meeting, travel itinerary or project reference"
                placeholderTextColor={COLORS.textMuted}
                multiline
                value={description}
                onChangeText={setDescription}
              />

              {/* Digital Receipt Notice */}
              <View style={styles.receiptBox}>
                <Ionicons name="document-attach-outline" size={20} color={COLORS.primary} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.receiptBoxTitle}>Digital Receipt Verification</Text>
                  <Text style={styles.receiptBoxSub}>
                    Attached automatically via company expense policy gateway.
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
                onPress={handleCreateClaim}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="paper-plane" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.submitBtnText}>Submit Claim for Approval</Text>
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
  newClaimBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    ...SHADOW.sm,
  },
  newClaimBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 4,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: SPACING.lg,
  },
  metricCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: RADIUS.lg,
    borderLeftWidth: 3.5,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.sm,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.textMuted,
    textTransform: "uppercase",
  },
  metricValue: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginVertical: 4,
  },
  metricSub: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  filterBar: {
    flexDirection: "row",
    backgroundColor: "#EEF2F6",
    borderRadius: RADIUS.lg,
    padding: 4,
    marginBottom: SPACING.lg,
  },
  filterChip: {
    flex: 1,
    paddingVertical: 7,
    alignItems: "center",
    borderRadius: RADIUS.md,
  },
  filterChipActive: {
    backgroundColor: "#FFFFFF",
    ...SHADOW.sm,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: COLORS.primary,
    fontWeight: "700",
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
  claimCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.sm,
  },
  claimHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  claimTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  claimDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  claimDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 10,
  },
  claimFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  claimCode: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  claimDate: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  amountWrap: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  amountCurrency: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primary,
    marginRight: 2,
  },
  amountValue: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.primary,
  },
  approverBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.md,
    marginTop: 10,
  },
  approverText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#059669",
    marginLeft: 6,
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
  categorySelectRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 6,
  },
  catOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "#F8FAFC",
  },
  catOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  catOptionText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  catOptionTextActive: {
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
  amountInputWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  currencyPrefix: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: "#EEF2F6",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRightWidth: 0,
    borderTopLeftRadius: RADIUS.md,
    borderBottomLeftRadius: RADIUS.md,
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  receiptBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    borderRadius: RADIUS.lg,
    padding: 12,
    marginVertical: 14,
  },
  receiptBoxTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#166534",
  },
  receiptBoxSub: {
    fontSize: 11,
    color: "#15803D",
    marginTop: 1,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 13,
    borderRadius: RADIUS.lg,
    marginTop: 12,
    marginBottom: 24,
    ...SHADOW.md,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
