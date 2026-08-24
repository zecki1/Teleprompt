export interface User {
  id: string;
  email: string;
  displayName?: string;
  role: Role;
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
  status: UserStatus;
  workspaceId?: string;
  avatarUrl?: string;
}

export enum Role {
  SuperAdmin = 0,
  Diretor = 1,
  Coordenador = 2,
  Orientador = 3,
  Docente = 4,
  Especialista = 5,
  Assistente = 6,
  Analista = 7,
  Tutor = 8,
  Monitor = 9,
  Tecnico = 10,
  Estagiario = 11,
  Editor = 12,
  Validador = 13,
  Publico = 14
}

export enum UserStatus {
  Active = 0,
  Inactive = 1,
  Pending = 2
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName?: string;
}

export interface UpdateProfileRequest {
  displayName?: string;
  avatarUrl?: string;
}

export interface UpdatePermissionsRequest {
  role: Role;
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
  status: UserStatus;
}
