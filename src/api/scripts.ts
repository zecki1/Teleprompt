"use client";

import { api } from "./client";
import type { ParsedScenes, ScriptDto } from "./types";

export interface CreateScriptRequest {
  projectId: string;
  title: string;
  content?: string;
}

export interface UpdateScriptRequest {
  title?: string;
  content?: string;
  status?: string;
}

export interface ParseRequest {
  content: string;
  paragraphsPerScene?: number;
}

export function listScripts(params?: {
  projectId?: string;
  workspaceId?: string;
}): Promise<ScriptDto[]> {
  const query = new URLSearchParams();
  if (params?.projectId) query.set("projectId", params.projectId);
  if (params?.workspaceId) query.set("workspaceId", params.workspaceId);
  const qs = query.toString();
  return api.get<ScriptDto[]>(`/api/v1/scripts${qs ? `?${qs}` : ""}`);
}

export function createScript(input: CreateScriptRequest): Promise<ScriptDto> {
  return api.post<ScriptDto>("/api/v1/scripts", input);
}

export function getScript(id: string): Promise<ScriptDto> {
  return api.get<ScriptDto>(`/api/v1/scripts/${id}`);
}

export function updateScript(id: string, input: UpdateScriptRequest): Promise<ScriptDto> {
  return api.put<ScriptDto>(`/api/v1/scripts/${id}`, input);
}

export function deleteScript(id: string): Promise<void> {
  return api.del<void>(`/api/v1/scripts/${id}`);
}

export function parseScript(content: string, paragraphsPerScene = 0): Promise<ParsedScenes> {
  return api.post<ParsedScenes>("/api/v1/scripts/parse", { content, paragraphsPerScene });
}

export function lockScript(id: string): Promise<unknown> {
  return api.post<unknown>(`/api/v1/scripts/${id}/lock`);
}

export function unlockScript(id: string): Promise<unknown> {
  return api.post<unknown>(`/api/v1/scripts/${id}/unlock`);
}
