import { Injectable, NgZone, signal } from '@angular/core';
import * as signalR from '@microsoft/signalr';

import { getStoredToken } from '../auth/token-store';

/**
 * Compartilha conexões SignalR (por nome de hub) e centraliza
 * reconexão automática, logging e estado de conectividade.
 * O token JWT é enviado via accessTokenFactory (consulta string em WebSocket).
 */
@Injectable({ providedIn: 'root' })
export class SignalRService {
  private readonly connections = new Map<string, signalR.HubConnection>();
  private readonly _isConnected = signal(false);

  readonly isConnected = this._isConnected.asReadonly();

  constructor(private readonly ngZone: NgZone) {}

  async startConnection(
    hubName: string,
    hubUrl: string,
  ): Promise<signalR.HubConnection> {
    const existing = this.connections.get(hubName);
    if (existing) return existing;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => getStoredToken() ?? '',
        transport:
          signalR.HttpTransportType.WebSockets |
          signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          if (retryContext.elapsedMilliseconds < 60000) {
            return Math.min(
              1000 * Math.pow(2, retryContext.previousRetryCount),
              30000,
            );
          }
          return null;
        },
      })
      .configureLogging(signalR.LogLevel.None)
      .build();

    connection.onreconnecting(() =>
      this.ngZone.run(() => this._isConnected.set(false)),
    );
    connection.onreconnected(() =>
      this.ngZone.run(() => this._isConnected.set(true)),
    );
    connection.onclose(() =>
      this.ngZone.run(() => {
        this._isConnected.set(false);
        this.connections.delete(hubName);
      }),
    );

    try {
      await connection.start();
      this.connections.set(hubName, connection);
      this.ngZone.run(() => this._isConnected.set(true));
    } catch {
      setTimeout(() => void this.startConnection(hubName, hubUrl), 5000);
    }
    return connection;
  }

  async stopConnection(hubName: string): Promise<void> {
    const connection = this.connections.get(hubName);
    if (connection) {
      await connection.stop();
      this.connections.delete(hubName);
    }
  }

  async stopAll(): Promise<void> {
    for (const name of [...this.connections.keys()]) {
      await this.stopConnection(name);
    }
  }

  on(hubName: string, method: string, cb: (...args: unknown[]) => void): void {
    const connection = this.connections.get(hubName);
    if (connection) {
      connection.on(method, (...args: unknown[]) =>
        this.ngZone.run(() => cb(...args)),
      );
    }
  }

  off(hubName: string, method: string): void {
    this.connections.get(hubName)?.off(method);
  }

  async invoke(
    hubName: string,
    method: string,
    ...args: unknown[]
  ): Promise<void> {
    const connection = this.connections.get(hubName);
    if (
      connection &&
      connection.state === signalR.HubConnectionState.Connected
    ) {
      await connection.invoke(method, ...args);
      return;
    }
    throw new Error(`Hub ${hubName} não conectado`);
  }
}
