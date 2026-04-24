// Shared script types used across dashboard, editor, tp and exports

export type ScriptStatus =
  | "rascunho"
  | "em_revisao"
  | "revisao_realizada"
  | "aguardando_gravacao"
  | "gravado"
  | "rejeitado";

export type ScriptCategory = "video" | "podcast";

/** Maximum number of path segments supported */
export const MAX_PATH_DEPTH = 5;

/**
 * Unified script document shape.
 * `path` is the preferred way to store the folder hierarchy.
 * The legacy fields `folder`, `subfolder`, `lesson` are kept for
 * backward-compatible reads only.
 */
export interface ScriptDoc {
  id: string;
  title: string;
  project?: string;
  projectName?: string;
  projectId?: string;

  /** NEW: flexible folder path, e.g. ["Módulo 1", "UC 1", "Aula 1"] */
  path?: string[];

  /** @deprecated use path instead */
  folder?: string;
  /** @deprecated use path instead */
  subfolder?: string;
  /** @deprecated use path instead */
  lesson?: string;

  createdAt: string;
  status: ScriptStatus;
  category?: ScriptCategory;
  editorId?: string;
  editorName?: string;
  reviewerId?: string;
  reviewerName?: string;
  videomakerId?: string;
  videomakerName?: string;
  commentCount?: number;
  commentAuthors?: string[];
}

/** A node in the virtual folder tree built from scripts */
export interface FolderNode {
  /** Folder name at this level */
  name: string;
  /** Full path from root to this node */
  fullPath: string[];
  /** Children folders */
  children: Record<string, FolderNode>;
  /** Scripts that live directly in this folder */
  scripts: ScriptDoc[];
  /** Total scripts count including all descendants */
  totalScripts: number;
}
