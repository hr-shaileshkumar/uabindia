// screens/HolidayScreen.tsx – Executive Corporate Holiday Calendar
import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, FlatList,
  StatusBar, ActivityIndicator, TouchableOpacity, Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { getHolidays } from "../utils/api";
import { COLORS, SPACING, RADIUS, SHADOW } from "../constants/theme";

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  National: { bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE" },
  Festival: { bg: "#FFFBEB", text: "#D97706", border: "#FDE68A" },
  Optional: { bg: "#F5F3FF", text: "#7C3AED", border: "#DDD6FE" },
  Regional: { bg: "#ECFDF5", text: "#059669", border: "#A7F3D0" },
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function HolidayScreen({ navigation }: any) {
  const [holidays, setHolidays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const year = new Date().getFullYear();

  useEffect(() => {
    getHolidays(year)
      .then(h => setHolidays(h.sort((a: any, b: any) => a.date.localeCompare(b.date))))
      .catch(() => setHolidays([]))
      .finally(() => setLoading(false));
  }, [year]);

  const upcoming = holidays.filter(h => new Date(h.date) >= new Date());
  const passed = holidays.filter(h => new Date(h.date) < new Date());

  const renderItem = ({ item }: { item: any }) => {
    const d = new Date(item.date);
    const isPast = d < new Date();
    const tc = TYPE_COLORS[item.type] ?? { bg: "#F1F5F9", text: "#475569", border: "#E2E8F0" };

    return (
      <View style={[styles.card, isPast && styles.cardPast]}>
        <View style={[styles.dateBox, isPast && styles.dateBoxPast]}>
          <Text style={[styles.dateDay, isPast && { color: COLORS.textMuted }]}>{d.getDate()}</Text>
          <Text style={[styles.dateMon, isPast && { color: COLORS.textMuted }]}>{MONTHS[d.getMonth()]}</Text>
        </View>

        <View style={styles.info}>
          <Text style={[styles.name, isPast && { color: COLORS.textMuted }]}>{item.name}</Text>
          <View style={styles.weekdayRow}>
            <Ionicons name="calendar-outline" size={12} color={COLORS.textMuted} style={{ marginRight: 4 }} />
            <Text style={styles.weekday}>
              {d.toLocaleDateString("en-IN", { weekday: "long" })}
            </Text>
          </View>
        </View>

        <View style={[styles.typeBadge, { backgroundColor: tc.bg, borderColor: tc.border }]}>
          <Text style={[styles.typeText, { color: tc.text }]}>{item.type ?? "Statutory"}</Text>
        </View>
      </View>
    );
  };

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
          <Text style={styles.headerTitle}>Statutory Holidays</Text>
          <View style={{ width: 22 }} />
        </View>

        <Text style={styles.headerSub}>
          Calendar Year {year} · {holidays.length} Total Observances
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <Ionicons name="sparkles-outline" size={14} color="#38BDF8" />
            <Text style={styles.statNum}>{upcoming.length}</Text>
            <Text style={styles.statLabel}>Upcoming</Text>
          </View>
          <View style={styles.statChip}>
            <Ionicons name="checkmark-done" size={14} color="rgba(255,255,255,0.7)" />
            <Text style={styles.statNum}>{passed.length}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statChip}>
            <Ionicons name="flag-outline" size={14} color="#FBBF24" />
            <Text style={styles.statNum}>{holidays.filter(h => h.type === "National").length}</Text>
            <Text style={styles.statLabel}>National</Text>
          </View>
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.loadingText}>Syncing Corporate Calendar…</Text>
        </View>
      ) : (
        <FlatList
          data={holidays}
          keyExtractor={(_, i) => String(i)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="calendar-outline" size={44} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No statutory holidays published for this period</Text>
            </View>
          }
        />
      )}
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
    marginBottom: 8,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#FFFFFF", letterSpacing: -0.2 },
  headerSub: { fontSize: 12.5, color: "rgba(255,255,255,0.7)", fontWeight: "500", marginBottom: 16 },
  statsRow: { flexDirection: "row", gap: 8 },
  statChip: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.09)",
    borderRadius: RADIUS.md,
    padding: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  statNum: { fontSize: 17, fontWeight: "900", color: "#FFFFFF", marginTop: 2 },
  statLabel: { fontSize: 9.5, color: "rgba(255,255,255,0.7)", fontWeight: "700", textTransform: "uppercase", marginTop: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 40 },
  loadingText: { marginTop: 12, color: COLORS.textSecondary, fontSize: 13, fontWeight: "600" },
  list: { padding: SPACING.lg, gap: 10 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.xs,
  },
  cardPast: { opacity: 0.65 },
  dateBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  dateBoxPast: { backgroundColor: "#F1F5F9", borderColor: "#E2E8F0" },
  dateDay: { fontSize: 17, fontWeight: "900", color: COLORS.primary },
  dateMon: { fontSize: 9.5, fontWeight: "800", color: COLORS.textSecondary, textTransform: "uppercase" },
  info: { flex: 1 },
  name: { fontSize: 14.5, fontWeight: "700", color: COLORS.textPrimary },
  weekdayRow: { flexDirection: "row", alignItems: "center", marginTop: 3 },
  weekday: { fontSize: 11.5, color: COLORS.textMuted, fontWeight: "500" },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  typeText: { fontSize: 10.5, fontWeight: "800" },
  emptyText: { color: COLORS.textMuted, fontSize: 13.5, marginTop: 10 },
});
