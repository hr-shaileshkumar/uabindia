// screens/CompanySwitcherScreen.tsx — Multi-Tenant Company & Project Switcher with Luxury Vector Cards
import React, { useState, useEffect } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  StatusBar, ActivityIndicator, Alert, Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTenant } from "../context/TenantContext";
import { useAuth } from "../context/AuthContext";
import { COLORS, SPACING, RADIUS, SHADOW } from "../constants/theme";
import { API_BASE } from "../utils/api";

interface Company {
  companyId: string;
  companyName: string;
  companyCode?: string;
  address?: string;
  totalEmployees?: number;
}

interface Project {
  projectId: string;
  projectName: string;
  projectCode?: string;
  clientName?: string;
  status?: string;
}

const DEMO_COMPANIES: Company[] = [
  { companyId: "RELIANCE", companyName: "Reliance Retail Ltd (Client)", companyCode: "RELIANCE", address: "Jio World Centre, Mumbai", totalEmployees: 1200 },
  { companyId: "TCS", companyName: "Tata Consultancy Services (Client)", companyCode: "TCS", address: "Whitefield Campus, Bengaluru", totalEmployees: 3500 },
  { companyId: "INFY", companyName: "Infosys FinTech Solutions (Client)", companyCode: "INFY", address: "HITEC City, Hyderabad", totalEmployees: 850 },
  { companyId: "UAB01", companyName: "Uabindia Enterprise Platform HQ", companyCode: "UAB01", address: "Koramangala, Bengaluru", totalEmployees: 250 },
];

const DEMO_PROJECTS: Project[] = [
  { projectId: "P001", projectName: "Omnichannel POS Architecture", projectCode: "POS-26", clientName: "Reliance Retail Ltd", status: "Active" },
  { projectId: "P002", projectName: "Enterprise Cloud ERP Migration", projectCode: "ERP-MIG", clientName: "Tata Consultancy Services", status: "Active" },
  { projectId: "P003", projectName: "FinTech Automated Reconciliation", projectCode: "FIN-AUTO", clientName: "Infosys FinTech", status: "Active" },
  { projectId: "P004", projectName: "Core Platform Multi-Tenant Gateway", projectCode: "CORE-01", clientName: "Uabindia Platform HQ", status: "Active" },
];

const STATUS_CFG: Record<string, { color: string; bg: string }> = {
  Active:    { color: "#059669", bg: "#ECFDF5" },
  "On Hold": { color: "#D97706", bg: "#FFFBEB" },
  Closed:    { color: "#475569", bg: "#F1F5F9" },
};

