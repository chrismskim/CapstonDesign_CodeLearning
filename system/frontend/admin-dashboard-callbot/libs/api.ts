const RAW_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
const API_BASE_URL = RAW_BASE.replace(/\/+$/, "");

function buildUrl(endpoint: string) {
  const ep = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const path = ep.startsWith("/api/") || ep === "/api" ? ep : `/api${ep}`;
  return `${API_BASE_URL}${path}`;
}

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  try { return localStorage.getItem("accessToken"); } catch { return null; }
}

type FetchOptions = RequestInit & { timeoutMs?: number };

export async function fetchFromApi(endpoint: string, options: FetchOptions = {}) {
  const url = buildUrl(endpoint);

  const { timeoutMs = 15000, headers: reqHeaders, ...rest } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const hasBody = rest.body != null;
  const headers = new Headers(reqHeaders || {});
  if (hasBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (!headers.has("Authorization")) {
    const token = getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  let res: Response;
  try {
    res = await fetch(url, {
      ...rest,
      headers,
      cache: "no-store",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (res.status === 204) return null;

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  const parseBody = async () => {
    try {
      return isJson ? await res.json() : await res.text();
    } catch {
      return null;
    }
  };
  const body = await parseBody();

  if (!res.ok) {
    const message =
      (isJson && body && (body.message || body.error)) ||
      (typeof body === "string" && body) ||
      `${res.status} ${res.statusText}`;
    const err = new Error(message) as Error & {
      status?: number;
      statusText?: string;
      body?: unknown;
      url?: string;
    };
    err.status = res.status;
    err.statusText = res.statusText;
    err.body = body;
    err.url = url;
    throw err;
  }

  return isJson ? body : null;
}

export function getPendingAccounts() {
  return fetchFromApi("/account/pending", { method: "GET" });
}

export function registerAccount(payload: {
  userId: string;
  password: string;
  email: string;
  phoneNumber: string;
}) {
  return fetchFromApi("/account/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function decideAccount(userId: string, approve: boolean) {
  return fetchFromApi("/account/approve", {
    method: "POST",
    body: JSON.stringify({ userId, approve }),
  });
}
