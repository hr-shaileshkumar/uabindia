import { AxiosError } from "axios";

export type ApiErrorPayload = {
  code?: string;
  message?: string;
  errors?: Record<string, string[]>;
};

export const getApiErrorPayload = (error: unknown): ApiErrorPayload | null => {
  if (!(error instanceof AxiosError)) {
    return null;
  }

  const responseData = error.response?.data;
  if (!responseData || typeof responseData !== "object") {
    return null;
  }

  return responseData as ApiErrorPayload;
};

export const getApiErrorMessage = (error: unknown, fallback = "Something went wrong") => {
  const payload = getApiErrorPayload(error);
  const validationMessages = payload?.errors
    ? Object.values(payload.errors).flat().filter(Boolean)
    : [];

  if (validationMessages.length > 0) {
    return validationMessages.join(" ");
  }

  if (payload?.message) {
    return payload.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};

export const getApiErrorStatus = (error: unknown): number | undefined => {
  if (!(error instanceof AxiosError)) {
    return undefined;
  }

  return error.response?.status;
};

export const isApiConnectivityError = (error: unknown): boolean => {
  if (!(error instanceof AxiosError)) {
    return false;
  }

  if (!error.response) {
    return true;
  }

  return [404, 502, 503, 504].includes(error.response.status);
};
