"use client";

import { api } from "./client";
import type { UserDto, WorkspaceDto } from "./types";

export interface CreateWorkspaceRequest {
  name: string;
  plan?: string;
}

export interface JoinWorkspaceRequest {
  token: string;
}

export interface AddMemberRequest {
  email: string;
}

export function listMyWorkspaces(): Promise<WorkspaceDto[]> {
  return api.get<WorkspaceDto[]>("/api/v1/workspaces/mine");
}

export function createWorkspace(input: CreateWorkspaceRequest): Promise<WorkspaceDto> {
  return api.post<WorkspaceDto>("/api/v1/workspaces", input);
}

export function getWorkspace(id: string): Promise<WorkspaceDto> {
  return api.get<WorkspaceDto>(`/api/v1/workspaces/${id}`);
}

export function updateWorkspace(
  id: string,
  input: CreateWorkspaceRequest,
): Promise<WorkspaceDto> {
  return api.put<WorkspaceDto>(`/api/v1/workspaces/${id}`, input);
}

export function addMember(id: string, input: AddMemberRequest): Promise<unknown> {
  return api.post<unknown>(`/api/v1/workspaces/${id}/members`, input);
}

export function listMembers(id: string): Promise<UserDto[]> {
  return api.get<UserDto[]>(`/api/v1/workspaces/${id}/members`);
}

export async function joinWorkspaceByToken(
  token: string,
): Promise<{ success: boolean; workspaceName?: string }> {
  try {
    const res = await api.post<WorkspaceDto>("/api/v1/workspaces/join", { token });
    return { success: true, workspaceName: res.name };
  } catch {
    return { success: false };
  }
}
