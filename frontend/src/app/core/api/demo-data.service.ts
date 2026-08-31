import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { AuthStore } from '../auth/auth.store';
import { getStoredToken } from '../auth/token-store';
import { API_BASE_URL, API_PREFIX } from '../config';
import type {
  ActivityDto,
  ProjectDto,
  ScriptDto,
  UserDto,
  WorkspaceDto,
} from './types';

interface DemoBundle {
  workspace: WorkspaceDto;
  users: DemoUser[];
  presenters: { id: string; name: string; email: string | null; phone: string | null }[];
  projects: ProjectDto[];
  scripts: ScriptDto[];
  activities: ActivityDto[];
}

/** Usuário do bundle demo — campos são um subconjunto do UserDto. */
interface DemoUser {
  id: string;
  email: string;
  displayName: string;
  role: string;
  isSuperAdmin: boolean;
  isEditor: boolean;
  isRevisor: boolean;
  canRevert: boolean;
  canViewAdmin: boolean;
  canViewReports: boolean;
  canViewActivityHistory: boolean;
  requiresChecklist: boolean;
  workspaceId: string;
}

/**
 * Dataset de demonstração a partir do endpoint anônimo
 * GET /api/v1/demo/workspace. Os dados são 100% fictícios e isolados
 * do banco real (LGPD) — servem apenas para o preview "Ver como Admin/Técnico".
 */
@Injectable({ providedIn: 'root' })
export class DemoDataService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly auth = inject(AuthStore);

  private cached: Promise<DemoBundle> | null = null;

  /** Usa dados demo sempre que a visualização demo estiver ativa. */
  get isDemo(): boolean {
    return this.auth.isDemo();
  }

  private bundle(): Promise<DemoBundle> {
    this.cached ??= firstValueFrom(
      this.http.get<DemoBundle>(`${this.baseUrl}${API_PREFIX}/demo/workspace`),
    );
    return this.cached;
  }

  async workspaces(): Promise<WorkspaceDto[]> {
    const b = await this.bundle();
    return [b.workspace];
  }

  async projects(): Promise<ProjectDto[]> {
    return (await this.bundle()).projects;
  }

  async scripts(): Promise<ScriptDto[]> {
    return (await this.bundle()).scripts;
  }

  async scriptsOf(projectId: string): Promise<ScriptDto[]> {
    const s = await this.scripts();
    return s.filter((x) => x.projectId === projectId);
  }

  async script(id: string): Promise<ScriptDto | null> {
    const s = await this.scripts();
    return s.find((x) => x.id === id) ?? null;
  }

  async users(): Promise<UserDto[]> {
    const b = await this.bundle();
    return b.users.map((u) => ({
      id: u.id,
      email: u.email,
      displayName: u.displayName,
      role: u.role,
      isSuperAdmin: u.isSuperAdmin,
      canManagePermissions: u.isSuperAdmin,
      canCollaborate: u.isEditor,
      isEditor: u.isEditor,
      isRevisor: u.isRevisor,
      canRevert: u.canRevert,
      canViewAdmin: u.canViewAdmin,
      canViewReports: u.canViewReports,
      canViewActivityHistory: u.canViewActivityHistory,
      canViewDebugLogs: u.isSuperAdmin,
      canAssign: u.isSuperAdmin,
      requiresChecklist: u.requiresChecklist,
      status: 'active',
      workspaceId: u.workspaceId,
    }));
  }

  async activities(): Promise<ActivityDto[]> {
    return (await this.bundle()).activities;
  }
}
