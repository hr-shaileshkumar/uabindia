"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import * as signalR from "@microsoft/signalr";
import { useAuth } from "@/context/AuthContext";
import { appApi } from "@/services/modules";
import { notifyInfo } from "@/lib/notifications";

export type SignalRNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt?: string;
  metadata?: Record<string, unknown>;
};

interface SignalRNotificationContextType {
  notifications: SignalRNotification[];
  unreadCount: number;
  connectionState: "connected" | "connecting" | "disconnected";
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const SignalRNotificationContext = createContext<SignalRNotificationContextType>({
  notifications: [],
  unreadCount: 0,
  connectionState: "disconnected",
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  refreshNotifications: async () => {},
});

export function SignalRNotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<SignalRNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connectionState, setConnectionState] = useState<"connected" | "connecting" | "disconnected">("disconnected");

  const refreshNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const [listRes, countRes] = await Promise.allSettled([
        appApi.notifications.listMine({ take: 30 }, { suppressGlobalError: true }),
        appApi.notifications.unreadCount({ suppressGlobalError: true }),
      ]);

      if (countRes.status === "fulfilled") {
        setUnreadCount(Number(countRes.value.data?.unread ?? 0));
      }

      if (listRes.status === "fulfilled") {
        const payload = listRes.value.data as { items?: SignalRNotification[] } | SignalRNotification[];
        const rows = Array.isArray(payload) ? payload : Array.isArray(payload?.items) ? payload.items : [];
        setNotifications(
          rows.map((r) => ({
            id: r.id,
            type: r.type || "General",
            title: r.title || "Alert",
            message: r.message || "",
            isRead: Boolean(r.isRead),
            createdAt: r.createdAt,
            metadata: r.metadata,
          }))
        );
      }
    } catch {
      // Graceful fallback
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setConnectionState("disconnected");
      return;
    }

    void refreshNotifications();

    // Configure SignalR WebSocket Connection
    const hubUrl = process.env.NEXT_PUBLIC_SIGNALR_URL || "/hubs/notifications";
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        withCredentials: true,
        skipNegotiation: false,
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.None)
      .build();

    setConnectionState("connecting");

    connection.on("ReceiveNotification", (notification: SignalRNotification) => {
      setNotifications((prev) => [
        {
          id: notification.id,
          type: notification.type || "Alert",
          title: notification.title,
          message: notification.message,
          isRead: false,
          createdAt: notification.createdAt || new Date().toISOString(),
          metadata: notification.metadata,
        },
        ...prev,
      ]);
      setUnreadCount((c) => c + 1);

      // Trigger modern in-app toast notification
      notifyInfo(notification.message, notification.title);
    });

    connection
      .start()
      .then(() => setConnectionState("connected"))
      .catch(() => setConnectionState("disconnected"));

    connection.onreconnecting(() => setConnectionState("connecting"));
    connection.onreconnected(() => {
      setConnectionState("connected");
      void refreshNotifications();
    });
    connection.onclose(() => setConnectionState("disconnected"));

    return () => {
      void connection.stop();
    };
  }, [user, refreshNotifications]);

  const markAsRead = async (id: string) => {
    try {
      await appApi.notifications.markRead(id, { suppressGlobalError: true });
      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? { ...item, isRead: true } : item))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // Ignored
    }
  };

  const markAllAsRead = async () => {
    try {
      await appApi.notifications.markAllRead({ suppressGlobalError: true });
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Ignored
    }
  };

  return (
    <SignalRNotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        connectionState,
        markAsRead,
        markAllAsRead,
        refreshNotifications,
      }}
    >
      {children}
    </SignalRNotificationContext.Provider>
  );
}

export function useSignalRNotifications() {
  return useContext(SignalRNotificationContext);
}
