// screens/PayslipScreen.tsx – Executive Payroll & Compensation Portal
import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, ActivityIndicator, Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { getPayslips } from "../utils/api";
import { COLORS, SPACING, RADIUS, SHADOW } from "../constants/theme";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function fmt(n?: number) {
  return (n ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 });
}

export default function PayslipScreen({ navigation }: any) {
  const { user } = useAuth();
  const [payslips, setPayslips] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPayslips()
      .then(data => {
        const demo = data.length > 0 ? data : [
          { Id: "1", Month: 9, Year: 2026, Gross: 75000, Net: 61500, TotalDeductions: 13500, Basic: 40000, HRA: 16000, DA: 6000, SpecialAllowance: 13000, PF: 4800, ESI: 1050, TDS: 7450, Professional_Tax: 200, WorkingDays: 26, PaidDays: 26 },
          { Id: "2", Month: 8, Year: 2026, Gross: 75000, Net: 61500, TotalDeductions: 13500, Basic: 40000, HRA: 16000, DA: 6000, SpecialAllowance: 13000, PF: 4800, ESI: 1050, TDS: 7450, Professional_Tax: 200, WorkingDays: 27, PaidDays: 27 },
          { Id: "3", Month: 7, Year: 2026, Gross: 72000, Net: 58800, TotalDeductions: 13200, Basic: 38000, HRA: 15200, DA: 5800, SpecialAllowance: 13000, PF: 4560, ESI: 1050, TDS: 7390, Professional_Tax: 200, WorkingDays: 27, PaidDays: 26 },
        ];
        setPayslips(demo);
        setSelected(demo[0]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Fetching Statutory Payroll Data…</Text>
      </View>
    );
  }

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
          <Text style={styles.headerTitle}>Compensation &amp; Payroll</Text>
          <View style={{ width: 22 }} />
        </View>

        <Text style={styles.headerSub}>
          {user?.name ?? "Employee"} · Employee Code: {user?.employeeCode ?? "EMP-001"}
        </Text>
      </LinearGradient>

      {/* Month Selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthStrip} contentContainerStyle={styles.monthStripContent}>
        {payslips.map((p) => (
          <TouchableOpacity
            key={p.Id}
            style={[styles.monthChip, selected?.Id === p.Id && styles.monthChipActive]}
            onPress={() => setSelected(p)}
            activeOpacity={0.8}
          >
            <Text style={[styles.monthChipText, selected?.Id === p.Id && styles.monthChipTextActive]}>
              {MONTHS[p.Month - 1].slice(0, 3)} {p.Year}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {selected && (
          <>
            {/* Net Pay Hero Card */}
            <LinearGradient
              colors={["#0F52BA", "#1D4ED8", "#2563EB"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.netCard}
            >
              <Text style={styles.netLabel}>NET DISBURSED SALARY</Text>
              <Text style={styles.netAmount}>₹{fmt(selected.Net)}</Text>
              <Text style={styles.netPeriod}>{MONTHS[selected.Month - 1]} {selected.Year} Settlement</Text>

              <View style={styles.netRow}>
                <View style={styles.netItem}>
                  <Text style={styles.netItemLabel}>Gross Earnings</Text>
                  <Text style={styles.netItemValue}>₹{fmt(selected.Gross)}</Text>
                </View>
                <View style={styles.netDivider} />
                <View style={styles.netItem}>
                  <Text style={styles.netItemLabel}>Total Deductions</Text>
                  <Text style={[styles.netItemValue, { color: "#FCA5A5" }]}>-₹{fmt(selected.TotalDeductions)}</Text>
                </View>
                <View style={styles.netDivider} />
                <View style={styles.netItem}>
                  <Text style={styles.netItemLabel}>Payable Days</Text>
                  <Text style={styles.netItemValue}>{selected.PaidDays}/{selected.WorkingDays}</Text>
                </View>
              </View>
            </LinearGradient>

            {/* Earnings Breakdown */}
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <View style={[styles.sectionIconBox, { backgroundColor: "#ECFDF5" }]}>
                  <Ionicons name="trending-up-outline" size={17} color="#059669" />
                </View>
                <Text style={styles.sectionTitle}>Statutory Earnings</Text>
              </View>

              {[
                ["Basic Salary", selected.Basic],
                ["House Rent Allowance (HRA)", selected.HRA],
                ["Dearness Allowance (DA)", selected.DA],
                ["Special Corporate Allowance", selected.SpecialAllowance],
              ].filter(([, v]) => v).map(([label, val]) => (
                <View key={label as string} style={styles.row}>
                  <Text style={styles.rowLabel}>{label as string}</Text>
                  <Text style={[styles.rowValue, { color: "#059669" }]}>₹{fmt(val as number)}</Text>
                </View>
              ))}

              <View style={[styles.row, styles.totalRow]}>
                <Text style={styles.totalLabel}>Gross Compensation</Text>
                <Text style={[styles.totalValue, { color: "#059669" }]}>₹{fmt(selected.Gross)}</Text>
              </View>
            </View>

            {/* Deductions Breakdown */}
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <View style={[styles.sectionIconBox, { backgroundColor: "#FEF2F2" }]}>
                  <Ionicons name="trending-down-outline" size={17} color="#DC2626" />
                </View>
                <Text style={styles.sectionTitle}>Statutory &amp; Tax Deductions</Text>
              </View>

              {[
                ["Employees' Provident Fund (EPF)", selected.PF],
                ["Employees' State Insurance (ESI)", selected.ESI],
                ["Tax Deducted at Source (TDS)", selected.TDS],
                ["Professional Tax (PT)", selected.Professional_Tax],
              ].filter(([, v]) => v).map(([label, val]) => (
                <View key={label as string} style={styles.row}>
                  <Text style={styles.rowLabel}>{label as string}</Text>
                  <Text style={[styles.rowValue, { color: "#DC2626" }]}>-₹{fmt(val as number)}</Text>
                </View>
              ))}

              <View style={[styles.row, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total Withholdings</Text>
                <Text style={[styles.totalValue, { color: "#DC2626" }]}>-₹{fmt(selected.TotalDeductions)}</Text>
              </View>
            </View>

            {/* Net Summary Bar */}
            <View style={styles.summaryCard}>
              <View>
                <Text style={styles.summaryLabel}>Final Disbursed Net</Text>
                <Text style={styles.summarySub}>Direct deposit to registered bank account</Text>
              </View>
              <Text style={styles.summaryValue}>₹{fmt(selected.Net)}</Text>
            </View>

            <View style={{ height: 40 }} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8FAFC" },
  loadingText: { marginTop: 14, color: COLORS.textSecondary, fontSize: 13.5, fontWeight: "600" },
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
  monthStrip: {
    maxHeight: 54,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  monthStripContent: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: 8,
    gap: 8,
    alignItems: "center",
  },
  monthChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "#F8FAFC",
  },
  monthChipActive: { backgroundColor: "#EFF6FF", borderColor: COLORS.primary },
  monthChipText: { fontSize: 12.5, fontWeight: "600", color: COLORS.textSecondary },
  monthChipTextActive: { color: COLORS.primary, fontWeight: "800" },
  scroll: { padding: SPACING.lg, gap: 14 },
  netCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: "center",
    ...SHADOW.md,
  },
  netLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  netAmount: { fontSize: 36, fontWeight: "900", color: "#FFFFFF", marginTop: 4 },
  netPeriod: { color: "rgba(255,255,255,0.7)", fontSize: 12.5, marginTop: 4, marginBottom: 18, fontWeight: "500" },
  netRow: {
    flexDirection: "row",
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: RADIUS.md,
    paddingVertical: 12,
  },
  netItem: { flex: 1, alignItems: "center" },
  netItemLabel: { color: "rgba(255,255,255,0.7)", fontSize: 10.5, fontWeight: "600", marginBottom: 3 },
  netItemValue: { color: "#FFFFFF", fontSize: 13.5, fontWeight: "800" },
  netDivider: { width: 1, height: 24, backgroundColor: "rgba(255,255,255,0.2)", alignSelf: "center" },
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.xs,
  },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  sectionIconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  sectionTitle: { fontSize: 14.5, fontWeight: "800", color: COLORS.textPrimary },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  rowLabel: { fontSize: 13, color: COLORS.textSecondary, fontWeight: "500" },
  rowValue: { fontSize: 13.5, fontWeight: "700" },
  totalRow: {
    borderBottomWidth: 0,
    borderTopWidth: 1.5,
    borderTopColor: "#E2E8F0",
    marginTop: 6,
    paddingTop: 10,
  },
  totalLabel: { fontSize: 13.5, fontWeight: "800", color: COLORS.textPrimary },
  totalValue: { fontSize: 14.5, fontWeight: "900" },
  summaryCard: {
    backgroundColor: "#EFF6FF",
    borderRadius: RADIUS.lg,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#BFDBFE",
  },
  summaryLabel: { fontSize: 14, fontWeight: "800", color: COLORS.primary },
  summarySub: { fontSize: 11.5, color: COLORS.textMuted, marginTop: 2 },
  summaryValue: { fontSize: 20, fontWeight: "900", color: COLORS.primary },
});
