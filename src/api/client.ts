"use client";

/**
 * Cliente HTTP para o backend .NET (ASP.NET Core Web API).
 *
 * - JWT armazenado em localStorage (via lib/token) + cookie legível p/ middleware.
 * - Timeout configurável, erro tipado, refresh automático (401 -> POST /auth/refresh).
 * - Nenhum segredo de backend vive aqui: apenas o token do usuário logado.
 */

const DEFAULT_TIMEOUT_MS = 20000;

export function apiBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
    "http://localhost:5026"
  );
}

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  timeoutMs?: number;
  /** Quando true, não envia o header de Authorization (ex.: login/register). */
  skipAuth?: boolean;
  /** Quando true, não tenta refresh automático em 401. */
  noRefresh?: boolean;
}

let refreshPromise: Promise<boolean> | null = null;

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem("tp_token");
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (token) {
      window.localStorage.setItem("tp_token", token);
      // Cookie não-httpOnly (somente para gating de rota no middleware).
      const host = window.location.hostname;
      document.cookie = `tp_token=${encodeURIComponent(token)}; path=/; samesite=lax; max-age=28800; domain=${host}`;
    } else {
      window.localStorage.removeItem("tp_token");
      document.cookie = "tp_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
  } catch {
    // ignore
  }
}

export function clearStoredToken(): void {
  setStoredToken(null);
}

function buildUrl(path: string): string {
  const base = apiBaseUrl();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

/**
 * Renova o JWT atual de forma stateless: o backend valida a assinatura
 * do token e emite um novo com os mesmos claims (rolling refresh).
 */
async function tryRefresh(): Promise<boolean> {
  const token = getStoredToken();
  if (!token) return false;

  refreshPromise ??= (async () => {
    try {
      const res = await fetch(`${apiBaseUrl()}/api/v1/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
        signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
      });
      if (!res.ok) return false;
      const data = (await res.json()) as { token?: string };
      if (!data.token) return false;
      setStoredToken(data.token);
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    body,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    skipAuth = false,
    noRefresh = false,
    headers,
    ...rest
  } = options;

  const token = skipAuth ? null : getStoredToken();

  const init: RequestInit = {
    ...rest,
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    signal: AbortSignal.timeout(timeoutMs),
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  };

  let res = await fetch(buildUrl(path), init);

  // Refresh automático em 401 (exceto nas rotas de auth).
  if (res.status === 401 && !skipAuth && !noRefresh) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      const newToken = getStoredToken();
      init.headers = {
        ...(init.headers as Record<string, string>),
        Authorization: `Bearer ${newToken}`,
      };
      res = await fetch(buildUrl(path), init);
    }
  }

  if (!res.ok) {
    let message = `Erro ${res.status}`;
    let details: unknown;
    try {
      const data = (await res.json()) as { message?: string; Message?: string; errors?: unknown };
      message = data.message || data.Message || message;
      details = data;
    } catch {
      // corpo não-JSON
    }
    throw new ApiError(message, res.status, details);
  }

  if (res.status === 204) return undefined as T;
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return (await res.json()) as T;
  }
  return (await res.text()) as T;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    apiFetch<T>(path, { method: "GET", ...options }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiFetch<T>(path, { method: "POST", body, ...options }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiFetch<T>(path, { method: "PUT", body, ...options }),
  del: <T>(path: string, options?: RequestOptions) =>
    apiFetch<T>(path, { method: "DELETE", ...options }),
};
