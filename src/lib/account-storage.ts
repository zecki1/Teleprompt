"use client";

export interface KnownAccount {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  lastUsedAt: string;
}

const STORAGE_KEY = "tp_known_accounts";

export function getKnownAccounts(): KnownAccount[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as KnownAccount[];
  } catch {
    return [];
  }
}

export function saveKnownAccounts(accounts: KnownAccount[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  } catch {
    // localStorage might be full or unavailable
  }
}

export function addKnownAccount(account: {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}): void {
  if (!account.email) return;
  const accounts = getKnownAccounts();
  const existing = accounts.findIndex((a) => a.uid === account.uid);
  const entry: KnownAccount = {
    uid: account.uid,
    email: account.email,
    displayName: account.displayName,
    photoURL: account.photoURL,
    lastUsedAt: new Date().toISOString(),
  };
  if (existing >= 0) {
    accounts[existing] = { ...accounts[existing], ...entry };
    // Move to front
    accounts.splice(existing, 1);
    accounts.unshift(entry);
  } else {
    accounts.unshift(entry);
    // Keep max 5 accounts
    if (accounts.length > 5) accounts.pop();
  }
  saveKnownAccounts(accounts);
}

export function removeKnownAccount(uid: string): void {
  const accounts = getKnownAccounts().filter((a) => a.uid !== uid);
  saveKnownAccounts(accounts);
}

export function clearKnownAccounts(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
