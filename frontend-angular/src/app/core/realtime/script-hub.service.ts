import { Injectable, inject, signal } from '@angular/core';
import { SignalRService } from './signalr.service';
import { environment } from '@env/environment';

export interface PresenceInfo {
  user: string;
  joined: boolean;
}

export interface ScriptContentChanged {
  scriptId: string;
  content: string;
  user: string;
}

export interface CommentEvent {
  scriptId: string;
  comment: any;
}

export interface VersionEvent {
  scriptId: string;
  version: any;
}

export interface LockEvent {
  scriptId: string;
  lockedBy: string | null;
}

@Injectable({ providedIn: 'root' })
export class ScriptHubService {
  private signalR = inject(SignalRService);
  private readonly hubName = 'scriptHub';

  private readonly onlineUsers = signal<Map<string, Set<string>>>(new Map());
  private readonly connected = signal(false);

  readonly onlineUsersReadonly = this.onlineUsers.asReadonly();
  readonly isConnected = this.connected.asReadonly();

  async connect(): Promise<void> {
    await this.signalR.startConnection(this.hubName, environment.signalR.scriptHubUrl);
    this.connected.set(true);
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

  async contentChanged(scriptId: string, content: string, user: string): Promise<void> {
    await this.signalR.invoke(this.hubName, 'ContentChanged', scriptId, content, user);
  }

  async cursorMoved(scriptId: string, position: string, user: string): Promise<void> {
    await this.signalR.invoke(this.hubName, 'CursorMoved', scriptId, position, user);
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

  onPresenceChanged(callback: (scriptId: string, info: PresenceInfo) => void): void {
    this.signalR.on(this.hubName, 'PresenceChanged', (scriptId: string, info: PresenceInfo) => {
      this.updateOnlineUsers(scriptId, info);
      callback(scriptId, info);
    });
  }

  onContentChanged(callback: (data: ScriptContentChanged) => void): void {
    this.signalR.on(this.hubName, 'ContentChanged',
      (scriptId: string, content: string, user: string) => {
        callback({ scriptId, content, user });
      });
  }

  onCommentAdded(callback: (data: CommentEvent) => void): void {
    this.signalR.on(this.hubName, 'CommentAdded',
      (scriptId: string, comment: any) => {
        callback({ scriptId, comment });
      });
  }

  onCommentResolved(callback: (data: { scriptId: string; commentId: string }) => void): void {
    this.signalR.on(this.hubName, 'CommentResolved',
      (scriptId: string, commentId: string) => {
        callback({ scriptId, commentId });
      });
  }

  onVersionCreated(callback: (data: VersionEvent) => void): void {
    this.signalR.on(this.hubName, 'VersionCreated',
      (scriptId: string, version: any) => {
        callback({ scriptId, version });
      });
  }

  onLockChanged(callback: (data: LockEvent) => void): void {
    this.signalR.on(this.hubName, 'LockChanged',
      (scriptId: string, lockedBy: string | null) => {
        callback({ scriptId, lockedBy });
      });
  }

  onChecklistUpdated(callback: (scriptId: string, items: unknown) => void): void {
    this.signalR.on(this.hubName, 'ChecklistUpdated', callback);
  }

  private updateOnlineUsers(scriptId: string, info: PresenceInfo): void {
    const current = new Map(this.onlineUsers());
    const users = current.get(scriptId) || new Set<string>();
    if (info.joined) {
      users.add(info.user);
    } else {
      users.delete(info.user);
    }
    current.set(scriptId, users);
    this.onlineUsers.set(current);
  }
}
