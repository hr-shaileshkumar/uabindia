"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import * as signalR from "@microsoft/signalr";
import { useAuth } from "@/context/AuthContext";
import { appApi } from "@/services/modules";
import { notifySuccess, notifyError, notifyWarning, notifyInfo } from "@/lib/notifications";

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
  const userId = user?.id || user?.userId;
  const [notifications, setNotifications] = useState<SignalRNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connectionState, setConnectionState] = useState<"connected" | "connecting" | "disconnected">("disconnected");

  const refreshNotifications = useCallback(async () => {
    if (!userId) return;
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
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      setConnectionState("disconnected");
      return;
    }

    void refreshNotifications();

    let isMounted = true;
    const hubUrl = process.env.NEXT_PUBLIC_SIGNALR_URL || "/hubs/notifications";
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        withCredentials: true,
        skipNegotiation: false,
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
        accessTokenFactory: () => {
          if (typeof document === "undefined") return "";
          const match = document.cookie.match(/(^| )access_token=([^;]+)/);
          return match ? decodeURIComponent(match[2]) : "";
        },
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.None)
      .build();

    setConnectionState("connecting");

    connection.on("ReceiveNotification", (notification: SignalRNotification) => {
      if (!isMounted) return;
      setNotifications((prev) => [
        {
          id: notification.id || `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
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

      // Trigger modern in-app toast notification matching severity
      const typeStr = (notification.type || "").toUpperCase();
      if (typeStr.includes("SUCCESS") || typeStr.includes("APPROV")) {
        notifySuccess(notification.message, notification.title);
      } else if (typeStr.includes("ERROR") || typeStr.includes("REJECT") || typeStr.includes("FAIL")) {
        notifyError(notification.message, notification.title);
      } else if (typeStr.includes("WARN")) {
        notifyWarning(notification.message, notification.title);
      } else {
        notifyInfo(notification.message, notification.title);
      }
    });

    connection
      .start()
      .then(() => {
        if (isMounted) setConnectionState("connected");
      })
      .catch(() => {
        if (isMounted) setConnectionState("disconnected");
      });

    connection.onreconnecting(() => {
      if (isMounted) setConnectionState("connecting");
    });
    connection.onreconnected(() => {
      if (isMounted) {
        setConnectionState("connected");
        void refreshNotifications();
      }
    });
    connection.onclose(() => {
      if (isMounted) setConnectionState("disconnected");
    });

    return () => {
      isMounted = false;
      void connection.stop();
    };
  }, [userId, refreshNotifications]);

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
