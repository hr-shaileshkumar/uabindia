// utils/storage.native.ts – Native secure token persistence via expo-secure-store
import * as SecureStore from "expo-secure-store";

const KEYS = { TOKEN: "hrms_token", USER: "hrms_user", BIOMETRIC: "hrms_biometric_enabled" };

export async function saveAuthData(token: string, user: object) {
  await SecureStore.setItemAsync(KEYS.TOKEN, token);
  await SecureStore.setItemAsync(KEYS.USER, JSON.stringify(user));
}

export async function loadAuthData(): Promise<{ token: string; user: any } | null> {
  const token = await SecureStore.getItemAsync(KEYS.TOKEN);
  const userStr = await SecureStore.getItemAsync(KEYS.USER);
  if (!token || !userStr) return null;
  try { return { token, user: JSON.parse(userStr) }; }
  catch { return null; }
}

export async function clearAuthData() {
  await SecureStore.deleteItemAsync(KEYS.TOKEN);
  await SecureStore.deleteItemAsync(KEYS.USER);
}

export async function setBiometricEnabled(enabled: boolean) {
  await SecureStore.setItemAsync(KEYS.BIOMETRIC, enabled ? "1" : "0");
}

export async function isBiometricEnabled(): Promise<boolean> {
  const v = await SecureStore.getItemAsync(KEYS.BIOMETRIC);
  return v === "1";
}
