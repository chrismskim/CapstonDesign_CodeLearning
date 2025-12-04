import type { Account } from "@/types";

const STORAGE_KEY = "mock_accounts_v1";

export function getMockAccounts(): Account[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial: Account[] = [
        {
          id: "admin",
          email: "admin@example.com",
          phoneNumber: "010-0000-0000",
          password_hash: "admin",
          status: "approved",
          is_root_admin: true,
          registered_at: new Date().toISOString(),
        },
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw) as Account[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveMockAccounts(accounts: Account[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  } catch {
  }
}