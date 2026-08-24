import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import {
  User, UpdateProfileRequest, UpdatePermissionsRequest
} from '../models/user.model';
import {
  Workspace, CreateWorkspaceRequest, JoinWorkspaceRequest, AddMemberRequest
} from '../models/workspace.model';
import {
  Project, CreateProjectRequest
} from '../models/project.model';
import {
  Script, CreateScriptRequest, UpdateScriptRequest, ParseRequest,
  ScriptVersion, Comment, ChecklistItem, CreateVersionRequest
} from '../models/script.model';
import {
  TpSession, CreateTpSessionRequest, UpdateTpSessionRequest
} from '../models/teleprompter.model';
import { Team, CreateTeamRequest, AddTeamMemberRequest } from '../models/team.model';
import { Presenter, CreatePresenterRequest, Activity, Report, DebugLog, ErrorReport, ApiMessage } from '../models/common.model';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  private get<T>(path: string, params?: Record<string, string>): Observable<T> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value);
        }
      });
    }
    return this.http.get<T>(`${environment.apiUrl}${path}`, { params: httpParams });
  }

  private post<T>(path: string, body?: unknown): Observable<T> {
    return this.http.post<T>(`${environment.apiUrl}${path}`, body);
  }

  private put<T>(path: string, body?: unknown): Observable<T> {
    return this.http.put<T>(`${environment.apiUrl}${path}`, body);
  }

  private delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(`${environment.apiUrl}${path}`);
  }

  // Auth
  getMe = () => this.get<User>('/auth/me');

  // Users
  getUsers = () => this.get<User[]>('/users');
  getUser = (id: string) => this.get<User>(`/users/${id}`);
  updateProfile = (request: UpdateProfileRequest) => this.put<User>('/users/me', request);
  updatePermissions = (id: string, request: UpdatePermissionsRequest) =>
    this.put<User>(`/users/${id}/permissions`, request);
  deleteUser = (id: string) => this.delete<void>(`/users/${id}`);

  // Workspaces
  getMyWorkspaces = () => this.get<Workspace[]>('/workspaces/mine');
  createWorkspace = (request: CreateWorkspaceRequest) => this.post<Workspace>('/workspaces', request);
  getWorkspace = (id: string) => this.get<Workspace>(`/workspaces/${id}`);
  updateWorkspace = (id: string, request: CreateWorkspaceRequest) => this.put<Workspace>(`/workspaces/${id}`, request);
  joinWorkspace = (request: JoinWorkspaceRequest) => this.post<Workspace>('/workspaces/join', request);
  addWorkspaceMember = (id: string, request: AddMemberRequest) => this.post<ApiMessage>(`/workspaces/${id}/members`, request);
  getWorkspaceMembers = (id: string) => this.get<User[]>(`/workspaces/${id}/members`);

  // Teams
  getTeams = (workspaceId?: string) => {
    const params: Record<string, string> = {};
    if (workspaceId) params['workspaceId'] = workspaceId;
    return this.get<Team[]>('/teams', params);
  };
  createTeam = (request: CreateTeamRequest) => this.post<Team>('/teams', request);
  getTeam = (id: string) => this.get<Team>(`/teams/${id}`);
  updateTeam = (id: string, request: CreateTeamRequest) => this.put<Team>(`/teams/${id}`, request);
  deleteTeam = (id: string) => this.delete<void>(`/teams/${id}`);
  addTeamMember = (id: string, request: AddTeamMemberRequest) => this.post<ApiMessage>(`/teams/${id}/members`, request);
  getTeamMembers = (id: string) => this.get<string[]>(`/teams/${id}/members`);

  // Projects
  getProjects = (workspaceId?: string) => {
    const params: Record<string, string> = {};
    if (workspaceId) params['workspaceId'] = workspaceId;
    return this.get<Project[]>('/projects', params);
  };
  createProject = (request: CreateProjectRequest) => this.post<Project>('/projects', request);
  getProject = (id: string) => this.get<Project>(`/projects/${id}`);
  updateProject = (id: string, request: CreateProjectRequest) => this.put<Project>(`/projects/${id}`, request);
  deleteProject = (id: string) => this.delete<void>(`/projects/${id}`);
  getProjectScripts = (id: string) => this.get<Script[]>(`/projects/${id}/scripts`);

  // Scripts
  getScripts = (projectId?: string, workspaceId?: string) => {
    const params: Record<string, string> = {};
    if (projectId) params['projectId'] = projectId;
    if (workspaceId) params['workspaceId'] = workspaceId;
    return this.get<Script[]>('/scripts', params);
  };
  createScript = (request: CreateScriptRequest) => this.post<Script>('/scripts', request);
  getScript = (id: string) => this.get<Script>(`/scripts/${id}`);
  updateScript = (id: string, request: UpdateScriptRequest) => this.put<Script>(`/scripts/${id}`, request);
  deleteScript = (id: string) => this.delete<void>(`/scripts/${id}`);
  parseScript = (request: ParseRequest) => this.post<unknown>('/scripts/parse', request);
  getScriptVersions = (id: string) => this.get<ScriptVersion[]>(`/scripts/${id}/versions`);
  createScriptVersion = (id: string, request: CreateVersionRequest) =>
    this.post<ScriptVersion>(`/scripts/${id}/versions`, request);
  revertScriptVersion = (id: string, versionNumber: number) =>
    this.post<Script>(`/scripts/${id}/versions/${versionNumber}/revert`);
  getScriptComments = (id: string) => this.get<Comment[]>(`/scripts/${id}/comments`);
  addScriptComment = (id: string, body: string) =>
    this.post<Comment>(`/scripts/${id}/comments`, { body });
  resolveScriptComment = (id: string, commentId: string) =>
    this.put<Comment>(`/scripts/${id}/comments/${commentId}`);
  getScriptChecklist = (id: string) => this.get<ChecklistItem[]>(`/scripts/${id}/checklist`);
  updateScriptChecklist = (id: string, items: ChecklistItem[]) =>
    this.put<void>(`/scripts/${id}/checklist`, { items });
  lockScript = (id: string) => this.post<ApiMessage>(`/scripts/${id}/lock`);
  unlockScript = (id: string) => this.post<ApiMessage>(`/scripts/${id}/unlock`);

  // Teleprompter Sessions
  createTpSession = (request: CreateTpSessionRequest) => this.post<TpSession>('/tp/sessions', request);
  getTpSession = (id: string) => this.get<TpSession>(`/tp/sessions/${id}`);
  updateTpSession = (id: string, request: UpdateTpSessionRequest) =>
    this.put<TpSession>(`/tp/sessions/${id}`, request);
  markRecorded = (id: string, scriptId: string) =>
    this.post<ApiMessage>(`/tp/sessions/${id}/recorded`, { scriptId });

  // Presenters
  getPresenters = () => this.get<Presenter[]>('/presenters');
  createPresenter = (request: CreatePresenterRequest) => this.post<Presenter>('/presenters', request);
  updatePresenter = (id: string, request: CreatePresenterRequest) => this.put<Presenter>(`/presenters/${id}`, request);
  deletePresenter = (id: string) => this.delete<void>(`/presenters/${id}`);

  // Activities
  getActivities = (page = 1, pageSize = 50) =>
    this.get<Activity[]>('/activities', { page: page.toString(), pageSize: pageSize.toString() });

  // Reports
  getReports = (workspaceId?: string) => {
    const params: Record<string, string> = {};
    if (workspaceId) params['workspaceId'] = workspaceId;
    return this.get<Report>('/reports', params);
  };

  // Admin
  getDebugLogs = (limit = 100) =>
    this.get<DebugLog[]>('/admin/debug-logs', { limit: limit.toString() });
  writeDebugLog = (level: number, source: string, message: string, metadataJson?: string) =>
    this.post<void>('/admin/debug-logs', { level, source, message, metadataJson });
  getErrorReports = () => this.get<ErrorReport[]>('/admin/error-reports');
  createErrorReport = (screenshotUrl?: string, description?: string, logsJson?: string) =>
    this.post<ErrorReport>('/admin/error-reports', { screenshotUrl, description, logsJson });
  deleteErrorReport = (id: string) => this.delete<void>(`/admin/error-reports/${id}`);

  // Upload
  upload = (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ url: string; name: string; size: number }>(
      `${environment.apiUrl}/upload`, formData
    );
  };

  // Export
  exportJson = (id: string) =>
    this.http.get(`${environment.apiUrl}/export/scripts/${id}/json`, { responseType: 'blob' });
  exportPpt = (id: string) =>
    this.http.get(`${environment.apiUrl}/export/scripts/${id}/ppt`, { responseType: 'blob' });
  exportWord = (id: string) =>
    this.http.get(`${environment.apiUrl}/export/scripts/${id}/word`, { responseType: 'blob' });
}
