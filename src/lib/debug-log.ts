"use client";

import { writeDebugLog } from "@/api/admin";

export type DebugLevel = "debug" | "info" | "warn" | "error";

export interface DebugUserContext {
  uid?: string;
  email?: string;
  name?: string;
  role?: string;
  workspaceId?: string;
  isSuperAdmin?: boolean;
  permissions?: string[];
}

export interface DebugLogEntry {
  ts: unknown;
  t: number;
  level: DebugLevel;
  context: string;
  message: string;
  stack?: string;
  uid?: string;
  email?: string;
  name?: string;
  role?: string;
  workspaceId?: string;
  permissions?: string[];
  url?: string;
  page?: string;
  ua?: string;
  meta?: Record<string, unknown>;
  durationMs?: number;
}

const FLUSH_BATCH_SIZE = 20;
const FLUSH_INTERVAL_MS = 3000;
const RING_BUFFER_SIZE = 60;

let currentUser: DebugUserContext | null = null;
let enabled = true;

const queue: DebugLogEntry[] = [];
const ringBuffer: DebugLogEntry[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;

const ENABLED_KEY = "teleprompt_debug_log_enabled";

/** Ativa/desativa o registro de logs (persistido em localStorage). */
export function setDebugLogEnabled(value: boolean) {
  enabled = value;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(ENABLED_KEY, value ? "1" : "0");
    } catch {}
  }
}

export function isDebugLogEnabled(): boolean {
  return enabled;
}

/** Vincula o usuário atual (uid, email, papel e permissões) aos próximos logs. */
export function setDebugUserContext(user: DebugUserContext | null) {
  currentUser = user;
}

/** Retorna os últimos logs (buffer em memória) para compor relatórios de erro. */
export function getRecentLogs(count = RING_BUFFER_SIZE): DebugLogEntry[] {
  return ringBuffer.slice(-Math.max(1, count));
}

function sanitizeMeta(meta?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!meta) return undefined;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(meta)) {
    if (v === undefined || v === null) continue;
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
      out[k] = v;
    } else if (Array.isArray(v)) {
      out[k] = v.map((item) =>
        typeof item === "string" || typeof item === "number" || typeof item === "boolean"
          ? item
          : JSON.stringify(item)
      );
    } else {
      try {
        out[k] = JSON.stringify(v);
      } catch {
        out[k] = String(v);
      }
    }
  }
  return out;
}

function buildEntry(
  level: DebugLevel,
  context: string,
  message: string,
  meta?: Record<string, unknown>,
  err?: unknown,
  durationMs?: number
): DebugLogEntry {
  const stack = err instanceof Error ? err.stack : err ? String(err) : undefined;
  const entry: DebugLogEntry = {
    ts: new Date().toISOString(),
    t: Date.now(),
    level,
    context,
    message,
    meta: sanitizeMeta(meta),
    ...(durationMs !== undefined ? { durationMs: Math.round(durationMs) } : {}),
    ...(currentUser
      ? {
          uid: currentUser.uid,
          email: currentUser.email,
          name: currentUser.name,
          role: currentUser.role,
          workspaceId: currentUser.workspaceId,
          permissions: currentUser.permissions,
        }
      : {}),
  };
  if (typeof window !== "undefined") {
    entry.url = window.location.href;
    entry.page = window.location.pathname;
    entry.ua = window.navigator.userAgent;
  }
  if (stack) entry.stack = stack;
  (Object.keys(entry) as (keyof DebugLogEntry)[]).forEach((k) => {
    if (entry[k] === undefined) delete entry[k];
  });
  return entry;
}

function mirrorToConsole(entry: DebugLogEntry) {
  const label = `[TP-DEBUG:${entry.level}:${entry.context}]`;
  const extras: unknown[] = [];
  if (entry.durationMs !== undefined) extras.push(`⏱ ${entry.durationMs}ms`);
  if (entry.meta) extras.push(entry.meta);
  if (entry.stack) extras.push(entry.stack);
  if (entry.level === "error") console.error(label, entry.message, ...extras);
  else if (entry.level === "warn") console.warn(label, entry.message, ...extras);
  else console.log(label, entry.message, ...extras);
}

