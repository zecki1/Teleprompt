import { Injectable, inject, signal } from '@angular/core';

import { API_BASE_URL } from '../config';
import { SignalRService } from './signalr.service';

export interface ParticipantJoined {
  tpSessionId: string;
  user: string;
  role: string;
}

export interface ScrollState {
  tpSessionId: string;
  position: number;
  speed: number;
  mode: string;
}

/**
 * Realtime do teleprompter: sincronização de espelhos entre dispositivos,
 * controle remoto da rolagem, modo/velocidade e ordem de gravação.
 * Complementa o BroadcastChannel local (mesma aba/browser) do TpPage com
 * sincronização via SignalR entre navegadores/dispositivos distintos.
 */
@Injectable({ providedIn: 'root' })
export class TpHubService {
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly signalR = inject(SignalRService);
  private readonly hubName = 'tpHub';

  private readonly hubUrl = `${this.baseUrl}/hubs/tp`;

  private readonly connected = signal(false);

  readonly isConnected = this.connected.asReadonly();

  async connect(): Promise<void> {
    await this.signalR.startConnection(this.hubName, this.hubUrl);
    this.connected.set(true);
  }

  async disconnect(): Promise<void> {
    await this.signalR.stopConnection(this.hubName);
    this.connected.set(false);
  }

  async joinTp(tpSessionId: string, role: string): Promise<void> {
    await this.signalR.invoke(this.hubName, 'JoinTp', tpSessionId, role);
  }

  async scrollStateChanged(
    tpSessionId: string,
    position: number,
    speed: number,
    mode: string,
  ): Promise<void> {
    await this.signalR.invoke(this.hubName, 'ScrollStateChanged', tpSessionId, position, speed, mode);
  }

  async modeChanged(tpSessionId: string, mode: string): Promise<void> {
    await this.signalR.invoke(this.hubName, 'ModeChanged', tpSessionId, mode);
  }

  async speedChanged(tpSessionId: string, speed: number): Promise<void> {
    await this.signalR.invoke(this.hubName, 'SpeedChanged', tpSessionId, speed);
  }

  async remoteCommand(tpSessionId: string, command: string): Promise<void> {
    await this.signalR.invoke(this.hubName, 'RemoteCommand', tpSessionId, command);
  }

  async recorded(tpSessionId: string, scriptId: string): Promise<void> {
    await this.signalR.invoke(this.hubName, 'Recorded', tpSessionId, scriptId);
  }

  async orderChanged(tpSessionId: string, recordingOrder: unknown): Promise<void> {
    await this.signalR.invoke(this.hubName, 'OrderChanged', tpSessionId, recordingOrder);
  }

  onParticipantJoined(cb: (tpSessionId: string, data: ParticipantJoined) => void): void {
    this.signalR.on(this.hubName, 'ParticipantJoined', (tpSessionId, data) =>
      cb(tpSessionId as string, data as ParticipantJoined),
    );
  }

  onScrollStateChanged(cb: (data: ScrollState) => void): void {
    this.signalR.on(
      this.hubName,
      'ScrollStateChanged',
      (tpSessionId: unknown, position: unknown, speed: unknown, mode: unknown) =>
        cb({
          tpSessionId: tpSessionId as string,
          position: position as number,
          speed: speed as number,
          mode: mode as string,
        }),
    );
  }

  onModeChanged(cb: (tpSessionId: string, mode: string) => void): void {
    this.signalR.on(this.hubName, 'ModeChanged', (tpSessionId, mode) =>
      cb(tpSessionId as string, mode as string),
    );
  }

  onSpeedChanged(cb: (tpSessionId: string, speed: number) => void): void {
    this.signalR.on(this.hubName, 'SpeedChanged', (tpSessionId, speed) =>
      cb(tpSessionId as string, speed as number),
    );
  }

  onRemoteCommand(cb: (tpSessionId: string, command: string) => void): void {
    this.signalR.on(this.hubName, 'RemoteCommand', (tpSessionId, command) =>
      cb(tpSessionId as string, command as string),
    );
  }

  onRecorded(cb: (tpSessionId: string, scriptId: string) => void): void {
    this.signalR.on(this.hubName, 'Recorded', (tpSessionId, scriptId) =>
      cb(tpSessionId as string, scriptId as string),
    );
  }

  onOrderChanged(cb: (tpSessionId: string, recordingOrder: unknown) => void): void {
    this.signalR.on(this.hubName, 'OrderChanged', (tpSessionId, recordingOrder) =>
      cb(tpSessionId as string, recordingOrder),
    );
  }
}
