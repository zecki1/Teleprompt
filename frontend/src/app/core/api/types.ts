/**
 * Tipos das DTOs do backend .NET (Teleprompt.Application/Dtos/Contracts.cs).
 * Espelham exatamente o contrato JSON (camelCase) da API.
 */

export interface ApiMessage {
  message: string;
}

export interface UserDto {
  id: string;
  email: string;
  displayName: string;
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
  workspaceId: string;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: UserDto;
}

export interface RefreshResponse {
  token?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName?: string;
}

export interface CreateScriptRequest {
  projectId: string;
  title: string;
  content?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface WorkspaceDto {
  id: string;
  name: string;
  ownerId: string;
  plan: string;
  createdAt: string;
}

export interface TeamDto {
  id: string;
  name: string;
  acronym: string | null;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface PresenterDto {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

export interface ProjectDto {
  id: string;
  name: string;
  code: string | null;
  externalLink: string | null;
  workspaceId: string;
  status: string | null;
  bucket: string | null;
  createdAt: string;
}

export interface ScriptDto {
  id: string;
  projectId: string;
  workspaceId: string;
  title: string;
  content: string;
  status: string;
  isLocked: boolean;
  lockedBy: string | null;
  version: number;
  folder: string | null;
  subfolder: string | null;
  lesson: string | null;
  isPlaceholder: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VersionDto {
  id: string;
  versionNumber: number;
  content: string;
  createdBy: string | null;
  createdAt: string;
}

export interface CommentDto {
  id: string;
  authorId: string;
  body: string;
  isResolved: boolean;
  createdAt: string;
}

export interface ChecklistItemDto {
  id: string | null;
  label: string;
  required: boolean;
  isChecked: boolean;
  checkedBy: string | null;
}

export interface ActivityDto {
  id: string;
  type: string;
  description: string;
  userId: string | null;
  createdAt: string;
}

export interface TpSessionDto {
  id: string;
  scriptId: string;
  ownerId: string;
  mode: string;
  speed: number;
  scrollStateJson: string;
}

export interface ErrorReportDto {
  id: string;
  userId: string | null;
  screenshotUrl: string | null;
  description: string | null;
  status: string;
  createdAt: string;
}

export interface DebugLogDto {
  id: string;
  level: string;
  source: string;
  message: string;
  createdAt: string;
}

export interface ReportsSummary {
  totalScripts: number;
  totalProjects: number;
  byStatus: { status: string; count: number }[];
  byBucket: { bucket: string; count: number }[];
  growth: { year: number; month: number; count: number }[];
  generatedAt: string;
}
