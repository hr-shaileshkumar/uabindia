// utils/storage.ts – Universal storage shim for TypeScript resolution
// The actual implementation is in storage.native.ts / storage.web.ts (platform split)
// This file ensures TypeScript can resolve the module without errors.
import { User } from "./api";

export interface StoredAuthData {
  token: string;
  user: User;
}

// These are implemented in platform-specific files:
// utils/storage.native.ts → uses expo-secure-store
// utils/storage.web.ts    → uses localStorage
// TypeScript resolves via tsconfig paths or Metro bundler platform splitting.

export async function saveAuthData(_user: User, _token: string): Promise<void> {}
export async function loadAuthData(): Promise<StoredAuthData | null> { return null; }
export async function clearAuthData(): Promise<void> {}
export async function setBiometricEnabled(_enabled: boolean): Promise<void> {}
export async function isBiometricEnabled(): Promise<boolean> { return false; }
