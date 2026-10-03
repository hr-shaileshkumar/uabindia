// screens/DashboardScreen.tsx – Executive Corporate HRMS Dashboard
import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, StatusBar, ActivityIndicator, Dimensions, Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useTenant } from "../context/TenantContext";
import {
  getDashboard,
  clockIn,
  clockOut,
  getCompanyAnnouncements,
  DashboardData,
  CompanyAnnouncement,
} from "../utils/api";
import { queueOfflinePunch } from "../utils/offlineSync";
import OfflineSyncBadge from "../components/OfflineSyncBadge";
import { COLORS, SPACING, RADIUS, SHADOW } from "../constants/theme";

const { width } = Dimensions.get("window");

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function formatTime(iso?: string) {
  if (!iso) return "--:--";
  const d = new Date(iso);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function greet(name: string) {
  const h = new Date().getHours();
  const g = h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : "Good Evening";
  const first = name.split(" ")[0];
  return `${g}, ${first}`;
}

export default function DashboardScreen({ navigation }: any) {
  const { user } = useAuth();
  const { company } = useTenant();
  const [data, setData] = useState<DashboardData | null>(null);
  const [announcements, setAnnouncements] = useState<CompanyAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [clocking, setClocking] = useState(false);

  const load = useCallback(async () => {
    try {
      const [d, ann] = await Promise.all([
        getDashboard().catch(() => null),
        getCompanyAnnouncements().catch(() => []),
      ]);
      if (d) setData(d);
      setAnnouncements(ann);
    } catch {
      setData({
        employee: {
          Id: user?.employeeId ?? "",
          EmployeeCode: user?.employeeCode || (user?.employeeId ? `EMP-${user.employeeId.slice(0, 4)}` : "—"),
          FullName: user?.name || "Staff Member",
          WorkEmail: user?.email || "—",
          Phone: user?.phone ?? "",
          DateOfJoining: user?.dateOfJoining ?? "",
          Status: "Active",
          Department: user?.department || "General",
          Designation: user?.designation || "Employee",
          WorkLocation: user?.workLocation || "—",
        },
        today: {
          date: new Date().toISOString().split("T")[0],
          clockStatus: "ClockedOut",
          totalPunchesToday: 0,
        },
        monthlyAttendance: {
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
          daysPresent: 0,
        },
        leaveBalance: { totalAllocated: 0, taken: 0, available: 0, pendingRequests: 0 },
        recentPayslips: [],
      });
    }
  }, [user]);

  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleClockToggle = async () => {
    if (!data || clocking) return;
    setClocking(true);
    const targetStatus = data.today.clockStatus === "ClockedOut" ? "IN" : "OUT";
    try {
      if (data.today.clockStatus === "ClockedOut") {
        await clockIn();
        setData(d => d ? { ...d, today: { ...d.today, clockStatus: "ClockedIn", firstPunchIn: new Date().toISOString() } } : d);
      } else {
        await clockOut();
        setData(d => d ? { ...d, today: { ...d.today, clockStatus: "ClockedOut", lastPunchOut: new Date().toISOString() } } : d);
      }
    } catch {
      // Offline fallback: store in local SQLite outbox queue
      try {
        await queueOfflinePunch({
          employeeId: user?.employeeId ?? "",
          punchType: targetStatus,
          latitude: 0,
          longitude: 0,
          source: "MobileApp_QuickPunch",
        });
        if (targetStatus === "IN") {
          setData(d => d ? { ...d, today: { ...d.today, clockStatus: "ClockedIn", firstPunchIn: new Date().toISOString() } } : d);
        } else {
          setData(d => d ? { ...d, today: { ...d.today, clockStatus: "ClockedOut", lastPunchOut: new Date().toISOString() } } : d);
        }
      } catch {}
    }
    setClocking(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Syncing Enterprise Dashboard…</Text>
      </View>
    );
  }

  const isClockedIn = data?.today?.clockStatus === "ClockedIn";
  const leaveAvail = data?.leaveBalance?.available ?? 0;
  const leaveTaken = data?.leaveBalance?.taken ?? 0;
  const leaveTotal = data?.leaveBalance?.totalAllocated ?? 24;
  const daysPresent = data?.monthlyAttendance?.daysPresent ?? 0;
  const month = MONTH_NAMES[(data?.monthlyAttendance?.month ?? 1) - 1];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#070D18" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* ── Executive Header ────────────────────────────────────────── */}
        <LinearGradient colors={["#070D18", "#0A192F", "#0F2E59"]} style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.avatarWrap}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(data?.employee?.FullName ?? user?.name ?? "U")[0].toUpperCase()}
                </Text>
              </View>
              <View style={styles.onlineDot} />
            </View>

            <View style={{ flex: 1, marginLeft: 14 }}>
              <TouchableOpacity
                style={styles.companyPill}
                onPress={() => navigation.navigate("CompanySwitcher")}
                activeOpacity={0.8}
              >
                <Ionicons name="business" size={11} color="#38BDF8" style={{ marginRight: 4 }} />
                <Text style={styles.companyPillText} numberOfLines={1}>
                  {company?.companyName ?? "Uabindia Enterprise"}
                </Text>
                <Ionicons name="chevron-forward" size={10} color="#38BDF8" style={{ marginLeft: 3 }} />
              </TouchableOpacity>
              <Text style={styles.greet}>{greet(data?.employee?.FullName ?? user?.name ?? "User")}</Text>
              <Text style={styles.role}>{data?.employee?.Designation ?? user?.designation ?? "Employee"}</Text>
            </View>

            <TouchableOpacity
              style={styles.notifBtn}
              onPress={() => navigation.navigate("Notifications")}
              activeOpacity={0.8}
            >
              <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
              <View style={styles.notifBadgeDot} />
            </TouchableOpacity>
          </View>

          {/* Date & Shift Bar */}
          <View style={styles.dateBar}>
            <Ionicons name="calendar-outline" size={14} color="#94A3B8" style={{ marginRight: 6 }} />
            <Text style={styles.dateText}>
              {new Date().toLocaleDateString("en-IN", {
                weekday: "short", day: "numeric", month: "short", year: "numeric",
              })}
            </Text>
            <View style={styles.dateBarDivider} />
            <Ionicons name="time-outline" size={14} color="#94A3B8" style={{ marginRight: 4 }} />
            <Text style={styles.shiftText}>General Shift (09:30 - 18:30)</Text>
          </View>
        </LinearGradient>

        <OfflineSyncBadge />

        {/* ── Clock In/Out Hero Card ──────────────────────────────────── */}
        <View style={styles.heroCard}>
          <View style={styles.clockRow}>
            <View style={styles.clockInfo}>
              <View style={[styles.statusBadge, isClockedIn ? styles.statusIn : styles.statusOut]}>
                <View style={[styles.statusDot, isClockedIn ? styles.dotIn : styles.dotOut]} />
                <Text style={[styles.statusText, { color: isClockedIn ? COLORS.emerald : COLORS.amber }]}>
                  {isClockedIn ? "Active On Shift" : "Not Checked In"}
                </Text>
              </View>
              <Text style={styles.clockLabel}>Today's Working Session</Text>
              <Text style={styles.clockTime}>
                {isClockedIn
                  ? "In at " + formatTime(data?.today?.firstPunchIn)
                  : "Last Out: " + formatTime(data?.today?.lastPunchOut)}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.clockBtn, isClockedIn ? styles.clockBtnOut : styles.clockBtnIn]}
              onPress={handleClockToggle}
              disabled={clocking}
              activeOpacity={0.88}
            >
              {clocking ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons
                    name={isClockedIn ? "power-outline" : "finger-print-outline"}
                    size={22}
                    color="#FFFFFF"
                  />
                  <Text style={styles.clockBtnText}>{isClockedIn ? "Clock Out" : "Punch In"}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Punch timeline metrics */}
          <View style={styles.punchRow}>
            <View style={styles.punchItem}>
              <Text style={styles.punchLabel}>First Check-In</Text>
              <Text style={styles.punchValue}>{formatTime(data?.today?.firstPunchIn)}</Text>
            </View>
            <View style={styles.punchDivider} />
            <View style={styles.punchItem}>
              <Text style={styles.punchLabel}>Last Check-Out</Text>
              <Text style={styles.punchValue}>{formatTime(data?.today?.lastPunchOut)}</Text>
            </View>
            <View style={styles.punchDivider} />
            <View style={styles.punchItem}>
              <Text style={styles.punchLabel}>Punch Events</Text>
              <Text style={styles.punchValue}>{data?.today?.totalPunchesToday ?? 0}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          {/* ── Key Metrics Row ───────────────────────────────────────── */}
          <View style={styles.statsRow}>
            <StatCard
              iconName="calendar-outline"
              value={daysPresent}
              label={`${month} Attendance`}
              color={COLORS.primary}
              bg="#EFF6FF"
            />
            <StatCard
              iconName="airplane-outline"
              value={leaveAvail}
              label="Leave Balance"
              color="#0D9488"
              bg="#F0FDFA"
            />
            <StatCard
              iconName="hourglass-outline"
              value={data?.leaveBalance?.pendingRequests ?? 0}
              label="Pending Approvals"
              color="#D97706"
              bg="#FFFBEB"
            />
          </View>

          {/* ── Leave Overview Card ───────────────────────────────────── */}
          <View style={styles.leaveCard}>
            <View style={styles.leaveCardHeader}>
              <View>
                <Text style={styles.cardTitle}>Leave Allocation</Text>
                <Text style={styles.cardSubtitle}>Annual statutory & casual entitlements</Text>
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate("Leaves")}
                style={styles.applyBtn}
              >
                <Text style={styles.applyBtnText}>Apply Leave</Text>
                <Ionicons name="arrow-forward" size={13} color={COLORS.primary} style={{ marginLeft: 3 }} />
              </TouchableOpacity>
            </View>

            <View style={styles.leaveBarBg}>
              <View
                style={[
                  styles.leaveBarFill,
                  { width: `${Math.min(100, Math.max(5, (leaveTaken / leaveTotal) * 100))}%` },
                ]}
              />
            </View>

            <View style={styles.leaveStats}>
              <View style={styles.leaveStatItem}>
                <View style={[styles.statDot, { backgroundColor: COLORS.error }]} />
                <Text style={styles.leaveStatLabel}>Consumed: </Text>
                <Text style={styles.leaveStatValue}>{leaveTaken} Days</Text>
              </View>
              <View style={styles.leaveStatItem}>
                <View style={[styles.statDot, { backgroundColor: COLORS.emerald }]} />
                <Text style={styles.leaveStatLabel}>Available: </Text>
                <Text style={styles.leaveStatValue}>{leaveAvail} Days</Text>
              </View>
              <View style={styles.leaveStatItem}>
                <View style={[styles.statDot, { backgroundColor: COLORS.textMuted }]} />
                <Text style={styles.leaveStatLabel}>Total: </Text>
                <Text style={styles.leaveStatValue}>{leaveTotal} Days</Text>
              </View>
            </View>
          </View>

          {/* ── Quick Actions Grid ────────────────────────────────────── */}
          <Text style={styles.sectionTitle}>ENTERPRISE ERP SERVICES</Text>
          <View style={styles.actionsGrid}>
            <QuickAction
              iconName="finger-print-outline"
              label="Attendance"
              color="#0F52BA"
              bg="#EFF6FF"
              onPress={() => navigation.navigate("Attendance")}
            />
            <QuickAction
              iconName="receipt-outline"
              label="Expenses"
              color="#059669"
              bg="#ECFDF5"
              onPress={() => navigation.navigate("Expenses")}
            />
            <QuickAction
              iconName="calendar-clear-outline"
              label="Leave Request"
              color="#0D9488"
              bg="#F0FDFA"
              onPress={() => navigation.navigate("Leaves")}
            />
            <QuickAction
              iconName="time-outline"
              label="Timesheets"
              color="#7C3AED"
              bg="#F5F3FF"
              onPress={() => navigation.navigate("Timesheets")}
            />
            <QuickAction
              iconName="calendar-number-outline"
              label="Shift Roster"
              color="#EA580C"
              bg="#FFF7ED"
              onPress={() => navigation.navigate("Shifts")}
            />
            <QuickAction
              iconName="trending-up-outline"
              label="Performance"
              color="#2563EB"
              bg="#EFF6FF"
              onPress={() => navigation.navigate("Performance")}
            />
            <QuickAction
              iconName="wallet-outline"
              label="Payslips"
              color="#D97706"
              bg="#FFFBEB"
              onPress={() => navigation.navigate("Payslip")}
            />
            <QuickAction
              iconName="folder-outline"
              label="Documents"
              color="#475569"
              bg="#F1F5F9"
              onPress={() => navigation.navigate("Documents")}
            />
          </View>

          {/* ── Company Announcements Bulletin ────────────────────────── */}
          {announcements.length > 0 && (
            <View style={styles.announcementsSection}>
              <View style={styles.announcementsHeader}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons name="megaphone-outline" size={17} color={COLORS.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.sectionTitle}>COMPANY BULLETINS</Text>
                </View>
                <View style={styles.liveBadge}>
                  <Text style={styles.liveBadgeText}>LIVE</Text>
                </View>
              </View>

              {announcements.slice(0, 2).map((item) => (
                <View key={item.id} style={styles.announcementCard}>
                  <View style={styles.announcementTop}>
                    <View
                      style={[
                        styles.annTag,
                        {
                          backgroundColor:
                            item.category === "Urgent" ? "#FEF2F2" : "#EFF6FF",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.annTagText,
                          {
                            color:
                              item.category === "Urgent" ? "#DC2626" : COLORS.primary,
                          },
                        ]}
                      >
                        {item.category}
                      </Text>
                    </View>
                    <Text style={styles.annDate}>{item.date}</Text>
                  </View>
                  <Text style={styles.annTitle}>{item.title}</Text>
                  <Text style={styles.annContent} numberOfLines={2}>
                    {item.content}
                  </Text>
                  <Text style={styles.annAuthor}>By {item.author}</Text>
                </View>
              ))}
            </View>
          )}

          {/* ── Corporate Identity Info Card ──────────────────────────── */}
          <View style={styles.infoCard}>
            <View style={styles.infoCardRow}>
              <View style={styles.infoIconBox}>
                <Ionicons name="business-outline" size={18} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Department</Text>
                <Text style={styles.infoVal}>{data?.employee?.Department ?? user?.department ?? "Technology"}</Text>
              </View>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoCardRow}>
              <View style={styles.infoIconBox}>
                <Ionicons name="location-outline" size={18} color="#0D9488" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Work Location</Text>
                <Text style={styles.infoVal}>{data?.employee?.WorkLocation ?? "Corporate Headquarters"}</Text>
              </View>
              <View style={styles.empIdBadge}>
                <Text style={styles.empIdText}>{data?.employee?.EmployeeCode ?? user?.employeeCode ?? "EMP-001"}</Text>
              </View>
            </View>
          </View>

          <View style={{ height: 32 }} />
        </View>
      </ScrollView>
    </View>
  );
}

