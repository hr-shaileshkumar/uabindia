// screens/NotificationsScreen.tsx – Executive Corporate Notifications Center
import React, { useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  StatusBar, RefreshControl, Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING, RADIUS, SHADOW } from "../constants/theme";

const DEMO_NOTIFICATIONS = [
  { id: "1", type: "leave", title: "Leave Request Approved", body: "Your planned Casual Leave for Oct 15–16 has been authorized by your manager.", time: "2 hours ago", read: false },
  { id: "2", type: "attendance", title: "Attendance Reminder", body: "Daily shift started. Please complete your geofenced biometric check-in.", time: "09:30 AM", read: false },
  { id: "3", type: "payslip", title: "Statutory Payslip Released", body: "Your monthly compensation and tax slip for the previous period is now published.", time: "Yesterday", read: true },
  { id: "4", type: "holiday", title: "National Holiday Announcement", body: "Offices will remain closed for National Holiday observance.", time: "2 days ago", read: true },
  { id: "5", type: "system", title: "Enterprise Policy Update", body: "Updated workforce cybersecurity compliance protocols have been deployed.", time: "1 week ago", read: true },
];

interface NotificationTypeConfig {
  iconName: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
}

const TYPE_CONFIG: Record<string, NotificationTypeConfig> = {
  leave:      { iconName: "airplane-outline",     color: "#0F52BA", bg: "#EFF6FF" },
  attendance: { iconName: "finger-print-outline", color: "#0D9488", bg: "#F0FDFA" },
  payslip:    { iconName: "receipt-outline",      color: "#D97706", bg: "#FFFBEB" },
  holiday:    { iconName: "sparkles-outline",     color: "#7C3AED", bg: "#F5F3FF" },
  system:     { iconName: "shield-outline",       color: "#475569", bg: "#F1F5F9" },
};

export default function NotificationsScreen({ navigation }: any) {
  const [notifications, setNotifications] = useState(DEMO_NOTIFICATIONS);
  const [refreshing, setRefreshing] = useState(false);

  const markRead = (id: string) => {
    setNotifications(ns => ns.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = () => {
    setNotifications(ns => ns.map(n => ({ ...n, read: true })));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(r => setTimeout(r, 600));
    setRefreshing(false);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const renderItem = ({ item }: { item: typeof DEMO_NOTIFICATIONS[0] }) => {
    const cfg = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.system;
    return (
      <TouchableOpacity
        style={[styles.card, !item.read && styles.cardUnread]}
        onPress={() => markRead(item.id)}
        activeOpacity={0.8}
      >
        <View style={[styles.iconWrap, { backgroundColor: cfg.bg }]}>
          <Ionicons name={cfg.iconName} size={20} color={cfg.color} />
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, !item.read && styles.titleUnread]}>{item.title}</Text>
            {!item.read && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.body} numberOfLines={2}>{item.body}</Text>
          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={12} color={COLORS.textMuted} style={{ marginRight: 4 }} />
            <Text style={styles.time}>{item.time}</Text>
          </View>
        </View>
      </TouchableOpacity>
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
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Notifications</Text>
          {unreadCount > 0 ? (
            <TouchableOpacity onPress={markAllRead} style={styles.markAllBtn}>
              <Ionicons name="checkmark-done-outline" size={16} color="#38BDF8" style={{ marginRight: 4 }} />
              <Text style={styles.markAllText}>Read All</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 60 }} />
          )}
        </View>

        <View style={styles.headerInfoRow}>
          <Text style={styles.headerSub}>
            {unreadCount > 0 ? `${unreadCount} Unread Notifications` : "All notifications reviewed"}
          </Text>
        </View>
      </LinearGradient>

      <FlatList
        data={notifications}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={44} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No notifications in your inbox</Text>
          </View>
        }
      />
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
  backButton: { padding: 4 },
  navTitle: { fontSize: 18, fontWeight: "800", color: "#FFFFFF", letterSpacing: -0.2 },
  markAllBtn: { flexDirection: "row", alignItems: "center" },
  markAllText: { color: "#38BDF8", fontSize: 12.5, fontWeight: "700" },
  headerInfoRow: { marginTop: 4 },
  headerSub: { fontSize: 12.5, color: "rgba(255,255,255,0.7)", fontWeight: "500" },
  list: { padding: SPACING.lg, gap: 10 },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF",
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.xs,
  },
  cardUnread: {
    borderColor: "#BFDBFE",
    backgroundColor: "#F8FAFF",
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 13,
  },
  content: { flex: 1 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 3 },
  title: { fontSize: 14, fontWeight: "700", color: COLORS.textPrimary },
  titleUnread: { color: COLORS.primary, fontWeight: "800" },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  body: { fontSize: 12.5, color: COLORS.textSecondary, lineHeight: 17 },
  timeRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  time: { fontSize: 11, color: COLORS.textMuted, fontWeight: "500" },
  empty: { alignItems: "center", paddingVertical: 60 },
  emptyText: { fontSize: 14, color: COLORS.textMuted, marginTop: 10, fontWeight: "500" },
});
