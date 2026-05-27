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
