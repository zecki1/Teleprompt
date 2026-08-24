"use client";

/**
 * Cliente HTTP / Firestore para o backend.
 *
 * Quando NEXT_PUBLIC_USE_FIREBASE=true, todas as chamadas api.get/post/put/del
 * são direcionadas ao Firestore (client-side). Caso contrário, usa o backend .NET.
 */

const DEFAULT_TIMEOUT_MS = 20000;

export const useFirebase =
  typeof process !== "undefined" &&
  process.env.NEXT_PUBLIC_USE_FIREBASE === "true";

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
  skipAuth?: boolean;
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

/* ------------------------------------------------------------------ */
/*  HTTP API (backend .NET)                                            */
/* ------------------------------------------------------------------ */

function buildUrl(path: string): string {
  const base = apiBaseUrl();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

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

export async function httpFetch<T>(
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

const httpApi = {
  get: <T>(path: string, options?: RequestOptions) =>
    httpFetch<T>(path, { method: "GET", ...options }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    httpFetch<T>(path, { method: "POST", body, ...options }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    httpFetch<T>(path, { method: "PUT", body, ...options }),
  del: <T>(path: string, options?: RequestOptions) =>
    httpFetch<T>(path, { method: "DELETE", ...options }),
};

/* ------------------------------------------------------------------ */
/*  Firestore API (client-side)                                        */
/* ------------------------------------------------------------------ */

async function firestoreRequest<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const { getFirebaseDb, getFirebaseAuth } = await import("@/lib/firebase");
  const fs = await import("firebase/firestore");
  const {
    collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc,
    query, where, orderBy, limit: fbLimit, Timestamp,
  } = fs;

  const db = getFirebaseDb();
  const auth = getFirebaseAuth();

  const parts = path.replace(/^\/api\/v1\//, "").split("/").filter(Boolean);
  const mainCollection = parts[0];

  const authUserId = auth.currentUser?.uid || "";

  const COLLECTION_MAP: Record<string, string> = {
    projects: "projects",
    scripts: "scripts",
    workspaces: "workspaces",
    users: "users",
    teams: "teams",
    presenters: "presenters",
    activities: "activities",
  };

  const COLLECTION_ALIAS: Record<string, string> = {
    "debug-logs": "debug_logs",
    "error-reports": "error_reports",
  };

  function resolveCollection(name: string): string {
    return COLLECTION_MAP[name] || COLLECTION_ALIAS[name] || name;
  }

  function toDate(v: unknown): string {
    if (!v) return new Date().toISOString();
    if (v instanceof Date) return v.toISOString();
    if (typeof v === "string") return v;
    if (typeof v === "object" && v !== null && "toDate" in v) {
      return (v as { toDate: () => Date }).toDate().toISOString();
    }
    if (typeof v === "object" && v !== null && "seconds" in v) {
      return new Date((v as { seconds: number }).seconds * 1000).toISOString();
    }
    return String(v);
  }

  function firestoreDocToPlain(obj: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v && typeof v === "object" && "seconds" in v) {
        result[k] = toDate(v);
      } else if (v && typeof v === "object" && "toDate" in v) {
        result[k] = toDate(v);
      } else if (Array.isArray(v)) {
        result[k] = v.map((item) =>
          item && typeof item === "object" && !Array.isArray(item)
            ? firestoreDocToPlain(item as Record<string, unknown>)
            : item,
        );
      } else if (v && typeof v === "object" && !(v instanceof Date)) {
        result[k] = firestoreDocToPlain(v as Record<string, unknown>);
      } else {
        result[k] = v;
      }
    }
    return result;
  }

  function applyWhereClauses(
    q: ReturnType<typeof query>,
    params: URLSearchParams,
  ): ReturnType<typeof query> {
    const skip = new Set(["page", "pageSize", "limit"]);
    const fieldMap: Record<string, string> = {
      workspaceid: "workspaceId",
      projectid: "projectId",
      scriptid: "scriptId",
    };
    for (const [key, value] of params.entries()) {
      if (skip.has(key.toLowerCase())) continue;
      const field = fieldMap[key.toLowerCase()] || key;
      q = query(q, where(field, "==", value));
    }
    return q;
  }

  const jsonToFirestore = (data: Record<string, unknown>): Record<string, unknown> => {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data)) {
      if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v)) {
        result[k] = Timestamp.fromDate(new Date(v));
      } else {
        result[k] = v;
      }
    }
    return result;
  };

  const pathStr = path;

  if (mainCollection === "workspaces" && parts[1] === "mine") {
    if (method === "GET") {
      const colRef = collection(db, "workspaces");
      const q = authUserId
        ? query(colRef, where("members", "array-contains", authUserId))
        : query(colRef);
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({
        id: d.id,
        ...firestoreDocToPlain(d.data() as Record<string, unknown>),
      })) as T;
    }
    return {} as T;
  }

  if (mainCollection === "auth") {
    return {} as T;
  }

  if (mainCollection === "reports") {
    const scriptsSnap = await getDocs(collection(db, "scripts"));
    const projectsSnap = await getDocs(collection(db, "projects"));
    const scripts = scriptsSnap.docs.map((d) => d.data());
    const projects = projectsSnap.docs.map((d) => d.data());

    const byStatusMap: Record<string, number> = {};
    scripts.forEach((s) => {
      const st = (s.status as string) || "unknown";
      byStatusMap[st] = (byStatusMap[st] || 0) + 1;
    });

    const byBucketMap: Record<string, number> = {};
    projects.forEach((p) => {
      const b = (p.bucket as string) || "Sem bucket";
      byBucketMap[b] = (byBucketMap[b] || 0) + 1;
    });

    return {
      totalScripts: scripts.length,
      totalProjects: projects.length,
      byStatus: Object.entries(byStatusMap).map(([status, count]) => ({ status, count })),
      byBucket: Object.entries(byBucketMap).map(([bucket, count]) => ({ bucket, count })),
      growth: [],
      generatedAt: new Date().toISOString(),
    } as T;
  }

  if (parts.length === 1) {
    const colName = resolveCollection(mainCollection);
    const colRef = collection(db, colName);

    if (method === "GET") {
      const params = new URLSearchParams(pathStr.split("?")[1] || "");
      let q = query(colRef);
      q = applyWhereClauses(q, params);
      q = query(q, orderBy("createdAt", "desc"));
      const limitVal = params.get("limit") || params.get("pageSize");
      if (limitVal) q = query(q, fbLimit(Number(limitVal)));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({
        id: d.id,
        ...firestoreDocToPlain(d.data() as Record<string, unknown>),
      })) as T;
    }

    if (method === "POST" && body) {
      const data = jsonToFirestore(body as Record<string, unknown>);
      if (authUserId && !data.createdBy) data.createdBy = authUserId;
      if (!data.createdAt) data.createdAt = Timestamp.now();
      const docRef = await addDoc(colRef, data);
      const created = await getDoc(docRef);
      return {
        id: docRef.id,
        ...firestoreDocToPlain(created.data() as Record<string, unknown>),
      } as T;
    }

    return {} as T;
  }

  if (parts.length >= 2) {
    const docId = parts[1];

    if (parts.length === 2) {
      const colName = resolveCollection(mainCollection);
      const docRef = doc(db, colName, docId);

      if (method === "GET") {
        const snap = await getDoc(docRef);
        if (!snap.exists()) throw new ApiError("Not found", 404);
        return {
          id: snap.id,
          ...firestoreDocToPlain(snap.data() as Record<string, unknown>),
        } as T;
      }
      if (method === "PUT" && body) {
        const data = jsonToFirestore(body as Record<string, unknown>);
        if (!data.updatedAt) data.updatedAt = Timestamp.now();
        await updateDoc(docRef, data);
        const updated = await getDoc(docRef);
        return {
          id: updated.id,
          ...firestoreDocToPlain(updated.data() as Record<string, unknown>),
        } as T;
      }
      if (method === "DELETE") {
        await deleteDoc(docRef);
        return undefined as T;
      }
    }

    if (parts.length === 3) {
      const subName = parts[2];

      if (subName === "members" && mainCollection === "workspaces") {
        const docRef = doc(db, "workspaces", docId);
        const snap = await getDoc(docRef);
        if (!snap.exists()) return [] as T;
        const data = snap.data();
        const memberIds: string[] = data.members || [];
        if (method === "GET") {
          if (memberIds.length === 0) return [] as T;
          const usersCol = collection(db, "users");
          const memberDocs = await Promise.all(
            memberIds.map((id) => getDoc(doc(usersCol, id))).filter(Boolean),
          );
          return memberDocs
            .filter((s) => s.exists())
            .map((s) => ({
              id: s.id,
              ...firestoreDocToPlain(s.data() as Record<string, unknown>),
            })) as T;
        }
        if (method === "POST" && body) {
          const email = (body as { email?: string }).email;
          if (!email) return {} as T;
          const usersSnap = await getDocs(
            query(collection(db, "users"), where("email", "==", email)),
          );
          if (!usersSnap.empty) {
            const userId = usersSnap.docs[0].id;
            await updateDoc(docRef, {
              members: [...new Set([...memberIds, userId])],
            });
          }
          return {} as T;
        }
      }

      if (subName === "members" && mainCollection === "teams") {
        if (method === "GET") {
          return [] as T;
        }
        return {} as T;
      }

      if (subName === "scripts" && mainCollection === "projects") {
        if (method === "GET") {
          const scriptsCol = collection(db, "scripts");
          const q = query(scriptsCol, where("projectId", "==", docId));
          const snap = await getDocs(q);
          return snap.docs.map((d) => ({
            id: d.id,
            ...firestoreDocToPlain(d.data() as Record<string, unknown>),
          })) as T;
        }
      }

      if (mainCollection === "scripts" && (subName === "comments" || subName === "versions" || subName === "checklist")) {
        const subColName = subName;
        const subColRef = collection(db, "scripts", docId, subColName);

        if (method === "GET") {
          const snap = await getDocs(query(subColRef, orderBy("createdAt", "desc")));
          return snap.docs.map((d) => ({
            id: d.id,
            ...firestoreDocToPlain(d.data() as Record<string, unknown>),
          })) as T;
        }
        if (method === "POST" && body) {
          const data = jsonToFirestore(body as Record<string, unknown>);
          if (!data.createdAt) data.createdAt = Timestamp.now();
          if (authUserId) data.authorId = authUserId;
          const docRef = await addDoc(subColRef, data);
          const created = await getDoc(docRef);
          return {
            id: docRef.id,
            ...firestoreDocToPlain(created.data() as Record<string, unknown>),
          } as T;
        }
        if (method === "PUT" && body) {
          const items = (body as { items?: unknown[] }).items;
          if (items !== undefined) {
            return {} as T;
          }
          return {} as T;
        }
      }
    }

    if (parts.length === 4) {
      if (mainCollection === "scripts" && parts[2] === "comments") {
        const commentId = parts[3];
        const docRef = doc(db, "scripts", docId, "comments", commentId);
        if (method === "PUT") {
          await updateDoc(docRef, { isResolved: true });
          const snap = await getDoc(docRef);
          return {
            id: snap.id,
            ...firestoreDocToPlain(snap.data() as Record<string, unknown>),
          } as T;
        }
      }

      if (mainCollection === "scripts" && parts[2] === "versions") {
        const versionNum = parts[3];
        if (method === "POST") {
          const versionsCol = collection(db, "scripts", docId, "versions");
          const q = query(versionsCol, where("versionNumber", "==", Number(versionNum)));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const versionData = snap.docs[0].data();
            await updateDoc(doc(db, "scripts", docId), {
              content: versionData.content,
              updatedAt: Timestamp.now(),
            });
          }
          const scriptSnap = await getDoc(doc(db, "scripts", docId));
          return {
            id: scriptSnap.id,
            ...firestoreDocToPlain(scriptSnap.data() as Record<string, unknown>),
          } as T;
        }
      }
    }

    if (parts.length === 5) {
      if (mainCollection === "scripts" && parts[2] === "versions" && parts[4] === "revert") {
        const versionNum = parts[3];
        const versionsCol = collection(db, "scripts", docId, "versions");
        const q = query(versionsCol, where("versionNumber", "==", Number(versionNum)));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const versionData = snap.docs[0].data();
          await updateDoc(doc(db, "scripts", docId), {
            content: versionData.content,
            updatedAt: Timestamp.now(),
          });
        }
        const scriptSnap = await getDoc(doc(db, "scripts", docId));
        return {
          id: scriptSnap.id,
          ...firestoreDocToPlain(scriptSnap.data() as Record<string, unknown>),
        } as T;
      }
    }
  }

  if (method === "POST") {
    const aliasCol = COLLECTION_ALIAS[mainCollection] || mainCollection;
    if (aliasCol && !["auth", "reports"].includes(mainCollection)) {
      const colRef = collection(db, aliasCol);
      const data = jsonToFirestore((body || {}) as Record<string, unknown>);
      if (!data.createdAt) data.createdAt = Timestamp.now();
      if (authUserId) data.createdBy = authUserId;
      const docRef = await addDoc(colRef, data);
      const created = await getDoc(docRef);
      return {
        id: docRef.id,
        ...firestoreDocToPlain(created.data() as Record<string, unknown>),
      } as T;
    }
  }

  return {} as T;
}

const firestoreApi = {
  get: <T>(path: string, _options?: RequestOptions) =>
    firestoreRequest<T>("GET", path),
  post: <T>(path: string, body?: unknown, _options?: RequestOptions) =>
    firestoreRequest<T>("POST", path, body),
  put: <T>(path: string, body?: unknown, _options?: RequestOptions) =>
    firestoreRequest<T>("PUT", path, body),
  del: <T>(path: string, _options?: RequestOptions) =>
    firestoreRequest<T>("DELETE", path),
};

/* ------------------------------------------------------------------ */
/*  Export api based on mode                                           */
/* ------------------------------------------------------------------ */

export const api = useFirebase ? firestoreApi : httpApi;
