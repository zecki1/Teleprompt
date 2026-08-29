export interface Script {
  id: string;
  projectId: string;
  workspaceId: string;
  title: string;
  content: string;
  status: ScriptStatus;
  isLocked: boolean;
  lockedBy?: string;
  version: number;
  createdBy?: string;
  folder: string | null;
  subfolder: string | null;
  lesson: string | null;
  isPlaceholder: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateScriptRequest {
  projectId: string;
  title: string;
  content?: string;
  folder?: string | null;
  subfolder?: string | null;
  lesson?: string | null;
  isPlaceholder?: boolean;
}

export interface UpdateScriptRequest {
  title?: string;
  content?: string;
  status?: ScriptStatus;
  folder?: string | null;
  subfolder?: string | null;
  lesson?: string | null;
}

export interface ParseRequest {
  content: string;
  paragraphsPerScene?: number;
}

export enum ScriptStatus {
  Rascunho = 0,
  EmRevisao = 1,
  Aprovado = 2,
  Gravado = 3,
  Concluido = 4
}

export interface ScriptVersion {
  id: string;
  versionNumber: number;
  content: string;
  createdBy?: string;
  createdAt: Date;
}

export interface CreateVersionRequest {
  content: string;
}

export interface Comment {
  id: string;
  authorId: string;
  body: string;
  isResolved: boolean;
  createdAt: Date;
}

export interface ChecklistItem {
  id?: string;
  label: string;
  required: boolean;
  isChecked: boolean;
  checkedBy?: string;
}

export interface ParsedScene {
  index: number;
  title: string;
  content: string;
  markers: ScriptMarker[];
}

export interface ScriptMarker {
  type: string;
  content: string;
  position: number;
}