async function flushQueue() {
  if (queue.length === 0) return;
  const batchEntries = queue.splice(0, FLUSH_BATCH_SIZE);
  try {
    await Promise.all(
      batchEntries.map((e) =>
        writeDebugLog({
          level: e.level,
          source: e.context,
          message: e.message,
          metadataJson: JSON.stringify({
            ...(e.meta ? { meta: e.meta } : {}),
            ...(e.durationMs !== undefined ? { durationMs: e.durationMs } : {}),
            ...(e.url ? { url: e.url } : {}),
            ...(e.page ? { page: e.page } : {}),
            ...(e.stack ? { stack: e.stack } : {}),
            ...(e.uid ? { uid: e.uid } : {}),
          }),
        }).catch(() => {
          // Não derrubar o app se o back-end estiver indisponível.
        })
      )
    );
  } catch {
    // ignora erros em lote
  }
}

function startFlushTimer() {
  if (flushTimer || typeof window === "undefined") return;
  flushTimer = setInterval(() => {
    if (queue.length > 0) void flushQueue();
  }, FLUSH_INTERVAL_MS);
}

function log(
  level: DebugLevel,
  context: string,
  message: string,
  meta?: Record<string, unknown>,
  err?: unknown,
  durationMs?: number
) {
  if (!enabled || typeof window === "undefined") return;
  const entry = buildEntry(level, context, message, meta, err, durationMs);
  mirrorToConsole(entry);
  queue.push(entry);
  ringBuffer.push(entry);
  if (ringBuffer.length > RING_BUFFER_SIZE) ringBuffer.shift();
  startFlushTimer();
  if (level === "error" || queue.length >= FLUSH_BATCH_SIZE) {
    void flushQueue();
  }
}

export function debugLog(level: DebugLevel, context: string, message: string, meta?: Record<string, unknown>, err?: unknown) {
  log(level, context, message, meta, err);
}

export function debugInfo(context: string, message: string, meta?: Record<string, unknown>) {
  log("info", context, message, meta);
}

export function debugWarn(context: string, message: string, meta?: Record<string, unknown>, err?: unknown) {
  log("warn", context, message, meta, err);
}

export function debugError(context: string, message: string, err?: unknown, meta?: Record<string, unknown>) {
  log("error", context, message, meta, err);
}

/** Registra um log com duração em ms (usa startedAt como referência, default performance.now()). */
export function debugPerf(context: string, message: string, startedAt?: number, meta?: Record<string, unknown>) {
  const start = startedAt ?? performance.now();
  const durationMs = performance.now() - start;
  log("info", context, message, meta, undefined, durationMs);
}

let globalCaptureInstalled = false;

/**
 * Captura erros de runtime (window.onerror + unhandledrejection) e os registra
 * no buffer/log do back-end automaticamente. Chamar uma única vez no bootstrap.
 */
export function initGlobalErrorCapture() {
  if (globalCaptureInstalled || typeof window === "undefined") return;
  globalCaptureInstalled = true;

  window.addEventListener("error", (event) => {
    const message = event.message || "Erro de runtime desconhecido";
    const meta: Record<string, unknown> = { type: "window.onerror", filename: event.filename, line: event.lineno, col: event.colno };
    if (event.error instanceof Error) {
      debugError("global", message, event.error, meta);
    } else {
      log("error", "global", message, meta, event.error);
    }
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const message = reason instanceof Error ? reason.message : "Promessa rejeitada sem tratamento";
    if (reason instanceof Error) {
      debugError("global", message, reason, { type: "unhandledrejection" });
    } else {
      log("error", "global", message, { type: "unhandledrejection", reason: typeof reason === "string" ? reason : undefined }, reason);
    }
  });
}
