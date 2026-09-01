import { Injectable, inject, signal } from '@angular/core';

import { API_BASE_URL } from '../config';
import { SignalRService } from './signalr.service';
import type { CommentDto, ChecklistItemDto, ScriptDto, VersionDto } from '../api/types';

export interface PresenceInfo {
  user: string;
  joined: boolean;
}

export interface ScriptContentChanged {
  scriptId: string;
  content: string;
  user: string;
}

export interface LockEvent {
  scriptId: string;
  lockedBy: string | null;
}

/**
 * Realtime de edição colaborativa (paridade com Angular 17/Next).
 * Conecta ao hub ScriptHub do backend e oferece presença, conteúdo,
 * comentários, versões, lock e checklist ao vivo.
 *
 * A conexão só é estabelecida por demanda (connect()), tipicamente ao
 * abrir um roteiro no editor.
 */
@Injectable({ providedIn: 'root' })
export class ScriptHubService {
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly signalR = inject(SignalRService);
  private readonly hubName = 'scriptHub';

  private readonly hubUrl = `${this.baseUrl}/hubs/script`;

  private readonly connected = signal(false);
  private readonly onlineUsers = signal<Map<string, Set<string>>>(new Map());

  readonly isConnected = this.connected.asReadonly();
  readonly onlineUsersReadonly = this.onlineUsers.asReadonly();

  async connect(): Promise<void> {
    await this.signalR.startConnection(this.hubName, this.hubUrl);
    this.connected.set(true);
    this.installListeners();
  }

  async disconnect(): Promise<void> {
    await this.signalR.stopConnection(this.hubName);
    this.connected.set(false);
    this.onlineUsers.set(new Map());
  }

  async joinScript(scriptId: string): Promise<void> {
    await this.signalR.invoke(this.hubName, 'JoinScript', scriptId);
  }

  async leaveScript(scriptId: string): Promise<void> {
    await this.signalR.invoke(this.hubName, 'LeaveScript', scriptId);
  }

  async contentChanged(
    scriptId: string,
    content: string,
    user: string,
  ): Promise<void> {
    await this.signalR.invoke(this.hubName, 'ContentChanged', scriptId, content, user);
  }

  async commentAdded(scriptId: string, comment: unknown): Promise<void> {
    await this.signalR.invoke(this.hubName, 'CommentAdded', scriptId, comment);
  }

  async commentResolved(scriptId: string, commentId: string): Promise<void> {
    await this.signalR.invoke(this.hubName, 'CommentResolved', scriptId, commentId);
  }

  async versionCreated(scriptId: string, version: unknown): Promise<void> {
    await this.signalR.invoke(this.hubName, 'VersionCreated', scriptId, version);
  }

  async lockChanged(scriptId: string, lockedBy: string | null): Promise<void> {
    await this.signalR.invoke(this.hubName, 'LockChanged', scriptId, lockedBy);
  }

  async checklistUpdated(scriptId: string, items: unknown): Promise<void> {
    await this.signalR.invoke(this.hubName, 'ChecklistUpdated', scriptId, items);
  }

  onPresenceChanged(cb: (scriptId: string, info: PresenceInfo) => void): void {
    this.signalR.on(this.hubName, 'PresenceChanged', (scriptId: unknown, info: unknown) => {
      const payload = info as PresenceInfo;
      this.updateOnlineUsers(scriptId as string, payload);
      cb(scriptId as string, payload);
    });
  }

  onContentChanged(cb: (data: ScriptContentChanged) => void): void {
    this.signalR.on(
      this.hubName,
      'ContentChanged',
      (scriptId: unknown, content: unknown, user: unknown) =>
        cb({
          scriptId: scriptId as string,
          content: content as string,
          user: user as string,
        }),
    );
  }

  onCommentAdded(cb: (scriptId: string, comment: CommentDto) => void): void {
    this.signalR.on(this.hubName, 'CommentAdded', (scriptId, comment) =>
      cb(scriptId as string, comment as CommentDto),
    );
  }

  onCommentResolved(cb: (scriptId: string, commentId: string) => void): void {
    this.signalR.on(this.hubName, 'CommentResolved', (scriptId, commentId) =>
      cb(scriptId as string, commentId as string),
    );
  }

  onVersionCreated(cb: (scriptId: string, version: VersionDto) => void): void {
    this.signalR.on(this.hubName, 'VersionCreated', (scriptId, version) =>
      cb(scriptId as string, version as VersionDto),
    );
  }

  onLockChanged(cb: (data: LockEvent) => void): void {
    this.signalR.on(this.hubName, 'LockChanged', (scriptId: unknown, lockedBy: unknown) =>
      cb({ scriptId: scriptId as string, lockedBy: (lockedBy as string) ?? null }),
    );
  }

  onChecklistUpdated(cb: (scriptId: string, items: ChecklistItemDto[]) => void): void {
    this.signalR.on(this.hubName, 'ChecklistUpdated', (scriptId, items) =>
      cb(scriptId as string, items as ChecklistItemDto[]),
    );
  }

  private installListeners(): void {
    // os handlers são registrados por quem consome; aqui só asseguramos
    // que os eventos de presença não dupliquem o rastreamento local.
  }

  private updateOnlineUsers(scriptId: string, info: PresenceInfo): void {
    const current = new Map(this.onlineUsers());
    const users = current.get(scriptId) ?? new Set<string>();
    if (info.joined) {
      users.add(info.user);
    } else {
      users.delete(info.user);
    }
    current.set(scriptId, users);
    this.onlineUsers.set(current);
  }
}
