// utils/notifications.native.ts – Native (iOS/Android) push notification helpers
// NOTE: getExpoPushTokenAsync requires a Development Build in Expo SDK 53+.
// It will silently fail in Expo Go - this is expected behaviour.
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { API_BASE } from "./api";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(authToken: string | null): Promise<string | null> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") return null;

    // Set up Android notification channel
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("hrms", {
        name: "HRMS Notifications",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#1565C0",
      });
    }

    // Push tokens require a development build (Expo Go removed this in SDK 53)
    let pushToken: string | null = null;
    try {
      const tokenData = await Notifications.getExpoPushTokenAsync();
      pushToken = tokenData.data;
    } catch {
      // Running in Expo Go - skip remote push registration, local notifs still work
      return null;
    }

    // Register the token with backend
    if (authToken && pushToken) {
      await fetch(`${API_BASE}/notifications/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ pushToken }),
      }).catch(() => {});
    }
    return pushToken;
  } catch {
    return null;
  }
}

export async function getNotificationHistory(token: string): Promise<Array<{
  id: string; title: string; body: string; type: string;
  read: boolean; createdAt: string;
}>> {
  try {
    const res = await fetch(`${API_BASE}/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function markNotificationRead(id: string, token: string): Promise<void> {
  try {
    await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {}
}
