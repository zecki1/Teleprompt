"use client";

import { api } from "./client";
import type { TeamDto } from "./types";

export interface CreateTeamRequest {
  name: string;
  acronym?: string;
  workspaceId: string;
}

export interface AddTeamMemberRequest {
  userId: string;
}

export function listTeams(workspaceId?: string): Promise<TeamDto[]> {
  const query = workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : "";
  return api.get<TeamDto[]>(`/api/v1/teams${query}`);
}

export function createTeam(input: CreateTeamRequest): Promise<TeamDto> {
  return api.post<TeamDto>("/api/v1/teams", input);
}

export function getTeam(id: string): Promise<TeamDto> {
  return api.get<TeamDto>(`/api/v1/teams/${id}`);
}

export function updateTeam(id: string, input: CreateTeamRequest): Promise<TeamDto> {
  return api.put<TeamDto>(`/api/v1/teams/${id}`, input);
}

export function deleteTeam(id: string): Promise<void> {
  return api.del<void>(`/api/v1/teams/${id}`);
}

export function addTeamMember(id: string, input: AddTeamMemberRequest): Promise<unknown> {
  return api.post<unknown>(`/api/v1/teams/${id}/members`, input);
}

export function listTeamMembers(id: string): Promise<string[]> {
  return api.get<string[]>(`/api/v1/teams/${id}/members`);
}
