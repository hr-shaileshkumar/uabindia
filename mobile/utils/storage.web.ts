// utils/storage.web.ts – Web fallback using localStorage
const KEYS = { TOKEN: "hrms_token", USER: "hrms_user", BIOMETRIC: "hrms_biometric_enabled" };

export async function saveAuthData(token: string, user: object) {
  try {
    localStorage.setItem(KEYS.TOKEN, token);
    localStorage.setItem(KEYS.USER, JSON.stringify(user));
  } catch {}
}

export async function loadAuthData(): Promise<{ token: string; user: any } | null> {
  try {
    const token = localStorage.getItem(KEYS.TOKEN);
    const userStr = localStorage.getItem(KEYS.USER);
    if (!token || !userStr) return null;
    return { token, user: JSON.parse(userStr) };
  } catch { return null; }
}

export async function clearAuthData() {
  try {
    localStorage.removeItem(KEYS.TOKEN);
    localStorage.removeItem(KEYS.USER);
  } catch {}
}

export async function setBiometricEnabled(enabled: boolean) {
  try { localStorage.setItem(KEYS.BIOMETRIC, enabled ? "1" : "0"); } catch {}
}

export async function isBiometricEnabled(): Promise<boolean> {
  try { return localStorage.getItem(KEYS.BIOMETRIC) === "1"; }
  catch { return false; }
}
