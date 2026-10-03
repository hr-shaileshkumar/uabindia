// navigation/RootNavigator.tsx — Executive Luxury Navigator with High-End Vector Navigation Bar
import React, { useEffect } from "react";
import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text, View, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "../context/AuthContext";
import { useTenant } from "../context/TenantContext";
import { registerBackgroundSync } from "../utils/backgroundSync";
import { COLORS, SHADOW } from "../constants/theme";

// ── Auth Screens ──────────────────────────────────────────────────────────────
import LoginScreen from "../screens/LoginScreen";
import OTPVerificationScreen from "../screens/OTPVerificationScreen";
import BiometricLoginScreen from "../screens/BiometricLoginScreen";
import SplashScreen from "../screens/SplashScreen";

// ── Tab Screens ───────────────────────────────────────────────────────────────
import DashboardScreen from "../screens/DashboardScreen";
import AttendanceScreen from "../screens/AttendanceScreen";
import LeavesScreen from "../screens/LeavesScreen";
import CalendarScreen from "../screens/CalendarScreen";
import ProfileScreen from "../screens/ProfileScreen";
import ManagerScreen from "../screens/ManagerScreen";
import HolidayScreen from "../screens/HolidayScreen";

// ── Stack Screens ─────────────────────────────────────────────────────────────
import NotificationsScreen from "../screens/NotificationsScreen";
import PayslipScreen from "../screens/PayslipScreen";
import DocumentsScreen from "../screens/DocumentsScreen";
import ChangePasswordScreen from "../screens/ChangePasswordScreen";
import SettingsScreen from "../screens/SettingsScreen";
import RegularizationScreen from "../screens/RegularizationScreen";
import TeamEmployeeProfileScreen from "../screens/TeamEmployeeProfileScreen";
import CompanySwitcherScreen from "../screens/CompanySwitcherScreen";
import ExpensesScreen from "../screens/ExpensesScreen";
import TimesheetsScreen from "../screens/TimesheetsScreen";
import ShiftsScreen from "../screens/ShiftsScreen";
import PerformanceScreen from "../screens/PerformanceScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ── Tab Icon Configuration ────────────────────────────────────────────────────
interface TabConfig {
  active: keyof typeof Ionicons.glyphMap;
  inactive: keyof typeof Ionicons.glyphMap;
}

const TAB_ICONS: Record<string, TabConfig> = {
  Home:       { active: "grid",         inactive: "grid-outline" },
  Attendance: { active: "finger-print", inactive: "finger-print-outline" },
  Manager:    { active: "people",       inactive: "people-outline" },
  Leaves:     { active: "time",         inactive: "time-outline" },
  Calendar:   { active: "calendar",     inactive: "calendar-outline" },
  Holidays:   { active: "sparkles",     inactive: "sparkles-outline" },
  Profile:    { active: "person",       inactive: "person-outline" },
};

function ExecutiveTabIcon({ name, focused }: { name: string; focused: boolean }) {
  const iconConfig = TAB_ICONS[name] ?? { active: "ellipse", inactive: "ellipse-outline" };
  const iconName = focused ? iconConfig.active : iconConfig.inactive;

  return (
    <View style={styles.tabIconWrap}>
      {focused && <View style={styles.tabActiveIndicator} />}
      <View style={[styles.tabIconCircle, focused && styles.tabIconCircleActive]}>
        <Ionicons
          name={iconName}
          size={focused ? 21 : 20}
          color={focused ? COLORS.primary : COLORS.textMuted}
        />
      </View>
    </View>
  );
}

const TAB_OPTS = {
  tabBarActiveTintColor: COLORS.primary,
  tabBarInactiveTintColor: COLORS.textMuted,
  headerShown: false,
  tabBarStyle: {
    height: Platform.OS === "ios" ? 82 : 68,
    paddingBottom: Platform.OS === "ios" ? 22 : 10,
    paddingTop: 8,
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
    backgroundColor: "#FFFFFF",
    ...SHADOW.md,
  },
  tabBarLabelStyle: {
    fontSize: 10.5,
    fontWeight: "700" as const,
    letterSpacing: 0.2,
    marginTop: 2,
  },
};

// ── Employee Tab Navigator ────────────────────────────────────────────────────
function EmployeeTabs() {
  return (
    <Tab.Navigator
      id="EmployeeTab"
      screenOptions={({ route }) => ({
        ...TAB_OPTS,
        tabBarIcon: ({ focused }) => <ExecutiveTabIcon name={route.name} focused={focused} />,
      })}
    >
      <Tab.Screen name="Home"       component={DashboardScreen}  />
      <Tab.Screen name="Attendance" component={AttendanceScreen} />
      <Tab.Screen name="Leaves"     component={LeavesScreen}     />
      <Tab.Screen name="Calendar"   component={CalendarScreen}   />
      <Tab.Screen name="Holidays"   component={HolidayScreen}    />
      <Tab.Screen name="Profile"    component={ProfileScreen}    />
    </Tab.Navigator>
  );
}

