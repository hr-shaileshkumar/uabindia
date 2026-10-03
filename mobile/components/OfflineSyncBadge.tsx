// components/OfflineSyncBadge.tsx — Luxury Offline Outbox Queue & Sync Indicator
import React, { useEffect, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  initOfflineDatabase,
  getPendingOfflineCount,
  syncOfflineQueue,
} from "../utils/offlineSync";
import { COLORS, RADIUS, SHADOW } from "../constants/theme";

export default function OfflineSyncBadge() {
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const checkQueue = useCallback(async () => {
    try {
      const counts = await getPendingOfflineCount();
      setPendingCount(counts.total);
    } catch {}
  }, []);

  useEffect(() => {
    initOfflineDatabase().then(() => {
      checkQueue();
    });

    const interval = setInterval(() => {
      checkQueue();
    }, 15000); // Check every 15s

    return () => clearInterval(interval);
  }, [checkQueue]);

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      const result = await syncOfflineQueue();
      await checkQueue();
      if (result.syncedCount > 0) {
        Alert.alert("Sync Complete", `${result.syncedCount} offline record(s) uploaded to ERP cloud.`);
      } else if (result.errors > 0) {
        Alert.alert("Sync Incomplete", "Network is unreachable. Records remain securely saved in local SQLite storage.");
      } else {
        Alert.alert("Up to Date", "All offline records are already synchronized with server.");
      }
    } catch {
      Alert.alert("Offline", "Device is currently offline. Your records are safe locally.");
    } finally {
      setSyncing(false);
    }
  };

  if (pendingCount === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <View style={styles.pulseDot} />
        <View>
          <Text style={styles.title}>
            {pendingCount} Offline Record{pendingCount > 1 ? "s" : ""} Pending
          </Text>
          <Text style={styles.sub}>Saved in local SQLite outbox queue</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.syncBtn, syncing && { opacity: 0.7 }]}
        onPress={handleManualSync}
        disabled={syncing}
        activeOpacity={0.8}
      >
        {syncing ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <Ionicons name="cloud-upload-outline" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.syncBtnText}>Sync Now</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderRadius: RADIUS.lg,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 4,
    ...SHADOW.xs,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#F59E0B",
    marginRight: 8,
  },
  title: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#B45309",
  },
  sub: {
    fontSize: 10.5,
    color: "#92400E",
    marginTop: 1,
  },
  syncBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D97706",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    marginLeft: 8,
  },
  syncBtnText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
