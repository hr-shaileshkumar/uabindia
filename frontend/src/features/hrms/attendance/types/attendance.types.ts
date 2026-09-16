export type AttendanceRecord = {
  id: string;
  employeeId?: string;
  companyId?: string;
  projectId?: string;
  date?: string;
  employeeName?: string;
  employeeCode?: string;
  status?: string;
  checkIn?: string;
  checkOut?: string;
  punchType?: string;
  timestamp?: string;
  geoValidated?: boolean;
  deviceId?: string;
  source?: string;
  region?: string;
  branchLocation?: string;
  operatingUnit?: string;
  latitude?: number;
  longitude?: number;
  frsConfidence?: number;
  distanceFromLocationMeters?: number;
  matchedLocationId?: string;
  matchedLocationName?: string;
  isGeofenceBreached?: boolean;
  geofenceValidationMessage?: string;
};

export type AttendanceListProps = {
  fetchAttendance?: () => Promise<AttendanceRecord[]>;
  employeeId?: string;
};

export type EmployeeOption = {
  id: string;
  fullName: string;
  employeeCode?: string;
  department?: string;
  companyId?: string;
  projectId?: string;
};

export type ViewMode = "stream" | "daily";

export type InspectorTab = "telemetry" | "regularization" | "audit";

export const GLOBAL_REGIONS = [
  "All Regions",
  "Global Corporate HQ",
  "APAC - Singapore Hub",
  "EMEA - London Center",
  "Americas - New York Office",
  "India - Mumbai Metro",
  "India - Delhi NCR Hub",
  "India - Bengaluru Tech Center",
  "India - Regional Field Units",
  "Middle East - Dubai Center",
];

export const PUNCH_SOURCES = [
  "All Modes",
  "Mobile Face Recognition (FRS)",
  "Biometric Terminal",
  "Web Portal",
  "ESS Self-Service",
];

export type DailySummaryRow = {
  key: string;
  employeeName: string;
  employeeCode: string;
  employeeId?: string;
  dateStr: string;
  firstIn?: string;
  lastOut?: string;
  totalPunches: number;
  geoVerifiedCount: number;
  avgFrs: string;
  geoCompliance: number;
  durationHours: number;
  durationStr: string;
  status: string;
  region: string;
  branchLocation: string;
};

export const formatDateTime = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
};

export const formatTimeOnly = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

export const getRelativeTime = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
};

export const getInitials = (name?: string) => {
  if (!name) return "EM";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};
