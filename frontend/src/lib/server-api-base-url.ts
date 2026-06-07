import fs from "node:fs";
import path from "node:path";

const LOCAL_API_FALLBACK = "http://localhost:5000";

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, "");

export const stripApiVersionSuffix = (value: string): string =>
  trimTrailingSlash(value).replace(/\/api\/v1$/i, "");

const readFirstDefinedEnv = (...keys: string[]): string => {
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
};

const parseEnvFileValue = (fileContent: string, key: string): string => {
  const lines = fileContent.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const currentKey = trimmed.slice(0, separatorIndex).trim();
    if (currentKey !== key) {
      continue;
    }

    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    return rawValue.replace(/^['"]|['"]$/g, "").trim();
  }

  return "";
};

const readEnvFileValue = (filePath: string, ...keys: string[]): string => {
  if (!fs.existsSync(filePath)) {
    return "";
  }

  const fileContent = fs.readFileSync(filePath, "utf8");
  for (const key of keys) {
    const value = parseEnvFileValue(fileContent, key);
    if (value) {
      return value;
    }
  }

  return "";
};

const getCandidateEnvFiles = (): string[] => {
  const cwd = process.cwd();
  const parent = path.resolve(cwd, "..");

  return [
    path.join(cwd, ".env.local"),
    path.join(cwd, ".env"),
    path.join(parent, ".env.local"),
    path.join(parent, ".env"),
  ];
};

const readServerApiBaseFromEnvFiles = (): string => {
  const keys = ["API_BASE_URL", "BACKEND_INTERNAL_URL", "NEXT_PUBLIC_API_URL"];

  for (const filePath of getCandidateEnvFiles()) {
    const value = readEnvFileValue(filePath, ...keys);
    if (value) {
      return value;
    }
  }

  return "";
};

export const getServerApiOrigin = (): string => {
  const configured = readFirstDefinedEnv("API_BASE_URL", "BACKEND_INTERNAL_URL", "NEXT_PUBLIC_API_URL");
  const fileConfigured = configured || readServerApiBaseFromEnvFiles();
  const normalized = stripApiVersionSuffix(fileConfigured);

  if (normalized) {
    return normalized;
  }

  return process.env.NODE_ENV === "development" ? LOCAL_API_FALLBACK : "";
};

export const getServerApiV1BaseUrl = (): string => {
  const origin = getServerApiOrigin();
  return origin ? `${origin}/api/v1` : "/api/v1";
};
