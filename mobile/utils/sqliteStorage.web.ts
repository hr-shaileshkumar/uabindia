// utils/sqliteStorage.web.ts — Web implementation of offline ERP storage (LocalStorage / Memory)
import { OfflinePunch, OfflineTimesheet, OfflineClaim } from "./offlineSync";

let _punches: OfflinePunch[] = [];
let _timesheets: OfflineTimesheet[] = [];
let _claims: OfflineClaim[] = [];

export async function initStorage(): Promise<void> {
  try {
    const p = localStorage.getItem("uab_offline_punches");
    if (p) _punches = JSON.parse(p);
    const t = localStorage.getItem("uab_offline_timesheets");
    if (t) _timesheets = JSON.parse(t);
    const c = localStorage.getItem("uab_offline_claims");
    if (c) _claims = JSON.parse(c);
  } catch {}
}

export async function savePunch(punch: OfflinePunch): Promise<void> {
  _punches.push(punch);
  try { localStorage.setItem("uab_offline_punches", JSON.stringify(_punches)); } catch {}
}

export async function saveTimesheet(timesheet: OfflineTimesheet): Promise<void> {
  _timesheets.push(timesheet);
  try { localStorage.setItem("uab_offline_timesheets", JSON.stringify(_timesheets)); } catch {}
}

export async function saveClaim(claim: OfflineClaim): Promise<void> {
  _claims.push(claim);
  try { localStorage.setItem("uab_offline_claims", JSON.stringify(_claims)); } catch {}
}

export async function getPendingCounts(): Promise<{ punches: number; timesheets: number; claims: number; total: number }> {
  const punches = _punches.filter((p) => !p.synced).length;
  const timesheets = _timesheets.filter((t) => !t.synced).length;
  const claims = _claims.filter((c) => !c.synced).length;
  return { punches, timesheets, claims, total: punches + timesheets + claims };
}

export async function getPendingPunches(): Promise<OfflinePunch[]> {
  return _punches.filter((p) => !p.synced).slice(0, 25);
}

export async function deletePunch(id: string): Promise<void> {
  _punches = _punches.filter((p) => p.id !== id);
  try { localStorage.setItem("uab_offline_punches", JSON.stringify(_punches)); } catch {}
}

export async function getPendingTimesheets(): Promise<OfflineTimesheet[]> {
  return _timesheets.filter((t) => !t.synced).slice(0, 25);
}

export async function deleteTimesheet(id: string): Promise<void> {
  _timesheets = _timesheets.filter((t) => t.id !== id);
  try { localStorage.setItem("uab_offline_timesheets", JSON.stringify(_timesheets)); } catch {}
}

export async function getPendingClaims(): Promise<OfflineClaim[]> {
  return _claims.filter((c) => !c.synced).slice(0, 25);
}

export async function deleteClaim(id: string): Promise<void> {
  _claims = _claims.filter((c) => c.id !== id);
  try { localStorage.setItem("uab_offline_claims", JSON.stringify(_claims)); } catch {}
}