export default function CompanySwitcherScreen({ navigation }: any) {
  const { company, project, setCompany, setProject } = useTenant();
  const { user, token, login } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"company" | "project">("company");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cs, ps] = await Promise.all([
        fetch(`${API_BASE}/hrms/companies`, { headers: { Authorization: `Bearer ${token}` } })
          .then(r => r.json()).catch(() => []),
        fetch(`${API_BASE}/hrms/projects`, { headers: { Authorization: `Bearer ${token}` } })
          .then(r => r.json()).catch(() => []),
      ]);
      setCompanies(Array.isArray(cs) && cs.length > 0 ? cs : DEMO_COMPANIES);
      setProjects(Array.isArray(ps) && ps.length > 0 ? ps : DEMO_PROJECTS);
    } catch {
      setCompanies(DEMO_COMPANIES);
      setProjects(DEMO_PROJECTS);
    }
    setLoading(false);
  };

  const handleSelectCompany = (c: Company) => {
    Alert.alert(
      "Switch Client Workspace",
      `Switch your operating environment to ${c.companyName}? All timesheets, attendance, and expense submissions will be routed to this client.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Switch Context",
          onPress: () => {
            setCompany({ companyId: c.companyId, companyName: c.companyName, companyCode: c.companyCode });
            if (user) {
              login({
                ...user,
                companyId: c.companyId,
                companyName: c.companyName,
              }, token ?? "");
            }
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleSelectProject = (p: Project | null) => {
    if (!p) {
      setProject(null);
      navigation.goBack();
      return;
    }
    setProject({ projectId: p.projectId, projectName: p.projectName, projectCode: p.projectCode, clientName: p.clientName });
    navigation.goBack();
  };

  const renderCompany = ({ item }: { item: Company }) => {
    const isActive = company?.companyId === item.companyId;
    return (
      <TouchableOpacity
        style={[styles.card, isActive && styles.cardActive]}
        onPress={() => handleSelectCompany(item)}
        activeOpacity={0.8}
      >
        <View style={[styles.emblemBadge, { backgroundColor: isActive ? COLORS.primary : "#EFF6FF" }]}>
          <Text style={[styles.emblemText, { color: isActive ? "#FFFFFF" : COLORS.primary }]}>
            {(item.companyCode ?? item.companyName.slice(0, 3)).toUpperCase()}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.title, isActive && styles.titleActive]}>{item.companyName}</Text>
          {item.address && (
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={13} color={COLORS.textMuted} style={{ marginRight: 4 }} />
              <Text style={styles.metaText}>{item.address}</Text>
            </View>
          )}
          {item.totalEmployees && (
            <View style={styles.metaRow}>
              <Ionicons name="people-outline" size={13} color={COLORS.textMuted} style={{ marginRight: 4 }} />
              <Text style={styles.metaText}>{item.totalEmployees} Registered Workforce</Text>
            </View>
          )}
        </View>

        {isActive ? (
          <View style={styles.activeCheck}>
            <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
          </View>
        ) : (
          <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
        )}
      </TouchableOpacity>
    );
  };

  const renderProject = ({ item }: { item: Project }) => {
    const isActive = project?.projectId === item.projectId;
    const cfg = STATUS_CFG[item.status ?? "Active"] ?? { color: COLORS.textMuted, bg: "#F1F5F9" };
    return (
      <TouchableOpacity
        style={[styles.card, isActive && styles.cardActive]}
        onPress={() => handleSelectProject(item)}
        activeOpacity={0.8}
      >
        <View style={[styles.emblemBadge, { backgroundColor: isActive ? "#0D9488" : "#F0FDFA" }]}>
          <Ionicons name="folder-outline" size={22} color={isActive ? "#FFFFFF" : "#0D9488"} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.title, isActive && styles.titleActive]}>{item.projectName}</Text>
          {item.clientName && (
            <View style={styles.metaRow}>
              <Ionicons name="briefcase-outline" size={13} color={COLORS.textMuted} style={{ marginRight: 4 }} />
              <Text style={styles.metaText}>Client: {item.clientName}</Text>
            </View>
          )}
          <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.statusText, { color: cfg.color }]}>{item.status}</Text>
          </View>
        </View>

        {isActive ? (
          <View style={styles.activeCheck}>
            <Ionicons name="checkmark-circle" size={24} color="#0D9488" />
          </View>
        ) : (
          <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
        )}
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
          <Text style={styles.navTitle}>Enterprise Context</Text>
          <View style={{ width: 22 }} />
        </View>

        <View style={styles.contextCard}>
          <View style={styles.contextCol}>
            <Text style={styles.contextLabel}>ACTIVE COMPANY</Text>
            <Text style={styles.contextVal} numberOfLines={1}>
              {company?.companyName ?? "Global Group"}
            </Text>
          </View>
          <View style={styles.contextDivider} />
          <View style={styles.contextCol}>
            <Text style={styles.contextLabel}>ACTIVE PROJECT</Text>
            <Text style={styles.contextVal} numberOfLines={1}>
              {project?.projectName ?? "All Operations"}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, tab === "company" && styles.tabButtonActive]}
          onPress={() => setTab("company")}
          activeOpacity={0.8}
        >
          <Ionicons
            name="business-outline"
            size={17}
            color={tab === "company" ? COLORS.primary : COLORS.textMuted}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.tabButtonText, tab === "company" && styles.tabButtonTextActive]}>
            Companies ({companies.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, tab === "project" && styles.tabButtonActive]}
          onPress={() => setTab("project")}
          activeOpacity={0.8}
        >
          <Ionicons
            name="folder-outline"
            size={17}
            color={tab === "project" ? COLORS.primary : COLORS.textMuted}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.tabButtonText, tab === "project" && styles.tabButtonTextActive]}>
            Projects ({projects.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.loadingText}>Loading Enterprise Entities…</Text>
        </View>
      ) : (
        <FlatList<Company | Project>
          data={tab === "company" ? companies : projects}
          keyExtractor={i => "companyId" in i ? i.companyId : i.projectId}
          renderItem={({ item }) =>
            tab === "company"
              ? renderCompany({ item: item as Company })
              : renderProject({ item: item as Project })
          }
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            tab === "project" ? (
              <TouchableOpacity
                style={[styles.card, !project && styles.cardActive]}
                onPress={() => handleSelectProject(null)}
                activeOpacity={0.8}
              >
                <View style={[styles.emblemBadge, { backgroundColor: !project ? "#0D9488" : "#F0FDFA" }]}>
                  <Ionicons name="globe-outline" size={22} color={!project ? "#FFFFFF" : "#0D9488"} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.title, !project && styles.titleActive]}>Global Enterprise Scope</Text>
                  <Text style={styles.metaText}>All projects & general overheads</Text>
                </View>
                {!project && (
                  <View style={styles.activeCheck}>
                    <Ionicons name="checkmark-circle" size={24} color="#0D9488" />
                  </View>
                )}
              </TouchableOpacity>
            ) : null
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
    marginBottom: 16,
  },
  backButton: { padding: 4 },
  navTitle: { fontSize: 18, fontWeight: "800", color: "#FFFFFF", letterSpacing: -0.2 },
  contextCard: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: RADIUS.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  contextCol: { flex: 1 },
  contextLabel: { fontSize: 9.5, fontWeight: "700", color: "#38BDF8", letterSpacing: 0.5 },
  contextVal: { fontSize: 13, fontWeight: "700", color: "#FFFFFF", marginTop: 2 },
  contextDivider: { width: 1, height: 26, backgroundColor: "rgba(255, 255, 255, 0.15)", marginHorizontal: 10, alignSelf: "center" },
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
  loadingText: { marginTop: 12, color: COLORS.textSecondary, fontSize: 13, fontWeight: "600" },
  list: { padding: SPACING.lg, gap: 12 },
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
  cardActive: {
    borderColor: COLORS.primary,
    borderWidth: 1.5,
    backgroundColor: "#F8FAFF",
  },
  emblemBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  emblemText: { fontSize: 12.5, fontWeight: "900", letterSpacing: 0.5 },
  title: { fontSize: 14.5, fontWeight: "700", color: COLORS.textPrimary, marginBottom: 3 },
  titleActive: { color: COLORS.primary, fontWeight: "800" },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  metaText: { fontSize: 12, color: COLORS.textMuted, fontWeight: "500" },
  activeCheck: { marginLeft: 8 },
  statusBadge: {
    alignSelf: "flex-start",
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 8,
    marginTop: 6,
  },
  statusText: { fontSize: 10.5, fontWeight: "800" },
});
