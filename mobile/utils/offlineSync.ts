// utils/offlineSync.ts — Offline-First SQLite Sync Engine with Automatic Outbox Queue
import { attendancePunch, createTimesheet, createExpenseClaim } from "./api";
import * as storage from "./sqliteStorage";

export interface OfflinePunch {
  id: string;
  employeeId: string;
  punchType: "IN" | "OUT";
  latitude: number;
  longitude: number;
  source?: string;
  timestamp: string;
  synced: boolean;
}

export interface OfflineTimesheet {
  id: string;
  projectId: string;
  taskId?: string;
  workDate: string;
  hours: number;
  notes: string;
  timestamp: string;
  synced: boolean;
}

export interface OfflineClaim {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  description?: string;
  timestamp: string;
  synced: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// INITIALIZATION
// ─────────────────────────────────────────────────────────────────────────────

export async function initOfflineDatabase(): Promise<void> {
  await storage.initStorage();
}

// ─────────────────────────────────────────────────────────────────────────────
// QUEUE OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────

export async function queueOfflinePunch(
  punch: Omit<OfflinePunch, "id" | "synced" | "timestamp"> & { timestamp?: string }
): Promise<OfflinePunch> {
  const item: OfflinePunch = {
    ...punch,
    id: `punch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: punch.timestamp || new Date().toISOString(),
    synced: false,
  };

  await storage.savePunch(item);
  return item;
}

export async function queueOfflineTimesheet(
  entry: Omit<OfflineTimesheet, "id" | "synced" | "timestamp"> & { timestamp?: string }
): Promise<OfflineTimesheet> {
  const item: OfflineTimesheet = {
    ...entry,
    id: `ts_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: entry.timestamp || new Date().toISOString(),
    synced: false,
  };

  await storage.saveTimesheet(item);
  return item;
}

export async function queueOfflineClaim(
  claim: Omit<OfflineClaim, "id" | "synced" | "timestamp"> & { timestamp?: string }
): Promise<OfflineClaim> {
  const item: OfflineClaim = {
    ...claim,
    id: `claim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: claim.timestamp || new Date().toISOString(),
    synced: false,
  };

  await storage.saveClaim(item);
  return item;
}

// ─────────────────────────────────────────────────────────────────────────────
// PENDING COUNTS
// ─────────────────────────────────────────────────────────────────────────────

export async function getPendingOfflineCount(): Promise<{ punches: number; timesheets: number; claims: number; total: number }> {
  return await storage.getPendingCounts();
}

// ─────────────────────────────────────────────────────────────────────────────
// SYNC ENGINE EXECUTION
// ─────────────────────────────────────────────────────────────────────────────

export async function syncOfflineQueue(): Promise<{ syncedCount: number; errors: number }> {
  let syncedCount = 0;
  let errors = 0;

  try {
    // 1. Sync Punches
    const punches = await storage.getPendingPunches();
    for (const p of punches) {
      try {
        await attendancePunch({
          employeeId: p.employeeId,
          punchType: p.punchType,
          latitude: p.latitude,
          longitude: p.longitude,
          source: p.source || "OfflineSyncEngine",
        });
        await storage.deletePunch(p.id);
        syncedCount++;
      } catch {
        errors++;
      }
    }

    // 2. Sync Timesheets
    const timesheets = await storage.getPendingTimesheets();
    for (const t of timesheets) {
      try {
        await createTimesheet({
          projectId: t.projectId,
          taskId: t.taskId,
          workDate: t.workDate,
          hours: t.hours,
          notes: t.notes,
        });
        await storage.deleteTimesheet(t.id);
        syncedCount++;
      } catch {
        errors++;
      }
    }

    // 3. Sync Claims
    const claims = await storage.getPendingClaims();
    for (const c of claims) {
      try {
        await createExpenseClaim({
          title: c.title,
          category: c.category,
          amount: c.amount,
          date: c.date,
          description: c.description,
        });
        await storage.deleteClaim(c.id);
        syncedCount++;
      } catch {
        errors++;
      }
    }
  } catch (err) {
    console.warn("Offline sync error:", err);
  }

  return { syncedCount, errors };
}
