const REMEMBER_KEY = "uab.auth.remember";
const EMAIL_KEY = "uab.auth.rememberedEmail";

export type RememberedLogin = {
  remember: boolean;
  email: string;
};

export function readRememberedLogin(): RememberedLogin {
  if (typeof window === "undefined") {
    return { remember: false, email: "" };
  }

  try {
    const remember = window.localStorage.getItem(REMEMBER_KEY) === "1";
    const email = remember ? (window.localStorage.getItem(EMAIL_KEY) || "").trim() : "";
    return { remember, email };
  } catch {
    return { remember: false, email: "" };
  }
}

/** Saves email only when remember is on. Never stores passwords. */
export function writeRememberedLogin(remember: boolean, email: string) {
  if (typeof window === "undefined") return;

  try {
    if (remember) {
      window.localStorage.setItem(REMEMBER_KEY, "1");
      window.localStorage.setItem(EMAIL_KEY, email.trim().toLowerCase());
    } else {
      window.localStorage.removeItem(REMEMBER_KEY);
      window.localStorage.removeItem(EMAIL_KEY);
    }
  } catch {
    // Ignore quota / private-mode failures.
  }
}
