import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, shareReplay, filter } from 'rxjs';
import { environment } from '@env/environment';
import { Project, ProjectStatus, Bucket } from '@core/models/project.model';
import { Script, ScriptStatus } from '@core/models/script.model';
import { User, Role, UserStatus } from '@core/models/user.model';
import { Presenter, Activity, ActivityType } from '@core/models/common.model';
import { Workspace, WorkspacePlan } from '@core/models/workspace.model';

interface DemoBundle {
  workspace: { id: string; name: string; ownerId: string; plan: string; createdAt: string };
  users: any[];
  presenters: { id: string; name: string; email?: string | null; phone?: string | null }[];
  projects: any[];
  scripts: any[];
  activities: any[];
}

const PROJECT_STATUS: Record<string, ProjectStatus> = {
  Awaiting: ProjectStatus.Awaiting,
  InProgress: ProjectStatus.InProgress,
  Completed: ProjectStatus.Completed,
  Paused: ProjectStatus.Paused,
  Delayed: ProjectStatus.Delayed,
  Backlog: ProjectStatus.Backlog,
};
const BUCKET: Record<string, Bucket> = {
  Backlog: Bucket.Backlog,
  EmAndamento: Bucket.EmAndamento,
  Pausado: Bucket.Pausado,
  EmRevisao: Bucket.EmRevisao,
  EmAjuste: Bucket.EmAjuste,
  Concluido: Bucket.Concluido,
};
const SCRIPT_STATUS: Record<string, ScriptStatus> = {
  Rascunho: ScriptStatus.Rascunho,
  EmRevisao: ScriptStatus.EmRevisao,
  Aprovado: ScriptStatus.Aprovado,
  Gravado: ScriptStatus.Gravado,
  Concluido: ScriptStatus.Concluido,
};
const ROLES: Record<string, Role> = {
  SuperAdmin: Role.SuperAdmin,
  Técnico: Role.Tecnico,
  Tecnico: Role.Tecnico,
  editor: Role.Editor,
  validador: Role.Validador,
};

/**
 * Carrega o dataset de demonstração a partir do endpoint anônimo
 * GET /api/v1/demo/workspace. Os dados são 100% fictícios e isolados
 * do banco real — servem apenas para o preview "Ver como Admin/Técnico".
 */
@Injectable({ providedIn: 'root' })
export class DemoDataService {
  private http = inject(HttpClient);
  private cache$: Observable<DemoBundle> | null = null;

  private bundle(): Observable<DemoBundle> {
    if (!this.cache$) {
      this.cache$ = this.http
        .get<DemoBundle>(`${environment.apiUrl}/demo/workspace`)
        .pipe(shareReplay(1));
    }
    return this.cache$;
  }

  workspace(): Observable<Workspace> {
    return this.bundle().pipe(map(d => ({
      id: d.workspace.id,
      name: d.workspace.name,
      ownerId: d.workspace.ownerId,
      plan: (WorkspacePlan[d.workspace.plan as keyof typeof WorkspacePlan] ?? WorkspacePlan.Free) as WorkspacePlan,
      createdAt: new Date(d.workspace.createdAt),
    })));
  }

  projects(): Observable<Project[]> {
    return this.bundle().pipe(map(d =>
      d.projects.map((p: any) => ({
        id: p.id,
        name: p.name,
        code: p.code,
        externalLink: p.externalLink,
        workspaceId: p.workspaceId,
        status: PROJECT_STATUS[p.status] ?? ProjectStatus.Awaiting,
        bucket: BUCKET[p.bucket] ?? Bucket.Backlog,
        createdAt: new Date(p.createdAt),
      })),
    ));
  }

  scripts(): Observable<Script[]> {
    return this.bundle().pipe(map(d =>
      d.scripts.map((s: any) => ({
        id: s.id,
        projectId: s.projectId,
        workspaceId: s.workspaceId,
        title: s.title,
        content: s.content ?? '',
        status: SCRIPT_STATUS[s.status] ?? ScriptStatus.Rascunho,
        isLocked: s.isLocked ?? false,
        lockedBy: s.lockedBy,
        version: s.version ?? 1,
        createdBy: s.createdBy,
        folder: s.folder ?? null,
        subfolder: s.subfolder ?? null,
        lesson: s.lesson ?? null,
        isPlaceholder: s.isPlaceholder ?? false,
        createdAt: new Date(s.createdAt),
        updatedAt: new Date(s.updatedAt),
      })) as Script[],
    ));
  }

  users(): Observable<User[]> {
    return this.bundle().pipe(map(d =>
      d.users.map((u: any) => ({
        id: u.id,
        email: u.email ?? '',
        displayName: u.displayName,
        role: ROLES[u.role] ?? Role.Tecnico,
        isSuperAdmin: u.isSuperAdmin ?? false,
        canManagePermissions: u.isSuperAdmin ?? false,
        canCollaborate: u.isEditor ?? false,
        isEditor: u.isEditor ?? false,
        isRevisor: u.isRevisor ?? false,
        canRevert: u.canRevert ?? false,
        canViewAdmin: u.canViewAdmin ?? false,
        canViewReports: u.canViewReports ?? false,
        canViewActivityHistory: u.canViewActivityHistory ?? false,
        canViewDebugLogs: u.isSuperAdmin ?? false,
        canAssign: u.canAssign ?? false,
        requiresChecklist: u.requiresChecklist ?? false,
        status: UserStatus.Active,
        workspaceId: u.workspaceId,
      })) as User[],
    ));
  }

  presenters(): Observable<Presenter[]> {
    return this.bundle().pipe(map(d =>
      d.presenters.map(p => ({
        id: p.id,
        name: p.name,
        email: p.email ?? undefined,
        phone: p.phone ?? undefined,
      })),
    ));
  }

  activities(): Observable<Activity[]> {
    return this.bundle().pipe(map(d =>
      d.activities.map((a: any) => ({
        id: a.id,
        type: ActivityType[a.type as keyof typeof ActivityType] ?? ActivityType.Other,
        description: a.description,
        userId: a.userId,
        createdAt: new Date(a.createdAt),
      })) as Activity[],
    ));
  }

  script(id: string): Observable<Script> {
    return this.scripts().pipe(
      map(list => list.find(s => s.id === id)),
      filter((s): s is Script => !!s),
    );
  }
}
