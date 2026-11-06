const LOCAL_API_FALLBACK = "http://127.0.0.1:5000";

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

export const getServerApiOrigin = (): string => {
  const configured = readFirstDefinedEnv("API_BASE_URL", "BACKEND_INTERNAL_URL", "NEXT_PUBLIC_API_URL");
  const normalized = stripApiVersionSuffix(configured);

  if (normalized) {
    return normalized;
  }

  return process.env.NODE_ENV === "development" ? LOCAL_API_FALLBACK : "";
};

export const getServerApiV1BaseUrl = (): string => {
  const origin = getServerApiOrigin();
  return origin ? `${origin}/api/v1` : "/api/v1";
};

export const getClientApiV1BaseUrl = (): string => "/api/v1";
