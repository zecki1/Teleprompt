import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL, API_PREFIX } from '../config';
import type { ProjectDto, ScriptDto, ApiMessage, CreateScriptRequest } from './types';

@Injectable({ providedIn: 'root' })
export class ProjectsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  private url(path = ''): string {
    return `${this.baseUrl}${API_PREFIX}/projects${path}`;
  }

  list(workspaceId?: string): Promise<ProjectDto[]> {
    const params: Record<string, string> = {};
    if (workspaceId) params['workspaceId'] = workspaceId;
    return firstValueFrom(this.http.get<ProjectDto[]>(this.url(), { params }));
  }

  create(input: {
    name: string;
    code?: string;
    externalLink?: string;
    status?: string;
    bucket?: string;
  }): Promise<ProjectDto> {
    return firstValueFrom(this.http.post<ProjectDto>(this.url(), input));
  }

  update(id: string, input: Partial<ProjectDto>): Promise<ApiMessage | ProjectDto> {
    return firstValueFrom(this.http.put<ApiMessage>(this.url(`/${id}`), input));
  }

  remove(id: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(this.url(`/${id}`)));
  }

  scriptsOf(projectId: string): Promise<ScriptDto[]> {
    return firstValueFrom(
      this.http.get<ScriptDto[]>(this.url(`/${projectId}/scripts`)),
    );
  }
}

@Injectable({ providedIn: 'root' })
export class ScriptsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  private url(path = ''): string {
    return `${this.baseUrl}${API_PREFIX}/scripts${path}`;
  }

  list(
    params: { projectId?: string; workspaceId?: string } = {},
  ): Promise<ScriptDto[]> {
    const query: Record<string, string> = {};
    if (params.projectId) query['projectId'] = params.projectId;
    if (params.workspaceId) query['workspaceId'] = params.workspaceId;
    return firstValueFrom(this.http.get<ScriptDto[]>(this.url(), { params: query }));
  }

  get(id: string): Promise<ScriptDto> {
    return firstValueFrom(this.http.get<ScriptDto>(this.url(`/${id}`)));
  }

  create(input: CreateScriptRequest): Promise<ScriptDto> {
    return firstValueFrom(this.http.post<ScriptDto>(this.url(), input));
  }

  update(
    id: string,
    input: { title?: string; content?: string; status?: string },
  ): Promise<void> {
    return firstValueFrom(this.http.put<void>(this.url(`/${id}`), input));
  }

  remove(id: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(this.url(`/${id}`)));
  }

  parse(content: string): Promise<{ scenes: Record<string, unknown>[] }> {
    return firstValueFrom(
      this.http.post<{ scenes: Record<string, unknown>[] }>(this.url('/parse'), { content }),
    );
  }

  /* ---- Versões ---- */
  versions(id: string) {
    return firstValueFrom(
      this.http.get<import('./types').VersionDto[]>(this.url(`/${id}/versions`)),
    );
  }

  createVersion(id: string, content: string) {
    return firstValueFrom(
      this.http.post<import('./types').VersionDto>(this.url(`/${id}/versions`), { content }),
    );
  }

  revert(id: string, versionNumber: number) {
    return firstValueFrom(
      this.http.post<ScriptDto>(this.url(`/${id}/versions/${versionNumber}/revert`), {}),
    );
  }

  /* ---- Comentários ---- */
  comments(id: string) {
    return firstValueFrom(
      this.http.get<import('./types').CommentDto[]>(this.url(`/${id}/comments`)),
    );
  }

  addComment(id: string, body: string) {
    return firstValueFrom(
      this.http.post<import('./types').CommentDto>(this.url(`/${id}/comments`), { body }),
    );
  }

  resolveComment(id: string, commentId: string, isResolved: boolean) {
    return firstValueFrom(
      this.http.put(this.url(`/${id}/comments/${commentId}`), { isResolved }),
    );
  }

  /* ---- Checklist ---- */
  checklist(id: string) {
    return firstValueFrom(
      this.http.get<import('./types').ChecklistItemDto[]>(this.url(`/${id}/checklist`)),
    );
  }

  saveChecklist(id: string, items: import('./types').ChecklistItemDto[]) {
    return firstValueFrom(
      this.http.put(this.url(`/${id}/checklist`), { items }),
    );
  }
}