// ── Manager Tab Navigator ─────────────────────────────────────────────────────
function ManagerTabs() {
  return (
    <Tab.Navigator
      id="ManagerTab"
      screenOptions={({ route }) => ({
        ...TAB_OPTS,
        tabBarIcon: ({ focused }) => <ExecutiveTabIcon name={route.name} focused={focused} />,
      })}
    >
      <Tab.Screen name="Home"       component={DashboardScreen}  />
      <Tab.Screen name="Attendance" component={AttendanceScreen} />
      <Tab.Screen name="Manager"    component={ManagerScreen}    />
      <Tab.Screen name="Leaves"     component={LeavesScreen}     />
      <Tab.Screen name="Calendar"   component={CalendarScreen}   />
      <Tab.Screen name="Holidays"   component={HolidayScreen}    />
      <Tab.Screen name="Profile"    component={ProfileScreen}    />
    </Tab.Navigator>
  );
}

// ── Main Stack ────────────────────────────────────────────────────────────────
function MainStack() {
  const { user } = useAuth();
  const isManager = user?.role === "manager" || user?.role === "admin";
  const Tabs = isManager ? ManagerTabs : EmployeeTabs;

  return (
    <Stack.Navigator id="MainStack" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs"                   component={Tabs}                        />
      <Stack.Screen name="Notifications"          component={NotificationsScreen}         options={{ presentation: "card"  }} />
      <Stack.Screen name="Payslip"                component={PayslipScreen}               options={{ presentation: "card"  }} />
      <Stack.Screen name="Documents"              component={DocumentsScreen}             options={{ presentation: "card"  }} />
      <Stack.Screen name="ChangePassword"         component={ChangePasswordScreen}        options={{ presentation: "card"  }} />
      <Stack.Screen name="Settings"               component={SettingsScreen}              options={{ presentation: "card"  }} />
      <Stack.Screen name="Regularization"         component={RegularizationScreen}        options={{ presentation: "card"  }} />
      <Stack.Screen name="TeamEmployeeProfile"    component={TeamEmployeeProfileScreen}   options={{ presentation: "modal" }} />
      <Stack.Screen name="CompanySwitcher"        component={CompanySwitcherScreen}       options={{ presentation: "modal" }} />
      <Stack.Screen name="Expenses"               component={ExpensesScreen}              options={{ presentation: "card"  }} />
      <Stack.Screen name="Timesheets"             component={TimesheetsScreen}            options={{ presentation: "card"  }} />
      <Stack.Screen name="Shifts"                 component={ShiftsScreen}                options={{ presentation: "card"  }} />
      <Stack.Screen name="Performance"            component={PerformanceScreen}           options={{ presentation: "card"  }} />
    </Stack.Navigator>
  );
}

export const navigationRef = createNavigationContainerRef<any>();

const LINKING_CONFIG = {
  prefixes: ["uabindia://", "https://app.uabindia.com"],
  config: {
    screens: {
      Main: {
        screens: {
          Tabs: {
            screens: {
              Home: "home",
              Attendance: "attendance",
              Leaves: "leaves",
              Calendar: "calendar",
              Profile: "profile",
              Manager: "manager",
            },
          },
          Notifications: "notifications",
          Payslip: "payslip",
          Documents: "documents",
          ChangePassword: "change-password",
          Settings: "settings",
          Regularization: "regularization",
          CompanySwitcher: "switcher",
          Expenses: "expenses",
          Timesheets: "timesheets",
          Shifts: "shifts",
          Performance: "performance",
        },
      },
      Login: "login",
      Biometric: "biometric",
      OTPVerification: "otp",
    },
  },
};

// ── Root Navigator ────────────────────────────────────────────────────────────
export default function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // 1. Initialize periodic background SQLite sync work manager
    registerBackgroundSync().catch(() => {});

    // 2. Setup push notification tap / deep-link handler
    let subscription: any;
    try {
      const Notifications = require("expo-notifications");
      subscription = Notifications.addNotificationResponseReceivedListener((response: any) => {
        const data = response?.notification?.request?.content?.data;
        if (data?.screen && navigationRef.isReady()) {
          navigationRef.navigate(data.screen, data.params);
        }
      });
    } catch {}

    return () => {
      if (subscription?.remove) subscription.remove();
    };
  }, []);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer linking={LINKING_CONFIG} ref={navigationRef}>
      <Stack.Navigator id="RootStack" screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Biometric"       component={BiometricLoginScreen} />
            <Stack.Screen name="Login"           component={LoginScreen}          />
            <Stack.Screen name="OTPVerification" component={OTPVerificationScreen}/>
          </>
        ) : (
          <Stack.Screen name="Main" component={MainStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabIconWrap: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    width: 44,
    height: 32,
  },
  tabActiveIndicator: {
    position: "absolute",
    top: -8,
    width: 20,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
  tabIconCircle: {
    width: 34,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  tabIconCircleActive: {
    backgroundColor: "rgba(15, 82, 186, 0.08)",
  },
});
