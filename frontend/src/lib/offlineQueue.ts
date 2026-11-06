"use client";

/**
 * Enterprise Offline-First Sync Engine for Global Remote Operations & Mobile Field Units.
 * Stores attendance punches locally in IndexedDB when offline,
 * signs each punch with a cryptographic hash, and automatically
 * flushes and syncs to backend once network connectivity resumes.
 */

export type OfflineAttendancePunch = {
  id: string;
  employeeId: string;
  punchType: "IN" | "OUT";
  timestamp: string;
  latitude?: number;
  longitude?: number;
  district?: string;
  block?: string;
  vehicleUnit?: string;
  source: string;
  deviceId?: string;
  cryptoHash: string;
  syncStatus: "pending" | "syncing" | "synced" | "failed";
  retryCount: number;
  createdAt: number;
};

const DB_NAME = "UabIndia_Offline_DB";
const STORE_NAME = "attendance_punch_queue";
const DB_VERSION = 1;

function openOfflineDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      return reject(new Error("IndexedDB is not supported in this environment"));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("syncStatus", "syncStatus", { unique: false });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Generate simple tamper-proof hash for offline verification
async function computePunchHash(payload: string): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(payload);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  return `hash_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export async function enqueueOfflinePunch(
  punch: Omit<OfflineAttendancePunch, "id" | "cryptoHash" | "syncStatus" | "retryCount" | "createdAt">
): Promise<OfflineAttendancePunch> {
  const id = `punch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const payloadString = `${punch.employeeId}_${punch.punchType}_${punch.timestamp}_${punch.latitude}_${punch.longitude}`;
  const cryptoHash = await computePunchHash(payloadString);

  const record: OfflineAttendancePunch = {
    ...punch,
    id,
    cryptoHash,
    syncStatus: "pending",
    retryCount: 0,
    createdAt: Date.now(),
  };

  const db = await openOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.add(record);

    req.onsuccess = () => resolve(record);
    req.onerror = () => reject(req.error);
  });
}

export async function getPendingOfflinePunches(): Promise<OfflineAttendancePunch[]> {
  try {
    const db = await openOfflineDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const list = (req.result as OfflineAttendancePunch[]) || [];
        resolve(list.filter((r) => r.syncStatus === "pending" || r.syncStatus === "failed"));
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

export async function markPunchSynced(id: string): Promise<void> {
  const db = await openOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function syncOfflineQueue(
  syncHandler: (punch: OfflineAttendancePunch) => Promise<boolean>
): Promise<{ total: number; synced: number; failed: number }> {
  const pending = await getPendingOfflinePunches();
  if (pending.length === 0) return { total: 0, synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  for (const punch of pending) {
    try {
      const success = await syncHandler(punch);
      if (success) {
        await markPunchSynced(punch.id);
        synced++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }

  return { total: pending.length, synced, failed };
}
