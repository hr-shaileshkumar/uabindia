// utils/sqliteStorage.native.ts — Native SQLite implementation using expo-sqlite WAL mode
import * as SQLite from "expo-sqlite";
import { OfflinePunch, OfflineTimesheet, OfflineClaim } from "./offlineSync";

let db: SQLite.SQLiteDatabase | null = null;

export async function initStorage(): Promise<void> {
  if (db) return;
  try {
    db = await SQLite.openDatabaseAsync("uab_offline_erp.db");
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS offline_punches (
        id TEXT PRIMARY KEY NOT NULL,
        employeeId TEXT NOT NULL,
        punchType TEXT NOT NULL,
        latitude REAL,
        longitude REAL,
        timestamp TEXT NOT NULL,
        synced INTEGER DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS offline_timesheets (
        id TEXT PRIMARY KEY NOT NULL,
        projectId TEXT NOT NULL,
        taskId TEXT,
        workDate TEXT NOT NULL,
        hours REAL NOT NULL,
        notes TEXT,
        timestamp TEXT NOT NULL,
        synced INTEGER DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS offline_claims (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        amount REAL NOT NULL,
        date TEXT NOT NULL,
        description TEXT,
        timestamp TEXT NOT NULL,
        synced INTEGER DEFAULT 0
      );
    `);
  } catch (err) {
    console.warn("Native SQLite init error:", err);
  }
}

export async function savePunch(punch: OfflinePunch): Promise<void> {
  await initStorage();
  if (!db) return;
  await db.runAsync(
    `INSERT INTO offline_punches (id, employeeId, punchType, latitude, longitude, timestamp, synced)
     VALUES (?, ?, ?, ?, ?, ?, 0);`,
    punch.id,
    punch.employeeId,
    punch.punchType,
    punch.latitude,
    punch.longitude,
    punch.timestamp
  );
}

export async function saveTimesheet(timesheet: OfflineTimesheet): Promise<void> {
  await initStorage();
  if (!db) return;
  await db.runAsync(
    `INSERT INTO offline_timesheets (id, projectId, taskId, workDate, hours, notes, timestamp, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0);`,
    timesheet.id,
    timesheet.projectId,
    timesheet.taskId ?? null,
    timesheet.workDate,
    timesheet.hours,
    timesheet.notes,
    timesheet.timestamp
  );
}

export async function saveClaim(claim: OfflineClaim): Promise<void> {
  await initStorage();
  if (!db) return;
  await db.runAsync(
    `INSERT INTO offline_claims (id, title, category, amount, date, description, timestamp, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0);`,
    claim.id,
    claim.title,
    claim.category,
    claim.amount,
    claim.date,
    claim.description ?? null,
    claim.timestamp
  );
}

export async function getPendingCounts(): Promise<{ punches: number; timesheets: number; claims: number; total: number }> {
  await initStorage();
  if (!db) return { punches: 0, timesheets: 0, claims: 0, total: 0 };
  try {
    const pCount: any = await db.getFirstAsync("SELECT COUNT(*) as cnt FROM offline_punches WHERE synced = 0;");
    const tCount: any = await db.getFirstAsync("SELECT COUNT(*) as cnt FROM offline_timesheets WHERE synced = 0;");
    const cCount: any = await db.getFirstAsync("SELECT COUNT(*) as cnt FROM offline_claims WHERE synced = 0;");

    const punches = pCount?.cnt ?? 0;
    const timesheets = tCount?.cnt ?? 0;
    const claims = cCount?.cnt ?? 0;
    return { punches, timesheets, claims, total: punches + timesheets + claims };
  } catch {
    return { punches: 0, timesheets: 0, claims: 0, total: 0 };
  }
}

export async function getPendingPunches(): Promise<OfflinePunch[]> {
  await initStorage();
  if (!db) return [];
  try {
    return await db.getAllAsync("SELECT * FROM offline_punches WHERE synced = 0 LIMIT 25;");
  } catch {
    return [];
  }
}

export async function deletePunch(id: string): Promise<void> {
  if (!db) return;
  await db.runAsync("DELETE FROM offline_punches WHERE id = ?;", id);
}

export async function getPendingTimesheets(): Promise<OfflineTimesheet[]> {
  await initStorage();
  if (!db) return [];
  try {
    return await db.getAllAsync("SELECT * FROM offline_timesheets WHERE synced = 0 LIMIT 25;");
  } catch {
    return [];
  }
}

export async function deleteTimesheet(id: string): Promise<void> {
  if (!db) return;
  await db.runAsync("DELETE FROM offline_timesheets WHERE id = ?;", id);
}

export async function getPendingClaims(): Promise<OfflineClaim[]> {
  await initStorage();
  if (!db) return [];
  try {
    return await db.getAllAsync("SELECT * FROM offline_claims WHERE synced = 0 LIMIT 25;");
  } catch {
    return [];
  }
}

export async function deleteClaim(id: string): Promise<void> {
  if (!db) return;
  await db.runAsync("DELETE FROM offline_claims WHERE id = ?;", id);
}
