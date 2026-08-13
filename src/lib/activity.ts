/**
 * Registro de atividades.
 *
 * O back-end .NET grava as atividades no servidor automaticamente (cada controller
 * adiciona um Activity ao operar). Estes helpers permanecem apenas para manter a
 * compatibilidade de assinatura com a UI — não escrevem mais no Firestore.
 */

export type ActivityAction =
  | "Editou" | "Gravou" | "Criou" | "Revisou" | "Comentou"
  | "ExcluiuRoteiro" | "ExcluiuPasta" | "ExcluiuProjeto"
  | "ExportouBackup" | "Reverteu" | "EditouProjeto"
  | "Cadastrou" | "Entrou" | "Saiu";

export interface ActivityData {
  userId: string;
  userName: string;
  userAvatar?: string | null;
  action: ActivityAction;
  scriptId?: string;
  scriptTitle?: string;
  projectId?: string | null;
  projectName?: string | null;
  folder?: string | null;
  subfolder?: string | null;
  lesson?: string | null;
  path?: string[] | null;
  workspaceId: string;
  snapshot?: Record<string, unknown> | null;
  snapshotIds?: string[] | null;
  metadata?: string | null;
  timestamp?: unknown;
}

/**
 * No-op: as atividades são registradas pelo back-end .NET.
 * Mantida para compatibilidade com os pontos de chamada existentes.
 */
export async function logActivity(_data: ActivityData): Promise<void> {
  // O back-end registra as atividades automaticamente nos controllers.
  return;
}

/**
 * Reverter uma atividade a partir do snapshot não é suportado pelo back-end .NET
 * (as atividades não armazenam snapshots). Retorna false para manter o contrato.
 */
export async function revertActivity(_activityId: string): Promise<boolean> {
  return false;
}
