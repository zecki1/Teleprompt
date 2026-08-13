"use client";

import { api } from "./client";
import type { UserDto } from "./types";

export interface UpdateProfileRequest {
  displayName?: string;
  avatarUrl?: string;
}

export interface UpdatePermissionsRequest {
  role: string;
  isSuperAdmin: boolean;
  canManagePermissions: boolean;
  canCollaborate: boolean;
  isEditor: boolean;
  isRevisor: boolean;
  canRevert: boolean;
  canViewAdmin: boolean;
  canViewReports: boolean;
  canViewActivityHistory: boolean;
  canViewDebugLogs: boolean;
  canAssign: boolean;
  requiresChecklist: boolean;
  status: string;
}

/** Lista usuários (requer canManagePermissions). */
export function listUsers(): Promise<UserDto[]> {
  return api.get<UserDto[]>("/api/v1/users");
}

export function getUser(id: string): Promise<UserDto> {
  return api.get<UserDto>(`/api/v1/users/${id}`);
}

export function updateProfile(input: UpdateProfileRequest): Promise<UserDto> {
  return api.put<UserDto>("/api/v1/users/me", input);
}

export function updatePermissions(
  id: string,
  input: UpdatePermissionsRequest,
): Promise<UserDto> {
  return api.put<UserDto>(`/api/v1/users/${id}/permissions`, input);
}

export function deleteUser(id: string): Promise<void> {
  return api.del<void>(`/api/v1/users/${id}`);
}
