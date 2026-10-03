// screens/LoginScreen.tsx – Executive Corporate Authentication Gateway
import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  StatusBar, KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, Alert, Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import {
  loginWithPassword,
  requestOtp,
  getClientWorkspaces,
  ClientWorkspace,
} from "../utils/api";
import { COLORS, SPACING, RADIUS, SHADOW } from "../constants/theme";
import BrandLogo from "../components/BrandLogo";

type Mode = "password" | "otp";

export default function LoginScreen({ navigation }: any) {
  const { login } = useAuth();
  const [mode, setMode] = useState<Mode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mobile, setMobile] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [workspaces, setWorkspaces] = useState<ClientWorkspace[]>([]);
  const [workspaceModalVisible, setWorkspaceModalVisible] = useState(false);

  const handlePasswordLogin = async (overrideWs?: ClientWorkspace) => {
    if (!email.trim() || !password) {
      Alert.alert("Credentials Required", "Please enter your enterprise email/ID and password.");
      return;
    }
    setLoading(true);
    try {
      if (!overrideWs) {
        // Resolve all client organizations linked to this email/ID
        const wsList = await getClientWorkspaces(email.trim());
        if (wsList.length > 1) {
          setWorkspaces(wsList);
          setWorkspaceModalVisible(true);
          setLoading(false);
          return;
        }
      }

      const { token, user } = await loginWithPassword(email.trim(), password, overrideWs);
      await login(user, token);
    } catch (e: any) {
      Alert.alert("Authentication Failed", e?.message ?? "Invalid corporate credentials. Please verify your details.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectClientWorkspace = async (ws: ClientWorkspace) => {
    setWorkspaceModalVisible(false);
    await handlePasswordLogin(ws);
  };

  const handleOtpRequest = async () => {
    if (!mobile || mobile.length < 10) {
      Alert.alert("Input Error", "Please provide a valid 10-digit registered mobile number.");
      return;
    }
    setLoading(true);
    try {
      const res = await requestOtp(mobile);
      if (res.success) navigation.navigate("OTPVerification", { mobile });
      else Alert.alert("Failed", "Unable to transmit OTP. Please try again.");
    } catch {
      navigation.navigate("OTPVerification", { mobile });
    }
    setLoading(false);
  };

  const fillDemo = (role: "employee" | "manager") => {
    if (role === "employee") {
      setEmail("demo@uabindia.com");
      setPassword("Demo@123");
    } else {
      setEmail("manager@uabindia.com");
      setPassword("Manager@123");
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#070D18" />
      <LinearGradient colors={["#070D18", "#0A192F", "#0F2E59"]} style={styles.bg}>
        {/* Ambient Top Glow Orbs */}
        <View style={styles.glowOrb1} />
        <View style={styles.glowOrb2} />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header & Logo */}
            <View style={styles.headerSection}>
              <BrandLogo size="hero" variant="dark" showWordmark showSubtitle />
            </View>

            {/* Main Auth Card */}
            <View style={styles.card}>
              <View style={styles.cardTopRow}>
                <View>
                  <Text style={styles.welcome}>Enterprise Portal</Text>
                  <Text style={styles.subtitle}>Sign in to your employee workspace</Text>
                </View>
                <View style={styles.shieldBadge}>
                  <Ionicons name="shield-checkmark" size={16} color={COLORS.emerald} />
                </View>
              </View>

              {/* Mode Segmented Control */}
              <View style={styles.segmentedControl}>
                <TouchableOpacity
                  style={[styles.segmentBtn, mode === "password" && styles.segmentBtnActive]}
                  onPress={() => setMode("password")}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={16}
                    color={mode === "password" ? COLORS.primary : COLORS.textMuted}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.segmentText, mode === "password" && styles.segmentTextActive]}>
                    Password
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.segmentBtn, mode === "otp" && styles.segmentBtnActive]}
                  onPress={() => setMode("otp")}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="phone-portrait-outline"
                    size={16}
                    color={mode === "otp" ? COLORS.primary : COLORS.textMuted}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.segmentText, mode === "otp" && styles.segmentTextActive]}>
                    One-Time PIN
                  </Text>
                </TouchableOpacity>
              </View>

              {mode === "password" ? (
                <>
                  {/* Email / ID Field */}
                  <View style={styles.fieldWrap}>
                    <Text style={styles.fieldLabel}>CORPORATE EMAIL / EMPLOYEE ID</Text>
                    <View style={styles.inputBox}>
                      <Ionicons name="mail-outline" size={19} color={COLORS.textSecondary} style={styles.leadingIcon} />
                      <TextInput
                        style={styles.textInput}
                        placeholder="you@uabindia.com or EMP-001"
                        placeholderTextColor={COLORS.textMuted}
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        autoComplete="email"
                      />
                    </View>
                  </View>

                  {/* Password Field */}
                  <View style={styles.fieldWrap}>
                    <View style={styles.labelRow}>
                      <Text style={styles.fieldLabel}>PASSWORD</Text>
                      <TouchableOpacity onPress={() => navigation.navigate("ChangePassword")}>
                        <Text style={styles.forgotLink}>Forgot?</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.inputBox}>
                      <Ionicons name="key-outline" size={19} color={COLORS.textSecondary} style={styles.leadingIcon} />
                      <TextInput
                        style={[styles.textInput, { flex: 1 }]}
                        placeholder="Enter your security password"
                        placeholderTextColor={COLORS.textMuted}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPass}
                        autoComplete="password"
                      />
                      <TouchableOpacity onPress={() => setShowPass(s => !s)} style={styles.trailingAction} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Feather name={showPass ? "eye" : "eye-off"} size={18} color={COLORS.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Submit Button */}
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => handlePasswordLogin()}
                    disabled={loading}
                    activeOpacity={0.88}
                  >
                    <LinearGradient
                      colors={["#0F52BA", "#1D4ED8", "#2563EB"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.primaryGradient}
                    >
                      {loading ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <View style={styles.buttonContent}>
                          <Text style={styles.buttonText}>Authenticate Session</Text>
                          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                        </View>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {/* Mobile Number Field */}
                  <View style={styles.fieldWrap}>
                    <Text style={styles.fieldLabel}>REGISTERED MOBILE NUMBER</Text>
                    <View style={styles.inputBox}>
                      <Ionicons name="call-outline" size={19} color={COLORS.textSecondary} style={styles.leadingIcon} />
                      <View style={styles.prefixBadge}>
                        <Text style={styles.prefixText}>+91</Text>
                      </View>
                      <TextInput
                        style={[styles.textInput, { flex: 1 }]}
                        placeholder="10-digit mobile number"
                        placeholderTextColor={COLORS.textMuted}
                        value={mobile}
                        onChangeText={t => setMobile(t.replace(/\D/g, "").slice(0, 10))}
                        keyboardType="phone-pad"
                        maxLength={10}
                      />
                    </View>
                  </View>

                  {/* Send OTP Button */}
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleOtpRequest}
                    disabled={loading}
                    activeOpacity={0.88}
                  >
                    <LinearGradient
                      colors={["#0D9488", "#0F766E"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.primaryGradient}
                    >
                      {loading ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <View style={styles.buttonContent}>
                          <Text style={styles.buttonText}>Request OTP Code</Text>
                          <Ionicons name="paper-plane-outline" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                        </View>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}

              {/* Biometric Quick Entry */}
              <TouchableOpacity
                style={styles.biometricButton}
                onPress={() => navigation.navigate("Biometric")}
                activeOpacity={0.75}
              >
                <Ionicons name="finger-print-outline" size={22} color={COLORS.primary} />
                <Text style={styles.biometricText}>Quick Biometric Verification</Text>
              </TouchableOpacity>

              {/* Quick Fill Credentials for Testing */}
              <View style={styles.quickFillWrap}>
                <Text style={styles.quickFillLabel}>Quick Test Access:</Text>
                <View style={styles.quickFillRow}>
                  <TouchableOpacity
                    style={styles.quickFillChip}
                    onPress={() => fillDemo("employee")}
                  >
                    <Text style={styles.quickFillChipText}>Employee</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.quickFillChip}
                    onPress={() => fillDemo("manager")}
                  >
                    <Text style={styles.quickFillChipText}>Manager / Admin</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Compliance & Security Footer */}
            <View style={styles.securityFooter}>
              <View style={styles.securityRow}>
                <Ionicons name="lock-closed" size={13} color="rgba(255,255,255,0.4)" />
                <Text style={styles.securityText}>256-Bit SSL Encryption · Multi-Tenant Isolation</Text>
              </View>
              <Text style={styles.copyrightText}>© 2026 Uabindia Technologies. All rights reserved.</Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>

      {/* ── Multi-Client Workspace Picker Modal ───────────────────────── */}
      <Modal
        visible={workspaceModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setWorkspaceModalVisible(false)}
      >
        <View style={styles.wsModalOverlay}>
          <View style={styles.wsModalCard}>
            <View style={styles.wsModalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.wsModalTitle}>Select Client Workspace</Text>
                <Text style={styles.wsModalSubtitle}>
                  Choose which company environment you want to access:
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setWorkspaceModalVisible(false)}
                style={styles.wsCloseBtn}
              >
                <Ionicons name="close" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              {workspaces.map((ws) => (
                <TouchableOpacity
                  key={ws.tenantId}
                  style={styles.wsItemCard}
                  onPress={() => handleSelectClientWorkspace(ws)}
                  activeOpacity={0.8}
                >
                  <View style={styles.wsIconCircle}>
                    <Ionicons name="business" size={20} color={COLORS.primary} />
                  </View>

                  <View style={{ flex: 1, marginHorizontal: 12 }}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Text style={styles.wsClientName}>{ws.clientName}</Text>
                      <View style={styles.wsCodeBadge}>
                        <Text style={styles.wsCodeText}>{ws.clientCode}</Text>
                      </View>
                    </View>
                    <Text style={styles.wsRoleText}>
                      {ws.designation} • {ws.department}
                    </Text>
                    <View style={styles.wsProjectRow}>
                      <Ionicons name="briefcase-outline" size={12} color={COLORS.textMuted} style={{ marginRight: 4 }} />
                      <Text style={styles.wsProjectText} numberOfLines={1}>
                        {ws.activeProject}
                      </Text>
                    </View>
                  </View>

                  <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  bg: {
    flex: 1,
  },
  glowOrb1: {
    position: "absolute",
    top: -50,
    left: -50,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(37, 99, 235, 0.15)",
  },
  glowOrb2: {
    position: "absolute",
    top: 120,
    right: -60,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(2, 132, 199, 0.12)",
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: Platform.OS === "ios" ? 60 : 45,
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 28,
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
    ...SHADOW.lg,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  welcome: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 3,
  },
  shieldBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.emeraldLight,
    borderWidth: 1,
    borderColor: "#A7F3D0",
    justifyContent: "center",
    alignItems: "center",
  },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: RADIUS.md,
    padding: 3,
    marginBottom: 22,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 9,
    borderRadius: RADIUS.sm + 2,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentBtnActive: {
    backgroundColor: "#FFFFFF",
    ...SHADOW.xs,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textMuted,
  },
  segmentTextActive: {
    color: COLORS.textPrimary,
    fontWeight: "700",
  },
  fieldWrap: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textSecondary,
    letterSpacing: 0.6,
    marginBottom: 7,
  },
  forgotLink: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.primary,
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 12,
  },
  leadingIcon: {
    marginRight: 10,
  },
  prefixBadge: {
    paddingRight: 8,
    marginRight: 8,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  prefixText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  textInput: {
    flex: 1,
    height: 48,
    fontSize: 14.5,
    color: COLORS.textPrimary,
    fontWeight: "500",
  },
  trailingAction: {
    padding: 4,
  },
  primaryButton: {
    borderRadius: RADIUS.md,
    overflow: "hidden",
    marginTop: 6,
    marginBottom: 14,
    ...SHADOW.md,
  },
  primaryGradient: {
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  biometricButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 46,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: "#DBEAFE",
    backgroundColor: "#EFF6FF",
    marginBottom: 16,
  },
  biometricText: {
    fontSize: 13.5,
    fontWeight: "700",
    color: COLORS.primary,
    marginLeft: 8,
  },
  quickFillWrap: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: 14,
    marginTop: 2,
    alignItems: "center",
  },
  quickFillLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.textMuted,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  quickFillRow: {
    flexDirection: "row",
    gap: 8,
  },
  quickFillChip: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    backgroundColor: "#F1F5F9",
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickFillChipText: {
    fontSize: 11.5,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  securityFooter: {
    marginTop: 26,
    alignItems: "center",
  },
  securityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  securityText: {
    fontSize: 11.5,
    color: "rgba(255, 255, 255, 0.55)",
    fontWeight: "500",
  },
  copyrightText: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.35)",
  },

  // Multi-Client Workspace Picker Modal
  wsModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    justifyContent: "flex-end",
  },
  wsModalCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    padding: SPACING.lg,
    ...SHADOW.lg,
  },
  wsModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  wsModalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  wsModalSubtitle: {
    fontSize: 12.5,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  wsCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  wsItemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: RADIUS.lg,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.xs,
  },
  wsIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  wsClientName: {
    fontSize: 14.5,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  wsCodeBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  wsCodeText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  wsRoleText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "600",
    marginTop: 2,
  },
  wsProjectRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  wsProjectText: {
    fontSize: 11,
    color: COLORS.textMuted,
    flex: 1,
  },
});