function StatCard({
  iconName, value, label, color, bg,
}: {
  iconName: keyof typeof Ionicons.glyphMap;
  value: number;
  label: string;
  color: string;
  bg: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconWrap, { backgroundColor: bg }]}>
        <Ionicons name={iconName} size={19} color={color} />
      </View>
      <Text style={[styles.statValue, { color: COLORS.textPrimary }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function QuickAction({
  iconName, label, color, bg, onPress,
}: {
  iconName: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  bg: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.actionItem} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.actionIconBox, { backgroundColor: bg, borderColor: `${color}30` }]}>
        <Ionicons name={iconName} size={22} color={color} />
      </View>
      <Text style={styles.actionLabel} numberOfLines={1}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8FAFC" },
  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8FAFC" },
  loadingText: { marginTop: 14, color: COLORS.textSecondary, fontSize: 13.5, fontWeight: "600" },

  // Header
  header: {
    paddingTop: Platform.OS === "ios" ? 54 : 44,
    paddingBottom: 36,
    paddingHorizontal: SPACING.xl,
  },
  headerTop: { flexDirection: "row", alignItems: "center" },
  avatarWrap: { position: "relative" },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.3)",
  },
  avatarText: { fontSize: 20, fontWeight: "900", color: "#fff" },
  onlineDot: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: "#070D18",
  },
  companyPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(56, 189, 248, 0.15)",
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 3,
  },
  companyPillText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#38BDF8",
    letterSpacing: 0.3,
  },
  greet: { fontSize: 16.5, fontWeight: "800", color: "#fff", letterSpacing: -0.2 },
  role: { fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 1 },
  notifBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  notifBadgeDot: {
    position: "absolute",
    top: 9,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
  },
  dateBar: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  dateText: { color: "#E2E8F0", fontSize: 12, fontWeight: "600" },
  dateBarDivider: { width: 1, height: 12, backgroundColor: "rgba(255,255,255,0.2)", marginHorizontal: 10 },
  shiftText: { color: "#94A3B8", fontSize: 11.5, fontWeight: "500" },

  // Hero card
  heroCard: {
    marginHorizontal: SPACING.lg,
    marginTop: -22,
    backgroundColor: "#FFFFFF",
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.md,
  },
  clockRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  clockInfo: { flex: 1, paddingRight: 10 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: RADIUS.full,
    alignSelf: "flex-start",
    marginBottom: 6,
  },
  statusIn: { backgroundColor: "#ECFDF5" },
  statusOut: { backgroundColor: "#FFFBEB" },
  statusDot: { width: 7, height: 7, borderRadius: 3.5, marginRight: 6 },
  dotIn: { backgroundColor: COLORS.emerald },
  dotOut: { backgroundColor: COLORS.amber },
  statusText: { fontSize: 11.5, fontWeight: "700" },
  clockLabel: { fontSize: 11.5, color: COLORS.textMuted, fontWeight: "500" },
  clockTime: { fontSize: 15, fontWeight: "800", color: COLORS.textPrimary, marginTop: 2 },
  clockBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: RADIUS.md,
    gap: 8,
    ...SHADOW.sm,
  },
  clockBtnIn: { backgroundColor: COLORS.primary },
  clockBtnOut: { backgroundColor: COLORS.rose },
  clockBtnText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800", letterSpacing: 0.2 },
  punchRow: {
    flexDirection: "row",
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    justifyContent: "space-around",
  },
  punchItem: { alignItems: "center" },
  punchLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: "500" },
  punchValue: { fontSize: 13.5, fontWeight: "700", color: COLORS.textPrimary, marginTop: 2 },
  punchDivider: { width: 1, height: 24, backgroundColor: "#E2E8F0" },

  // Sections
  section: { paddingHorizontal: SPACING.lg, marginTop: 20 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: 12,
    marginLeft: 2,
  },

  // Stats
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 18 },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: RADIUS.lg,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.xs,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statValue: { fontSize: 20, fontWeight: "900" },
  statLabel: { fontSize: 10.5, color: COLORS.textMuted, textAlign: "center", marginTop: 2, fontWeight: "600" },

  // Leave bar
  leaveCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.xs,
  },
  leaveCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 },
  cardTitle: { fontSize: 14.5, fontWeight: "800", color: COLORS.textPrimary },
  cardSubtitle: { fontSize: 11.5, color: COLORS.textMuted, marginTop: 2 },
  applyBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  applyBtnText: { fontSize: 11.5, fontWeight: "700", color: COLORS.primary },
  leaveBarBg: {
    height: 7,
    backgroundColor: "#F1F5F9",
    borderRadius: RADIUS.full,
    overflow: "hidden",
    marginBottom: 12,
  },
  leaveBarFill: { height: 7, backgroundColor: COLORS.primary, borderRadius: RADIUS.full },
  leaveStats: { flexDirection: "row", justifyContent: "space-between" },
  leaveStatItem: { flexDirection: "row", alignItems: "center" },
  statDot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  leaveStatLabel: { fontSize: 11.5, color: COLORS.textMuted, fontWeight: "500" },
  leaveStatValue: { fontSize: 11.5, color: COLORS.textPrimary, fontWeight: "700" },

  // Quick actions
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 22,
  },
  actionItem: {
    width: (width - SPACING.lg * 2 - 30) / 4,
    alignItems: "center",
  },
  actionIconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    marginBottom: 6,
    ...SHADOW.xs,
  },
  actionLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: "center",
    fontWeight: "600",
  },

  // Info card
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.xs,
  },
  infoCardRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  infoLabel: {
    fontSize: 10.5,
    fontWeight: "600",
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  infoVal: {
    fontSize: 13.5,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginTop: 1,
  },
  infoDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 12,
  },
  empIdBadge: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  empIdText: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.primary,
  },

  // Announcements
  announcementsSection: {
    marginBottom: 20,
  },
  announcementsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  liveBadge: {
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  liveBadgeText: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "#DC2626",
    letterSpacing: 0.5,
  },
  announcementCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
    ...SHADOW.xs,
  },
  announcementTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  annTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  annTagText: {
    fontSize: 10,
    fontWeight: "700",
  },
  annDate: {
    fontSize: 10.5,
    color: COLORS.textMuted,
  },
  annTitle: {
    fontSize: 13.5,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  annContent: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16.5,
    marginBottom: 6,
  },
  annAuthor: {
    fontSize: 10.5,
    color: COLORS.textMuted,
    fontStyle: "italic",
  },
});
