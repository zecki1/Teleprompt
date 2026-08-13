"use client";

import {
  listUsers,
  getUser,
  updatePermissions,
  deleteUser as apiDeleteUser,
} from "@/api/users";
import type { UserDto } from "@/api/types";
import { toUser } from "@/lib/script-mappers";
import { ExtendedUser, ExtendedUserSchema, Role } from "@/services/schemas";

const restrictedEmails = [
  "milinhacmldias@gmail.com",
  "ederson.gui@gmail.com",
  "zecki1@hotmail.com",
].map((e) => e.toLowerCase());

export const mapUserDto = (dto: UserDto): ExtendedUser | null => {
  if (dto.email && restrictedEmails.includes(String(dto.email).toLowerCase())) {
    return null;
  }

  try {
    return ExtendedUserSchema.parse({
      uid: dto.id,
      email: dto.email || "",
      displayName: dto.displayName || "Usuário",
      name: dto.displayName || "",
      role: (dto.role as Role) || "Docente",
      status: (dto.status || "Active").toLowerCase(),
      workspaceId: dto.workspaceId || "",
      workspaces: dto.workspaceId ? [dto.workspaceId] : [],
      canCollaborate: dto.canCollaborate,
      isEditor: dto.isEditor,
      isRevisor: dto.isRevisor,
      canRevert: dto.canRevert,
      canViewAdmin: dto.canViewAdmin,
      canViewReports: dto.canViewReports,
      canViewActivityHistory: dto.canViewActivityHistory,
      canViewDebugLogs: dto.canViewDebugLogs,
      canAssign: dto.canAssign,
      requiresChecklist: dto.requiresChecklist ?? true,
      createdAt: null,
      updatedAt: null,
    });
  } catch {
    return {
      uid: dto.id,
      email: dto.email || "",
      displayName: dto.displayName || "Usuário",
      name: dto.displayName || "",
      role: (dto.role as Role) || "Docente",
      status: (dto.status || "Active").toLowerCase(),
      workspaceId: dto.workspaceId || "",
      workspaces: dto.workspaceId ? [dto.workspaceId] : [],
      canCollaborate: dto.canCollaborate,
      isEditor: dto.isEditor,
      isRevisor: dto.isRevisor,
      canRevert: dto.canRevert,
      canViewAdmin: dto.canViewAdmin,
      canViewReports: dto.canViewReports,
      canViewActivityHistory: dto.canViewActivityHistory,
      canViewDebugLogs: dto.canViewDebugLogs,
      canAssign: dto.canAssign,
      requiresChecklist: dto.requiresChecklist ?? true,
      createdAt: null,
      updatedAt: null,
    } as ExtendedUser;
  }
};

export const getUsers = async (workspaceId?: string, isSuperAdmin?: boolean): Promise<ExtendedUser[]> => {
  try {
    const dtos = await listUsers();
    const users = dtos
      .map((dto) => mapUserDto(dto))
      .filter((u): u is ExtendedUser => u !== null);
    if (!isSuperAdmin && workspaceId) {
      return users
        .filter((u) => !u.workspaceId || u.workspaceId === workspaceId)
        .sort((a, b) => (a.displayName || "").localeCompare(b.displayName || ""));
    }
    return users.sort((a, b) => (a.displayName || "").localeCompare(b.displayName || ""));
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    return [];
  }
};

export const getUserById = async (uid: string): Promise<ExtendedUser | null> => {
  try {
    const dto = await getUser(uid);
    return mapUserDto(dto);
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    return null;
  }
};

export const updateUserRole = async (uid: string, role: string): Promise<void> => {
  const user = await getUser(uid);
  const current = toUser(user);
  await updatePermissions(uid, {
    role,
    isSuperAdmin: current.isSuperAdmin,
    canManagePermissions: false,
    canCollaborate: current.canCollaborate,
    isEditor: current.isEditor,
    isRevisor: current.isRevisor,
    canRevert: current.canRevert,
    canViewAdmin: current.canViewAdmin,
    canViewReports: current.canViewReports,
    canViewActivityHistory: current.canViewActivityHistory,
    canViewDebugLogs: current.canViewDebugLogs,
    canAssign: current.canAssign,
    requiresChecklist: current.requiresChecklist,
    status: current.status,
  });
};

export const updateUserWorkspace = async (uid: string, workspaceId: string): Promise<void> => {
  const user = await getUser(uid);
  const current = toUser(user);
  await updatePermissions(uid, {
    role: current.role,
    isSuperAdmin: current.isSuperAdmin,
    canManagePermissions: false,
    canCollaborate: current.canCollaborate,
    isEditor: current.isEditor,
    isRevisor: current.isRevisor,
    canRevert: current.canRevert,
    canViewAdmin: current.canViewAdmin,
    canViewReports: current.canViewReports,
    canViewActivityHistory: current.canViewActivityHistory,
    canViewDebugLogs: current.canViewDebugLogs,
    canAssign: current.canAssign,
    requiresChecklist: current.requiresChecklist,
    status: current.status,
  });
};

export const updateUserPermissions = async (
  uid: string,
  permissions: {
    canCollaborate?: boolean;
    isEditor?: boolean;
    isRevisor?: boolean;
    canRevert?: boolean;
    canAssign?: boolean;
    canViewAdmin?: boolean;
    canViewReports?: boolean;
    canViewActivityHistory?: boolean;
    canViewDebugLogs?: boolean;
    requiresChecklist?: boolean;
  },
): Promise<void> => {
  const user = await getUser(uid);
  const current = toUser(user);
  await updatePermissions(uid, {
    role: current.role,
    isSuperAdmin: current.isSuperAdmin,
    canManagePermissions: false,
    canCollaborate: permissions.canCollaborate ?? current.canCollaborate,
    isEditor: permissions.isEditor ?? current.isEditor,
    isRevisor: permissions.isRevisor ?? current.isRevisor,
    canRevert: permissions.canRevert ?? current.canRevert,
    canViewAdmin: permissions.canViewAdmin ?? current.canViewAdmin,
    canViewReports: permissions.canViewReports ?? current.canViewReports,
    canViewActivityHistory: permissions.canViewActivityHistory ?? current.canViewActivityHistory,
    canViewDebugLogs: permissions.canViewDebugLogs ?? current.canViewDebugLogs,
    canAssign: permissions.canAssign ?? current.canAssign,
    requiresChecklist: permissions.requiresChecklist ?? current.requiresChecklist,
    status: current.status,
  });
};

export const deleteUser = async (uid: string): Promise<void> => {
  await apiDeleteUser(uid);
};
