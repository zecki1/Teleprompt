"use client";

import { api } from "./client";
import type { ProjectDto, ScriptDto } from "./types";

export interface CreateProjectRequest {
  name: string;
  code?: string;
  externalLink?: string;
  status?: string;
  bucket?: string;
}

export function listProjects(workspaceId?: string): Promise<ProjectDto[]> {
  const query = workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : "";
  return api.get<ProjectDto[]>(`/api/v1/projects${query}`);
}

export function createProject(input: CreateProjectRequest): Promise<ProjectDto> {
  return api.post<ProjectDto>("/api/v1/projects", input);
}

export function getProject(id: string): Promise<ProjectDto> {
  return api.get<ProjectDto>(`/api/v1/projects/${id}`);
}

export function updateProject(id: string, input: CreateProjectRequest): Promise<ProjectDto> {
  return api.put<ProjectDto>(`/api/v1/projects/${id}`, input);
}

export function deleteProject(id: string): Promise<void> {
  return api.del<void>(`/api/v1/projects/${id}`);
}

export function listProjectScripts(id: string): Promise<ScriptDto[]> {
  return api.get<ScriptDto[]>(`/api/v1/projects/${id}/scripts`);
}
