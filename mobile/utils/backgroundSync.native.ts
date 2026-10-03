// utils/backgroundSync.native.ts — Native Background Work Manager for Periodic SQLite Sync
import * as TaskManager from "expo-task-manager";
import * as BackgroundFetch from "expo-background-fetch";
import * as Notifications from "expo-notifications";
import { syncOfflineQueue, getPendingOfflineCount } from "./offlineSync";

export const BACKGROUND_SYNC_TASK = "UAB_ERP_BACKGROUND_SYNC";

// Define the background task executed by iOS Background App Refresh & Android WorkManager
TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    const counts = await getPendingOfflineCount();
    if (counts.total === 0) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    const result = await syncOfflineQueue();

    if (result.syncedCount > 0) {
      // Trigger a local system notification informing the user
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "ERP Cloud Synchronization",
          body: `${result.syncedCount} offline punch/timesheet record(s) synced in the background.`,
          data: { screen: "Dashboard" },
          sound: "default",
        },
        trigger: null, // Send immediately
      }).catch(() => {});

      return BackgroundFetch.BackgroundFetchResult.NewData;
    }

    return BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (err) {
    console.warn("Background fetch failed:", err);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerBackgroundSync(): Promise<boolean> {
  try {
    const status = await BackgroundFetch.getStatusAsync();
    if (
      status === BackgroundFetch.BackgroundFetchStatus.Restricted ||
      status === BackgroundFetch.BackgroundFetchStatus.Denied
    ) {
      console.warn("Background fetch is restricted or denied on this device.");
      return false;
    }

    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_SYNC_TASK);
    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
        minimumInterval: 15 * 60, // 15 minutes minimum interval
        stopOnTerminate: false,    // Continue running when app is closed
        startOnBoot: true,         // Run task after device reboot
      });
    }
    return true;
  } catch (err) {
    console.warn("Could not register background sync task:", err);
    return false;
  }
}

export async function unregisterBackgroundSync(): Promise<void> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_SYNC_TASK);
    if (isRegistered) {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
    }
  } catch {}
}
