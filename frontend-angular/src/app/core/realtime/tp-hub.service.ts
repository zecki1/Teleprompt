import { Injectable, inject, signal } from '@angular/core';
import { SignalRService } from './signalr.service';
import { environment } from '@env/environment';
import { TpParticipant } from '../models/teleprompter.model';

export interface ScrollStateChangedEvent {
  tpSessionId: string;
  position: number;
  speed: number;
  mode: string;
}

@Injectable({ providedIn: 'root' })
export class TpHubService {
  private signalR = inject(SignalRService);
  private readonly hubName = 'tpHub';

  private readonly participants = signal<TpParticipant[]>([]);
  private readonly connected = signal(false);
  private readonly scrollState = signal<ScrollStateChangedEvent | null>(null);

  readonly participantsReadonly = this.participants.asReadonly();
  readonly isConnected = this.connected.asReadonly();
  readonly scrollStateReadonly = this.scrollState.asReadonly();

  async connect(): Promise<void> {
    await this.signalR.startConnection(this.hubName, environment.signalR.tpHubUrl);
    this.connected.set(true);
  }

  async disconnect(): Promise<void> {
    await this.signalR.stopConnection(this.hubName);
    this.connected.set(false);
    this.participants.set([]);
    this.scrollState.set(null);
  }

  async joinTp(tpSessionId: string, role: 'operator' | 'mirror'): Promise<void> {
    await this.signalR.invoke(this.hubName, 'JoinTp', tpSessionId, role);
  }

  async joinSession(scriptId: string): Promise<void> {
    await this.signalR.invoke(this.hubName, 'JoinTp', scriptId, 'operator');
  }

  async leaveSession(scriptId: string): Promise<void> {
    await this.signalR.invoke(this.hubName, 'LeaveTp', scriptId);
  }

  async scrollStateChanged(tpSessionId: string, position: number, speed: number, mode: string): Promise<void> {
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

  onParticipantJoined(callback: (tpSessionId: string, participant: TpParticipant) => void): void {
    this.signalR.on(this.hubName, 'ParticipantJoined',
      (tpSessionId: string, participant: TpParticipant) => {
        this.participants.update(p => [...p, participant]);
        callback(tpSessionId, participant);
      });
  }

  onScrollStateChanged(callback: (event: ScrollStateChangedEvent) => void): void {
    this.signalR.on(this.hubName, 'ScrollStateChanged',
      (tpSessionId: string, position: number, speed: number, mode: string) => {
        const event = { tpSessionId, position, speed, mode };
        this.scrollState.set(event);
        callback(event);
      });
  }

  onModeChanged(callback: (tpSessionId: string, mode: string) => void): void {
    this.signalR.on(this.hubName, 'ModeChanged', callback);
  }

  onSpeedChanged(callback: (tpSessionId: string, speed: number) => void): void {
    this.signalR.on(this.hubName, 'SpeedChanged', callback);
  }

  onRemoteCommand(callback: (tpSessionId: string, command: string) => void): void {
    this.signalR.on(this.hubName, 'RemoteCommand', callback);
  }

  onRecorded(callback: (tpSessionId: string, scriptId: string) => void): void {
    this.signalR.on(this.hubName, 'Recorded', callback);
  }

  onOrderChanged(callback: (tpSessionId: string, recordingOrder: unknown) => void): void {
    this.signalR.on(this.hubName, 'OrderChanged', callback);
  }
}
