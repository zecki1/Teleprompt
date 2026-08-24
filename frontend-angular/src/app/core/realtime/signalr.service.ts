import { Injectable, NgZone, signal } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { AuthService } from '../auth/auth.service';
import { environment } from '@env/environment';

@Injectable({ providedIn: 'root' })
export class SignalRService {
  private connections = new Map<string, signalR.HubConnection>();
  private readonly _isConnected = signal(false);

  readonly isConnected = this._isConnected.asReadonly();

  constructor(
    private ngZone: NgZone,
    private authService: AuthService
  ) {}

  async startConnection(hubName: string, hubUrl: string): Promise<signalR.HubConnection> {
    if (this.connections.has(hubName)) {
      return this.connections.get(hubName)!;
    }

    const token = this.authService.getToken();

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => token || '',
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: retryContext => {
          if (retryContext.elapsedMilliseconds < 60000) {
            return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
          }
          return null;
        }
      })
      .configureLogging(signalR.LogLevel.Information)
      .build();

    connection.onreconnecting(() => {
      this.ngZone.run(() => this._isConnected.set(false));
    });

    connection.onreconnected(() => {
      this.ngZone.run(() => this._isConnected.set(true));
    });

    connection.onclose(() => {
      this.ngZone.run(() => {
        this._isConnected.set(false);
        this.connections.delete(hubName);
      });
    });

    try {
      await connection.start();
      this.connections.set(hubName, connection);
      this.ngZone.run(() => this._isConnected.set(true));
      console.log(`[SignalR] Connected to ${hubName}`);
    } catch (err) {
      console.error(`[SignalR] Error connecting to ${hubName}:`, err);
      setTimeout(() => this.startConnection(hubName, hubUrl), 5000);
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

  async stopAllConnections(): Promise<void> {
    for (const [name] of this.connections) {
      await this.stopConnection(name);
    }
  }

  getConnection(hubName: string): signalR.HubConnection | undefined {
    return this.connections.get(hubName);
  }

  on<T>(hubName: string, methodName: string, callback: (...args: any[]) => void): void {
    const connection = this.connections.get(hubName);
    if (connection) {
      connection.on(methodName, (...args: any[]) => {
        this.ngZone.run(() => callback(...args));
      });
    }
  }

  off(hubName: string, methodName: string): void {
    const connection = this.connections.get(hubName);
    if (connection) {
      connection.off(methodName);
    }
  }

  async invoke(hubName: string, methodName: string, ...args: unknown[]): Promise<unknown> {
    const connection = this.connections.get(hubName);
    if (connection && connection.state === signalR.HubConnectionState.Connected) {
      return connection.invoke(methodName, ...args);
    }
    throw new Error(`Hub ${hubName} is not connected`);
  }
}
