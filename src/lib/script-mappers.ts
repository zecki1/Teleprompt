/**
 * Adaptadores entre as DTOs do backend .NET (src/api/types.ts) e os shapes
 * locais usados pela UI (ScriptDoc, Project, ExtendedUser, etc.).
 *
 * O backend possui um modelo simplificado; os campos que a UI usava no
 * Firestore e que não existem no backend recebem valores padrão aqui.
 */

import type {
  ActivityDto,
  CommentDto,
  DebugLogDto,
  ErrorReportDto,
  PresenterDto,
  ProjectDto,
  ScriptDto,
  UserDto,
  VersionDto,
  WorkspaceDto,
} from "@/api/types";
import type { ScriptDoc, ScriptStatus } from "@/types/script";

/** Mapeia o status do backend para o status local da UI. */
export const BACKEND_TO_LOCAL_STATUS: Record<string, ScriptStatus> = {
  Rascunho: "rascunho",
  EmRevisao: "em_revisao",
  Aprovado: "revisao_realizada",
  Gravado: "gravado",
  Concluido: "gravado",
};

/** Mapeia o status local da UI para o enum do backend. */
export const LOCAL_TO_BACKEND_STATUS: Record<ScriptStatus, string> = {
  rascunho: "Rascunho",
  em_revisao: "EmRevisao",
  revisao_realizada: "Aprovado",
  aguardando_gravacao: "Aprovado",
  gravado: "Gravado",
  rejeitado: "Rascunho",
  nao_gravado: "Rascunho",
};

export function toScriptDoc(dto: ScriptDto): ScriptDoc {
  const folder =
    dto.folder && dto.folder !== "Raiz" && dto.folder !== "Sem Pasta" ? dto.folder : null;
  const subfolder = folder ? dto.subfolder ?? undefined : undefined;
  const lesson = folder ? dto.lesson ?? undefined : undefined;
  const path = [folder, subfolder, lesson].filter((seg): seg is string => Boolean(seg));

  return {
    id: dto.id,
    title: dto.title,
    projectId: dto.projectId,
    projectName: dto.projectName ?? undefined,
    project: dto.projectName ?? undefined,
    workspaceId: dto.workspaceId,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    status: BACKEND_TO_LOCAL_STATUS[dto.status] ?? "rascunho",
    category: "video",
    commentCount: 0,
    commentAuthors: [],
    isMirrored: false,
    isPlaceholder: dto.isPlaceholder,
    path,
    folder: folder ?? undefined,
    subfolder,
    lesson,
    editorId: dto.editorId ?? undefined,
    editorName: dto.editorName ?? undefined,
    reviewerId: dto.reviewerId ?? undefined,
    reviewerName: dto.reviewerName ?? undefined,
    videomakerId: dto.videomakerId ?? undefined,
    videomakerName: dto.videomakerName ?? undefined,
    presenterIds: dto.presenterIds ?? undefined,
  };
}

export interface LocalProject {
  id: string;
  name: string;
  code?: string | null;
  externalLink?: string | null;
  workspaceId?: string;
  status?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export function toProject(dto: ProjectDto): LocalProject {
  return {
    id: dto.id,
    name: dto.name,
    code: dto.code,
    externalLink: dto.externalLink,
    workspaceId: dto.workspaceId,
    status: dto.status,
    createdAt: dto.createdAt,
  };
}

export interface LocalWorkspace {
  id: string;
  name: string;
  ownerId: string;
  plan: string;
  createdAt: string;
  members: string[];
  roleLabels?: Record<string, string>;
}

export function toWorkspace(dto: WorkspaceDto): LocalWorkspace {
  return {
    id: dto.id,
    name: dto.name,
    ownerId: dto.ownerId,
    plan: dto.plan.toLowerCase(),
    createdAt: dto.createdAt,
    members: [],
  };
}

export interface LocalPresenter {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  workspaceId: string;
  createdBy: string;
}

export function toPresenter(dto: PresenterDto): LocalPresenter {
  return {
    id: dto.id,
    name: dto.name,
    email: dto.email,
    phone: dto.phone,
    workspaceId: "",
    createdBy: "",
  };
}

export interface LocalVersion {
  id: string;
  versionNumber: number;
  content: string;
  createdBy: string | null;
  createdAt: string;
  description?: string;
  createdByName?: string;
}

export function toVersion(dto: VersionDto): LocalVersion {
  return {
    id: dto.id,
    versionNumber: dto.versionNumber,
    content: dto.content,
    createdBy: dto.createdBy,
    createdAt: dto.createdAt,
  };
}

export interface LocalComment {
  id: string;
  authorId: string;
  body: string;
  isResolved: boolean;
  createdAt: string;
  authorName?: string;
}

export function toComment(dto: CommentDto): LocalComment {
  return {
    id: dto.id,
    authorId: dto.authorId,
    body: dto.body,
    isResolved: dto.isResolved,
    createdAt: dto.createdAt,
  };
}

export interface LocalActivity {
  id: string;
  type: string;
  description: string;
  userId: string | null;
  createdAt: string;
}

export function toActivity(dto: ActivityDto): LocalActivity {
  return {
    id: dto.id,
    type: dto.type,
    description: dto.description,
    userId: dto.userId,
    createdAt: dto.createdAt,
  };
}

export interface LocalDebugLog {
  id: string;
  level: string;
  source: string;
  message: string;
  createdAt: string;
}

export function toDebugLog(dto: DebugLogDto): LocalDebugLog {
  return {
    id: dto.id,
    level: dto.level,
    source: dto.source,
    message: dto.message,
    createdAt: dto.createdAt,
  };
}

export interface LocalErrorReport {
  id: string;
  userId: string | null;
  screenshotUrl: string | null;
  description: string | null;
  status: string;
  createdAt: string;
}

export function toErrorReport(dto: ErrorReportDto): LocalErrorReport {
  return {
    id: dto.id,
    userId: dto.userId,
    screenshotUrl: dto.screenshotUrl,
    description: dto.description,
    status: dto.status,
    createdAt: dto.createdAt,
  };
}

export interface LocalUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: string;
  status: string;
  workspaceId: string | null;
  isSuperAdmin: boolean;
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
}

export function toUser(dto: UserDto): LocalUser {
  return {
    uid: dto.id,
    email: dto.email,
    displayName: dto.displayName,
    role: dto.role,
    status: dto.status,
    workspaceId: dto.workspaceId,
    isSuperAdmin: dto.isSuperAdmin,
    canCollaborate: dto.canCollaborate,
    isEditor: dto.isEditor,
    isRevisor: dto.isRevisor,
    canRevert: dto.canRevert,
    canViewAdmin: dto.canViewAdmin,
    canViewReports: dto.canViewReports,
    canViewActivityHistory: dto.canViewActivityHistory,
    canViewDebugLogs: dto.canViewDebugLogs,
    canAssign: dto.canAssign,
    requiresChecklist: dto.requiresChecklist,
  };
}

/** Status do backend em formato amigável para exibição (ex.: "EmRevisao" → "Em Revisão"). */
export function formatStatus(status: string): string {
  return status
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());
}
