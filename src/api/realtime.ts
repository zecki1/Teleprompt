"use client";

import { apiBaseUrl } from "./client";

/**
 * Wrapper do client SignalR (@microsoft/signalr).
 *
 * - Conecta nos hubs `/hubs/script` (edição colaborativa) e `/hubs/tp` (teleprompter).
 * - Envia o token JWT via query string (`access_token`), conforme configurado
 *   no Program.cs do backend.
 * - A importação é dinâmica para não quebrar o build se o pacote ainda não
 *   estiver instalado (o uso ocorre apenas em runtime).
 */

export type ScriptHubEvent =
  | "PresenceChanged"
  | "ContentChanged"
  | "CursorMoved"
  | "CommentAdded"
  | "CommentResolved"
  | "VersionCreated"
  | "LockChanged"
  | "ChecklistUpdated";

export type TpHubEvent =
  | "ParticipantJoined"
  | "ScrollStateChanged"
  | "ModeChanged"
  | "SpeedChanged"
  | "RemoteCommand"
  | "Recorded"
  | "OrderChanged";

type SignalRHubConnection = import("@microsoft/signalr").HubConnection;

export class SignalRClient {
  private scriptConnection: SignalRHubConnection | null = null;
  private tpConnection: SignalRHubConnection | null = null;
  private tokenGetter: () => string | null;
  private handlers = new Map<string, Set<(args: unknown[]) => void>>();

  constructor(tokenGetter: () => string | null = () => null) {
    this.tokenGetter = tokenGetter;
  }

  private async createConnection(hub: string): Promise<SignalRHubConnection> {
    const signalR = await import("@microsoft/signalr");
    const token = this.tokenGetter();
    const url = `${apiBaseUrl().replace(/\/$/, "")}${hub}?access_token=${encodeURIComponent(token || "")}`;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(url, {
        accessTokenFactory: () => this.tokenGetter() || "",
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    const eventKeys = [...this.handlers.keys()];
    for (const eventName of eventKeys) {
      connection.on(eventName, (...args: unknown[]) => {
        this.emit(eventName, args);
      });
    }

    await connection.start();
    return connection;
  }

  private async ensure(hub: "script" | "tp"): Promise<SignalRHubConnection> {
    if (hub === "script") {
      this.scriptConnection ??= await this.createConnection("/hubs/script");
      return this.scriptConnection;
    }
    this.tpConnection ??= await this.createConnection("/hubs/tp");
    return this.tpConnection;
  }

  on(event: ScriptHubEvent | TpHubEvent, handler: (...args: unknown[]) => void): () => void {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event)!.add(handler);

    // Se a conexão já existe, registra o handler ao vivo.
    const conn = this.scriptConnection ?? this.tpConnection;
    conn?.on(event, (...args: unknown[]) => this.emit(event, args));

    return () => {
      this.handlers.get(event)?.delete(handler);
      conn?.off(event);
    };
  }

  private emit(event: string, args: unknown[]): void {
    this.handlers.get(event)?.forEach((handler) => handler(args));
  }

  // ----- Hub de Roteiro (edição colaborativa) -----

  async joinScript(scriptId: string): Promise<void> {
    const conn = await this.ensure("script");
    await conn.invoke("JoinScript", scriptId);
  }

  async leaveScript(scriptId: string): Promise<void> {
    const conn = await this.ensure("script");
    await conn.invoke("LeaveScript", scriptId);
  }

  async contentChanged(scriptId: string, content: string, user: string): Promise<void> {
    const conn = await this.ensure("script");
    await conn.invoke("ContentChanged", scriptId, content, user);
  }

  async cursorMoved(scriptId: string, position: string, user: string): Promise<void> {
    const conn = await this.ensure("script");
    await conn.invoke("CursorMoved", scriptId, position, user);
  }

  async commentAdded(scriptId: string, comment: unknown): Promise<void> {
    const conn = await this.ensure("script");
    await conn.invoke("CommentAdded", scriptId, comment);
  }

  async commentResolved(scriptId: string, commentId: string): Promise<void> {
    const conn = await this.ensure("script");
    await conn.invoke("CommentResolved", scriptId, commentId);
  }

  async versionCreated(scriptId: string, version: unknown): Promise<void> {
    const conn = await this.ensure("script");
    await conn.invoke("VersionCreated", scriptId, version);
  }

  async lockChanged(scriptId: string, lockedBy: string | null): Promise<void> {
    const conn = await this.ensure("script");
    await conn.invoke("LockChanged", scriptId, lockedBy);
  }

  async checklistUpdated(scriptId: string, items: unknown): Promise<void> {
    const conn = await this.ensure("script");
    await conn.invoke("ChecklistUpdated", scriptId, items);
  }

  // ----- Hub do Teleprompter -----

  async joinTp(tpSessionId: string, role: string): Promise<void> {
    const conn = await this.ensure("tp");
    await conn.invoke("JoinTp", tpSessionId, role);
  }

  async scrollStateChanged(
    tpSessionId: string,
    position: number,
    speed: number,
    mode: string,
  ): Promise<void> {
    const conn = await this.ensure("tp");
    await conn.invoke("ScrollStateChanged", tpSessionId, position, speed, mode);
  }

  async modeChanged(tpSessionId: string, mode: string): Promise<void> {
    const conn = await this.ensure("tp");
    await conn.invoke("ModeChanged", tpSessionId, mode);
  }

  async speedChanged(tpSessionId: string, speed: number): Promise<void> {
    const conn = await this.ensure("tp");
    await conn.invoke("SpeedChanged", tpSessionId, speed);
  }

  async remoteCommand(tpSessionId: string, command: string): Promise<void> {
    const conn = await this.ensure("tp");
    await conn.invoke("RemoteCommand", tpSessionId, command);
  }

  async recorded(tpSessionId: string, scriptId: string): Promise<void> {
    const conn = await this.ensure("tp");
    await conn.invoke("Recorded", tpSessionId, scriptId);
  }

  async orderChanged(tpSessionId: string, recordingOrder: unknown): Promise<void> {
    const conn = await this.ensure("tp");
    await conn.invoke("OrderChanged", tpSessionId, recordingOrder);
  }

  async stop(): Promise<void> {
    await this.scriptConnection?.stop();
    await this.tpConnection?.stop();
    this.scriptConnection = null;
    this.tpConnection = null;
  }
}

let singleton: SignalRClient | null = null;

/** Instância compartilhada (usa o token do localStorage). */
export function getSignalRClient(): SignalRClient {
  singleton ??= new SignalRClient(() => {
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage.getItem("tp_token");
    } catch {
      return null;
    }
  });
  return singleton;
}
