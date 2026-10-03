// utils/backgroundSync.web.ts — Web browser fallback background synchronizer
import { syncOfflineQueue, getPendingOfflineCount } from "./offlineSync";

let _intervalId: any = null;

export const BACKGROUND_SYNC_TASK = "UAB_ERP_BACKGROUND_SYNC";

export async function registerBackgroundSync(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (_intervalId) clearInterval(_intervalId);

  // Poll every 60 seconds when web app is active/online
  _intervalId = setInterval(async () => {
    try {
      if (navigator.onLine) {
        const counts = await getPendingOfflineCount();
        if (counts.total > 0) {
          await syncOfflineQueue();
        }
      }
    } catch {}
  }, 60000);

  return true;
}

export async function unregisterBackgroundSync(): Promise<void> {
  if (_intervalId) {
    clearInterval(_intervalId);
    _intervalId = null;
  }
}
